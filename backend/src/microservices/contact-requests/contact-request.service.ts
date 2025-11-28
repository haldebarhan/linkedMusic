import { injectable } from "tsyringe";
import { ContactRequestRepository } from "./contact-request.repository";
import { AnnouncementRepository } from "../annoncements/anouncement.repository";
import { CreateContactRequestDTO } from "./contact-request.dto";
import createError from "http-errors";
import {
  ContactRequestStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
} from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";
import { ENV } from "@/config/env";
import { BrevoMailService } from "@/utils/services/brevo-mail.service";
import { MatchingService } from "../matching/matching.service";
import { UserRepository } from "../users/user.repository";
import { NotificationRepository } from "../notifications/notification.repository";
import { getIo } from "@/sockets/io-singleton";
import { userRoom } from "@/sockets/room";
import { EVENTS } from "@/sockets/event";
import logger from "@/config/logger";
import { countUnread } from "@/sockets/handlers/notification.handler";
import { S3Service } from "@/utils/services/s3.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: S3Service = S3Service.getInstance();

@injectable()
export class ContactRequestService {
  constructor(
    private readonly contactRepository: ContactRequestRepository,
    private readonly announcementRepository: AnnouncementRepository,
    private readonly mailService: BrevoMailService,
    private readonly matchingService: MatchingService,
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository
  ) {}

  async create(userId: number, dto: CreateContactRequestDTO) {
    const { announcementId } = dto;
    const annoncement = await this.announcementRepository.findByIdWithDetails(
      announcementId
    );
    if (!annoncement) {
      throw createError(404, "Annonce non trouvée ou non disponible");
    }

    if (annoncement.ownerId === userId) {
      throw createError(
        400,
        "Vous ne pouvez pas demander une mise en relation sur votre propre annonce"
      );
    }

    const existingRequest = await this.contactRepository.existingContactRequest(
      announcementId,
      userId
    );

    if (existingRequest) {
      if (existingRequest.status === ContactRequestStatus.PENDING) {
        throw createError(
          400,
          "Vous avez déjà une demande en attente pour cette annonce"
        );
      }
      if (existingRequest.status === ContactRequestStatus.ACCEPTED) {
        throw createError(400, "Votre demande a déjà été acceptée");
      }
    }
    const create = await this.contactRepository.create(userId, dto);
    const [userHasSubscription, requester] = await Promise.all([
      this.matchingService.hasActiveSubscription(annoncement.ownerId),
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    const requesterName = userHasSubscription
      ? requester.displayName!
      : "Un utilisateur de ZikMuzik";
    await Promise.all([
      this.mailService.sendContactRequestReceivedMail({
        to: annoncement.user.email!,
        ownerName: annoncement.user.displayName!,
        requesterName: requesterName,
        announcementTitle: annoncement.title,
        announcementId: annoncement.id,
        message: userHasSubscription
          ? dto.message || ""
          : "Contenu réservé aux abonnés. Abonnez-vous pour voir le message complet.",
      }),
      this.notifyCreatedRequest(
        annoncement.ownerId,
        requesterName,
        annoncement
      ),
    ]);
    return create;
  }

  async getAnnouncementRequests(userId: number, announcementId: number) {
    const annoncement = await this.announcementRepository.findById(
      announcementId
    );
    if (!annoncement) {
      throw createError(404, "Annonce non trouvée ou non disponible");
    }

    if (annoncement.ownerId !== userId) {
      throw createError(
        403,
        "Vous n'êtes pas le propriétaire de cette annonce"
      );
    }
    const requests = await this.contactRepository.getAnnouncementRequests(
      announcementId
    );

    await Promise.all(
      requests.map(async (r) => {
        r.requester.profileImage = await minioService.generatePresignedUrl(
          ENV.AWS_S3_DEFAULT_BUCKET,
          r.requester.profileImage
        );
      })
    );
    return requests;
  }

  async acceptRequest(userId: number, requestId: number) {
    const request = await this.contactRepository.findRequest(requestId);
    if (!request) throw createError(404, "Demande non trouvée");
    if (request.announcement.ownerId !== userId)
      throw createError(
        403,
        "Vous n'êtes pas autorisé à répondre à cette demande"
      );
    if (request.status !== ContactRequestStatus.PENDING)
      throw createError(400, "Cette demande a déjà été traitée");
    const hasActiveSubscription = await this.checkActiveSubscription(userId);
    if (!hasActiveSubscription)
      throw createError(
        403,
        "Vous devez avoir un abonnement actif pour accepter des demandes de mise en relation"
      );

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.contactRequest.update({
        where: { id: requestId },
        data: {
          status: ContactRequestStatus.ACCEPTED,
          respondedAt: new Date(),
        },
        include: {
          requester: {
            select: {
              id: true,
              displayName: true,
              profileImage: true,
              location: true,
            },
          },
        },
      });

      const notification = await this.notifyRequestAccepted(
        request.requesterId,
        request.announcement.title,
        request.announcementId
      );

      try {
        const io = getIo();
        io.to(userRoom(request.requesterId)).emit(EVENTS.NOTIFICATION_NEW, {
          notification,
          type: NotificationType.CONTACT_REQUEST_ACCEPTED,
        });
        io.to(userRoom(request.requesterId)).emit(EVENTS.NOTIFICATION_UNREAD, {
          total: await countUnread(request.requesterId),
        });
      } catch (error) {
        logger.log("Erreur lors de l'émission Socket.IO:", error);
      }

      const existingConversation = await tx.conversation.findFirst({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: request.requesterId,
            },
            {
              senderId: request.requesterId,
              receiverId: userId,
            },
          ],
        },
      });

