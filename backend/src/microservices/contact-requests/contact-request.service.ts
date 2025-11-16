import { injectable } from "tsyringe";
import { ContactRequestRepository } from "./contact-request.repository";
import { AnnouncementRepository } from "../annoncements/anouncement.repository";
import { CreateContactRequestDTO } from "./contact-request.dto";
import createError from "http-errors";
import {
  ContactRequestStatus,
  PrismaClient,
  SubscriptionStatus,
} from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
import { BrevoMailService } from "@/utils/services/brevo-mail.service";
import { MatchingService } from "../matching/matching.service";
import { UserRepository } from "../users/user.repository";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: MinioService = MinioService.getInstance();

@injectable()
export class ContactRequestService {
  constructor(
    private readonly contactRepository: ContactRequestRepository,
    private readonly announcementRepository: AnnouncementRepository,
    private readonly mailService: BrevoMailService,
    private readonly matchingService: MatchingService
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

    await this.mailService.sendContactRequestReceivedMail({
      to: annoncement.user.email!,
      ownerName: annoncement.user.displayName!,
      requesterName: userHasSubscription
        ? requester.displayName!
        : "Un utilisateur de Zikmusic",
      announcementTitle: annoncement.title,
      announcementId: annoncement.id,
      message: userHasSubscription
        ? dto.message || ""
        : "Contenu réservé aux abonnés. Abonnez-vous pour voir le message complet.",
    });
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
          ENV.MINIO_BUCKET_NAME,
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

      const existingConversation = await tx.conversation.findFirst({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: request.requesterId,
              announcementId: request.announcementId,
            },
            {
              senderId: request.requesterId,
              receiverId: userId,
              announcementId: request.announcementId,
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
    // Récupérer la demande
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
      include: {
        announcement: true,
      },
    });

    if (!request) {
      throw createError(404, "Demande non trouvée");
    }

    // Vérifier que l'utilisateur est le propriétaire de l'annonce
    if (request.announcement.ownerId !== userId) {
      throw createError(
        403,
        "Vous n'êtes pas autorisé à répondre à cette demande"
      );
    }

    // Vérifier que la demande est en attente
    if (request.status !== ContactRequestStatus.PENDING) {
      throw createError(400, "Cette demande a déjà été traitée");
    }

    // Vérifier que l'utilisateur a un abonnement actif
    const hasActiveSubscription = await this.checkActiveSubscription(userId);
    if (!hasActiveSubscription) {
      throw createError(
        403,
        "Vous devez avoir un abonnement actif pour répondre aux demandes"
      );
    }

    // Mettre à jour la demande
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

    // TODO: Envoyer une notification au demandeur
    // await this.notificationService.sendRequestRejectedNotification(updatedRequest);

    return updatedRequest;
  }

  /**
   * Annuler sa propre demande
   */
  async cancelRequest(userId: number, requestId: number) {
    // Récupérer la demande
    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw createError(404, "Demande non trouvée");
    }

    // Vérifier que l'utilisateur est le demandeur
    if (request.requesterId !== userId) {
      throw createError(
        403,
        "Vous n'êtes pas autorisé à annuler cette demande"
      );
    }

    // Vérifier que la demande est en attente
    if (request.status !== ContactRequestStatus.PENDING) {
      throw createError(
        400,
        "Vous ne pouvez annuler qu'une demande en attente"
      );
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.contactRequest.update({
      where: { id: requestId },
      data: {
        status: ContactRequestStatus.CANCELED,
      },
    });

    return updatedRequest;
  }
}