      let conversation;
      if (!existingConversation) {
        conversation = await tx.conversation.create({
          data: {
            senderId: request.requesterId,
            receiverId: userId,
            announcementId: request.announcementId,
            contactRequestId: requestId,
          },
        });
      } else {
        conversation = existingConversation;
      }
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: updatedRequest.requesterId,
          content: updatedRequest.message || "Mise en relation acceptée",
        },
      });
      return { request: updatedRequest, conversation };
    });
    return result.request;
  }

  /**
   * Obtenir la demande de l'utilisateur pour une annonce spécifique
   */
  async getUserRequestForAnnouncement(userId: number, announcementId: number) {
    const request = await prisma.contactRequest.findUnique({
      where: {
        announcementId_requesterId: {
          announcementId,
          requesterId: userId,
        },
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            location: true,
          },
        },
      },
    });

    return request;
  }

  private async checkActiveSubscription(userId: number): Promise<boolean> {
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ endAt: null }, { endAt: { gte: new Date() } }],
      },
    });
    return !!activeSubscription;
  }

  /**
   * Rejeter une demande de mise en relation
   */
  async rejectRequest(userId: number, requestId: number) {
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        announcement: true,
      },
    });

    if (!request) {
      throw createError(404, "Demande non trouvée");
    }

    if (request.announcement.ownerId !== userId) {
      throw createError(
        403,
        "Vous n'êtes pas autorisé à répondre à cette demande"
      );
    }

    if (request.status !== ContactRequestStatus.PENDING) {
      throw createError(400, "Cette demande a déjà été traitée");
    }

    const hasActiveSubscription = await this.checkActiveSubscription(userId);
    if (!hasActiveSubscription) {
      throw createError(
        403,
        "Vous devez avoir un abonnement actif pour répondre aux demandes"
      );
    }

    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: {
        status: ContactRequestStatus.REJECTED,
        respondedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            profileImage: true,
            location: true,
          },
        },
      },
    });

    const notification = await this.notifyRequestRejected(
      request.requesterId,
      request.announcement.title,
      request.announcementId
    );

    try {
      const io = getIo();
      io.to(userRoom(request.requesterId)).emit(EVENTS.NOTIFICATION_NEW, {
        notification,
        type: NotificationType.CONTACT_REQUEST_REJECTED,
      });

      io.to(userRoom(request.requesterId)).emit(EVENTS.NOTIFICATION_UNREAD, {
        total: await countUnread(request.requesterId),
      });
    } catch (error) {
      logger.log("Erreur lors de l'émission Socket.IO:", error);
    }

    return updatedRequest;
  }

  /**
   * Annuler sa propre demande
   */
  async cancelRequest(userId: number, requestId: number) {
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw createError(404, "Demande non trouvée");
    }

    if (request.requesterId !== userId) {
      throw createError(
        403,
        "Vous n'êtes pas autorisé à annuler cette demande"
      );
    }

    if (request.status !== ContactRequestStatus.PENDING) {
      throw createError(
        400,
        "Vous ne pouvez annuler qu'une demande en attente"
      );
    }

    const updatedRequest = await prisma.contactRequest.delete({
      where: { id: requestId },
    });

    return updatedRequest;
  }

  private async notifyCreatedRequest(
    ownerId: number,
    requesterName: string,
    annoncement: any
  ) {
    const notification = await this.notificationRepository.notify({
      userId: ownerId,
      type: NotificationType.CONTACT_REQUEST_RECEIVED,
      title: "Nouvelle demande de mise en relation",
      message: `${requesterName} a demandé une mise en relation pour votre annonce "${annoncement.title}".`,
      actionUrl: `${ENV.FRONTEND_URL}/profile/announcements/${annoncement.id}`,
    });

    try {
      const io = getIo();
      io.to(userRoom(ownerId)).emit(EVENTS.NOTIFICATION_NEW, {
        notification,
        type: NotificationType.CONTACT_REQUEST_RECEIVED,
      });
      io.to(userRoom(ownerId)).emit(EVENTS.NOTIFICATION_UNREAD, {
        total: await countUnread(ownerId),
      });
    } catch (error) {
      console.error("Erreur lors de l'émission Socket.IO:", error);
    }

    return notification;
  }

  private async notifyRequestAccepted(
    requesterId: number,
    announcementTitle: string,
    announcementId: number
  ) {
    return await this.notificationRepository.notify({
      userId: requesterId,
      type: NotificationType.CONTACT_REQUEST_ACCEPTED,
      title: "Mise en relation acceptée",
      message: `Votre demande de mise en relation pour l'annonce: "${announcementTitle} a été acceptée".`,
      actionUrl: `${ENV.FRONTEND_URL}/announcemnts/details/${announcementId}`,
    });
  }

  private async notifyRequestRejected(
    requesterId: number,
    announcementTitle: string,
    announcementId: number
  ) {
    return await this.notificationRepository.notify({
      userId: requesterId,
      title: "Mise en relation rejetée",
      type: NotificationType.CONTACT_REQUEST_REJECTED,
      message: `Votre demande de mise en relation pour l'annonce: "${announcementTitle} a été rejetée".`,
      actionUrl: `${ENV.FRONTEND_URL}/announcemnts/details/${announcementId}`,
    });
  }
}
