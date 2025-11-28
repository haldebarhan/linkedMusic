import { injectable } from "tsyringe";
import { AnnouncementRepository } from "./anouncement.repository";
import {
  AnnouncementQueryDto,
  AnnouncementResponseDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./announcement.dto";
import {
  AnnouncementStatus,
  NotificationType,
  PlanPeriod,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import {
  AnnouncementWithDetails,
  FieldValueInput,
} from "@/utils/types/relation-type";
import {
  PaginatedResponse,
  PaginationParams,
} from "@/utils/interfaces/pagination";
import { Order } from "@/utils/enums/order.enum";
import createError from "http-errors";
import { ENV } from "@/config/env";
import {
  definedEntries,
  mergeFileList,
} from "@/utils/functions/merge-fileList";
import { BrevoMailService } from "@/utils/services/brevo-mail.service";
import { NotificationRepository } from "../notifications/notification.repository";
import DatabaseService from "@/utils/services/database.service";
import { getIo } from "@/sockets/io-singleton";
import { userRoom } from "@/sockets/room";
import { EVENTS } from "@/sockets/event";
import logger from "@/config/logger";
import { countUnread } from "@/sockets/handlers/notification.handler";
import { AnnouncementViewRepository } from "../announcement-views/announcement-views.repository";
import { S3Service } from "@/utils/services/s3.service";
import { SubscriptionRepository } from "../subscriptions/subscription.repository";
const minioService: S3Service = S3Service.getInstance();
const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementService {
  constructor(
    private readonly announcementRepository: AnnouncementRepository,
    private readonly mailService: BrevoMailService,
    private readonly notificationRepository: NotificationRepository,
    private readonly announcementViewRepository: AnnouncementViewRepository,
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  async createAnnouncement(ownerId: number, dto: CreateAnnouncementDto) {
    const ownerSubscription =
      await this.subscriptionRepository.findActiveByUser(ownerId);
    const isPremium =
      (ownerSubscription &&
        ["ANNUAL", "SEMIANNUAL"].includes(ownerSubscription.plan.period)) ||
      false;

    const announcementData: Prisma.AnnouncementCreateInput = {
      title: dto.title,
      description: dto.description,
      price: dto.price,
      priceUnit: dto.priceUnit,
      negotiable: dto.negotiable ?? false,
      location: dto.location,
      country: dto.country,
      city: dto.city,
      images: dto.images ?? [],
      videos: dto.videos ?? [],
      audios: dto.audios ?? [],
      status: AnnouncementStatus.PENDING_APPROVAL,
      isPublished: false,
      isHighlighted: isPremium,
      highlightExpiredAt: ownerSubscription
        ? ownerSubscription.endAt
        : undefined,
      user: {
        connect: { id: ownerId },
      },
      category: {
        connect: { id: dto.categoryId },
      },
    };

    const fieldValues: FieldValueInput[] = dto.fieldValues.map((fv) => ({
      fieldId: fv.fieldId,
      valueText: fv.valueText,
      valueNumber: fv.valueNumber,
      valueBoolean: fv.valueBoolean,
      valueDate: fv.valueDate,
      valueJson: fv.valueJson,
      optionIds: fv.optionIds,
    }));

    const announcement =
      await this.announcementRepository.createWithFieldValues(
        announcementData,
        fieldValues
      );

    return this.mapToResponseDto(announcement);
  }

  /**
   * Obtenir une annonce par son ID
   */
  async getAnnouncementById(id: number): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      id
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${id} introuvable`);
    }

    // Incrémenter les vues
    await this.announcementRepository.incrementViews(id);

    return this.mapToResponseDto(announcement);
  }

  async getUserAnnouncementById(
    id: number,
    ownerId: number
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      id
    );
    if (!announcement) {
      throw createError(404, `Annonce avec l'ID ${id} introuvable`);
    }

    if (announcement.ownerId !== ownerId) {
      throw createError(403, "Unauthorized");
    }
    return this.mapToResponseDto(announcement);
  }

  /**
   * Mettre à jour une annonce
   */
  async updateAnnouncement(
    id: number,
    dto: UpdateAnnouncementDto,
    userId: number
  ): Promise<AnnouncementResponseDto> {
    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const ann = await this.announcementRepository.findByIdWithDetails(id);

    if (!ann) {
      throw new Error(`Annonce avec l'ID ${id} introuvable`);
    }

    if (ann.ownerId !== userId) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette annonce");
    }

    const removed = dto.removedFiles ?? [];
    const finalImages = mergeFileList(ann.images, dto.images ?? [], removed);
    const finalVideos = mergeFileList(ann.videos, dto.videos ?? [], removed);
    const finalAudios = mergeFileList(ann.audios, dto.audios ?? [], removed);

    const scalarUpdate = definedEntries({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      priceUnit: dto.priceUnit,
      negotiable: dto.negotiable,
      location: dto.location,
      country: dto.country,
      city: dto.city,
      status: dto.status,
      isPublished: dto.isPublished,
      isHighlighted: dto.isHighlighted,
    });

    // Si l'annonce est publiée, définir la date de publication
    if (dto.isPublished && !ann.publishedAt) {
      (scalarUpdate as any).publishedAt = new Date();
    }

    // Préparer les valeurs de champs si fournies
    const fieldValues: FieldValueInput[] | undefined = dto.fieldValues?.length
      ? (dto.fieldValues.map((fv) =>
          definedEntries({
            fieldId: fv.fieldId,
            valueText: fv.valueText,
            valueNumber: fv.valueNumber,
            valueBoolean: fv.valueBoolean,
            valueDate: fv.valueDate,
            valueJson: fv.valueJson,
            optionIds: fv.optionIds,
          })
        ) as FieldValueInput[])
      : undefined;

    const updateData: Prisma.AnnouncementUpdateInput = {
      ...scalarUpdate,
      images: { set: finalImages },
      videos: { set: finalVideos },
      audios: { set: finalAudios },
    };

    // Mettre à jour l'annonce
    const updated = await this.announcementRepository.updateWithFieldValues(
      id,
      updateData,
      fieldValues
    );
    if (removed.length) {
      const actuallyRemoved = ann.images
        .concat(ann.videos, ann.audios)
        .filter((f) => removed.includes(f));
      await Promise.allSettled(
        actuallyRemoved.map((f) =>
          minioService.deleteFile(ENV.AWS_S3_DEFAULT_BUCKET, f)
        )
      );
    }
    return this.mapToResponseDto(updated);
  }

  /**
   * Supprimer une annonce
   */
  async deleteAnnouncement(id: number, userId: number): Promise<void> {
    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const announcement = await this.announcementRepository.findByIdWithDetails(
      id
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${id} introuvable`);
    }

    if (announcement.ownerId !== userId) {
      throw new Error("Vous n'êtes pas autorisé à supprimer cette annonce");
    }

    const files = announcement.audios.concat(
      announcement.videos,
      announcement.images
    );

    await Promise.all(
      files.map(async (file) => {
        if (!file.startsWith("https")) {
          await minioService.deleteFile(ENV.AWS_S3_DEFAULT_BUCKET, file);
        }
      })
    );

    await this.announcementRepository.delete(id);
  }

  /**
   * Rechercher et filtrer les annonces
   */
  async searchAnnouncements(
    query: AnnouncementQueryDto
  ): Promise<PaginatedResponse<AnnouncementResponseDto>> {
    const pagination: PaginationParams = {
      page: query.page ? +query.page : 1,
      limit: query.limit ? +query.limit : 20,
      sortBy: query.sortBy ?? "createdAt",
      sortOrder: (query.sortOrder as Order) ?? Order.DESC,
    };

    // Parser les filtres de champs si fournis
    let fieldFilters: Record<string, any> | undefined;
    if (query.fieldFilters) {
      try {
        fieldFilters = JSON.parse(query.fieldFilters);
      } catch (error) {
        throw new Error("Format de filtres de champs invalide");
      }
    }

    const filters = {
      categorySlug: query.categorySlug,
      city: query.city,
      countryCode: query.country === "ALL" ? undefined : query.country,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search,
      fieldFilters,
    };
    const result = await this.announcementRepository.searchAndFilter(
      filters,
      pagination
    );

    // Utiliser la méthode helper pour normaliser et mapper
    return this.normalizePaginatedResponse<AnnouncementResponseDto>(
      result,
      (ann) => this.mapToResponseDto(ann)
    );
  }

  /**
   * Obtenir les annonces d'un utilisateur
   */
  async getUserAnnouncements(
    userId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AnnouncementResponseDto>> {
    const result = await this.announcementRepository.findByUserId(
      userId,
      pagination
    );

    // Utiliser la méthode helper pour normaliser et mapper
    return this.normalizePaginatedResponse<AnnouncementResponseDto>(
      result,
      (ann) => this.mapToResponseDto(ann)
    );
  }

  /**
   * Obtenir les annonces mises en avant
   */
  async getHighlightedAnnouncements(
    categorySlug?: string,
    limit: number = 10
  ): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.announcementRepository.findHighlighted(
      categorySlug,
      limit
    );

    return announcements.map((ann) => this.mapToResponseDto(ann));
  }

  /**
   * Obtenir les annonces similaires
   */
  async getSimilarAnnouncements(
    announcementId: number,
    limit: number = 5
  ): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.announcementRepository.findSimilar(
      announcementId,
      limit
    );

    return announcements.map((ann) => this.mapToResponseDto(ann));
  }

  /**
   * Publier une annonce (changer son statut)
   */
  async publishAnnouncement(
    id: number,
    userId: number
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      id
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${id} introuvable`);
    }

    if (announcement.ownerId !== userId) {
      throw new Error("Vous n'êtes pas autorisé à publier cette annonce");
    }

    const updateData: Prisma.AnnouncementUpdateInput = {
      status: AnnouncementStatus.PENDING_APPROVAL,
      isPublished: true,
      publishedAt: new Date(),
    };

    const updatedAnnouncement =
      await this.announcementRepository.updateWithFieldValues(id, updateData);

    return this.mapToResponseDto(updatedAnnouncement);
  }

  /**
   * Archiver une annonce
   */
  async archiveAnnouncement(
    id: number,
    userId: number
  ): Promise<AnnouncementResponseDto> {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      id
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${id} introuvable`);
    }

    if (announcement.ownerId !== userId) {
      throw new Error("Vous n'êtes pas autorisé à archiver cette annonce");
    }

    const updateData: Prisma.AnnouncementUpdateInput = {
      status: AnnouncementStatus.ARCHIVED,
      isPublished: false,
    };

    const updatedAnnouncement =
      await this.announcementRepository.updateWithFieldValues(id, updateData);

    return this.mapToResponseDto(updatedAnnouncement);
  }

  async approveAnnouncement(announcementId: number) {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      announcementId
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${announcementId} introuvable`);
    }
    const approved = await this.announcementRepository.approveAnnouncement(
      announcementId
    );

    const user = await prisma.user.findUnique({
      where: { id: announcement.ownerId },
    });
    if (user) {
      await this.mailService.sendAnnouncementApprovedMail({
        to: user.email,
        userName:
          user.displayName ??
          `${user.firstName?.concat(" ", user.lastName ?? "")}`,
        announcementId: announcement.id,
        announcementTitle: announcement.title,
      });
      const notification = await this.notifyRequestAccepted(
        announcement.ownerId,
        announcement
      );

      try {
        const io = getIo();
        io.to(userRoom(announcement.ownerId)).emit(EVENTS.NOTIFICATION_NEW, {
          notification,
          type: NotificationType.ANNOUNCEMENT_APPROVED,
        });

        io.to(userRoom(announcement.ownerId)).emit(EVENTS.NOTIFICATION_UNREAD, {
          total: await countUnread(announcement.ownerId),
        });
      } catch (error) {
        logger.log("Erreur lors de l'émission Socket.IO:", error);
      }
    }

    return approved;
  }

  async likeAnnouncement(userId: number, announcementId: number) {
    const announcement = await this.announcementRepository.findById(
      announcementId
    );
    if (!announcement) {
      throw createError(404, `Annonce avec l'ID ${announcementId} introuvable`);
    }

    await this.announcementRepository.likeAnnouncement(userId, announcementId);

    const ann = await this.announcementRepository.likeStatus(
      userId,
      announcementId
    );
    if (!ann) {
      throw createError(404, `Data not found`);
    }
    const isLiked = (ann.Favorites.length ?? 0) > 0;
    const totalLikes = ann?._count?.Favorites ?? 0;
    return {
      isLiked,
      totalLikes,
    };
  }

  async unlikeAnnouncement(userId: number, announcementId: number) {
    const favorite = await this.announcementRepository.getOneFavorite(
      userId,
      announcementId
    );
    if (!favorite) {
      throw createError(
        404,
        `Aucun like trouvé pour l'annonce avec ID ${announcementId}`
      );
    }
    await this.announcementRepository.unlikeAnnouncement(favorite.id);
    const ann = await this.announcementRepository.likeStatus(
      userId,
      announcementId
    );
    if (!ann) {
      throw createError(404, `Data not found`);
    }
    const isLiked = (ann.Favorites.length ?? 0) > 0;
    const totalLikes = ann?._count?.Favorites ?? 0;
    return {
      isLiked,
      totalLikes,
    };
  }

  async rejectAnnouncement(announcementId: number, reason: string) {
    const announcement = await this.announcementRepository.findByIdWithDetails(
      announcementId
    );

    if (!announcement) {
      throw new Error(`Annonce avec l'ID ${announcementId} introuvable`);
    }
    const rejected = await this.announcementRepository.rejectAnnouncement(
      announcementId
    );

    const user = await prisma.user.findUnique({
      where: { id: announcement.ownerId },
    });
    if (user) {
      await this.mailService.sendAnnouncementRejectedMail({
        to: user.email!,
        userName: user.displayName!,
        announcementId: announcement.id,
        announcementTitle: announcement.title,
        reason,
      });

      const notification = await this.notifyRequestRejected(
        announcement.ownerId,
        announcement,
        reason
      );

      try {
        const io = getIo();
        io.to(userRoom(announcement.ownerId)).emit(EVENTS.NOTIFICATION_NEW, {
          notification,
          type: NotificationType.ANNOUNCEMENT_REJECTED,
        });
        io.to(userRoom(announcement.ownerId)).emit(EVENTS.NOTIFICATION_UNREAD, {
          total: await countUnread(announcement.ownerId),
        });
      } catch (error) {
        logger.log("Erreur lors de l'émission Socket.IO:", error);
      }
    }
    return rejected;
  }

  async listPendingAnnouncements(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.announcementRepository.ListPendingAnnouncements({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.announcementRepository.count(where),
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async countUserTotalAnnoucements(userId: number) {
    return await this.announcementRepository.count({ ownerId: userId });
  }

  async recentViews(userId: number, pagination: PaginationParams) {
    const recentViews = await this.announcementViewRepository.recentViews(
      userId,
      pagination
    );
    const announcements = await Promise.all(
      recentViews.map(async (rv) => {
        const { announcement } = rv;
        const [audios, videos, images] = await Promise.all([
          this.generateUrl(announcement.audios),
          this.generateUrl(announcement.videos),
          this.generateUrl(announcement.images),
        ]);

        return {
          viewsId: rv.id,
          viewedAt: rv.viewedAt,
          announcement: {
            ...announcement,
            audios,
            videos,
            images,
          },
        };
      })
    );
    return announcements;
  }

  async addToRecentViews(userId: number, announcementId: number) {
    const announcement = await this.announcementRepository.findById(
      announcementId
    );
    if (!announcement) {
      throw createError(404, `Annonce avec l'ID ${announcementId} introuvable`);
    }

    return await this.announcementViewRepository.create(userId, announcementId);
  }

  async removeRecentView(id: number) {
    const view = await this.announcementViewRepository.getOne(id);
    if (!view) {
      throw createError(404, `Annonce avec l'ID ${id} introuvable`);
    }
    return await this.announcementViewRepository.remove(id);
  }

  async removeAll(userId: number) {
    return await this.announcementViewRepository.removeAll(userId);
  }

  async likeStatus(userId: number, announcementId: number) {
    const announcement = await this.announcementRepository.likeStatus(
      userId,
      announcementId
    );
    if (!announcement) {
      throw createError(404, `Data not found`);
    }
    const isLiked = (announcement.Favorites.length ?? 0) > 0;
    const totalLikes = announcement?._count?.Favorites ?? 0;
    return {
      isLiked,
      totalLikes,
    };
  }

  async myLikedAnnouncement(userId: number, pagination: PaginationParams) {
    const where = {
      Favorites: {
        some: { userId },
      },
      isPublished: true,
      status: AnnouncementStatus.PUBLISHED,
    };
    const [data, total] = await Promise.all([
      this.announcementRepository.myLikedAnnouncement(userId, pagination),
      this.announcementRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page: pagination.page!,
        totalPage: Math.ceil(total / pagination.limit!),
      },
    };
  }

  /**
   * Mapper une annonce vers un DTO de réponse
   */
  private mapToResponseDto(
    announcement: AnnouncementWithDetails
  ): AnnouncementResponseDto & {
    likes?: number;
    contacts?: number;
  } {
    return {
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      price: announcement.price ?? undefined,
      priceUnit: announcement.priceUnit ?? undefined,
      negotiable: announcement.negotiable,
      location: announcement.location ?? undefined,
      country: announcement.country ?? undefined,
      city: announcement.city ?? undefined,
      images: announcement.images,
      videos: announcement.videos,
      audios: announcement.audios,
      status: announcement.status,
      isPublished: announcement.isPublished,
      isHighlighted: announcement.isHighlighted,
      views: announcement.views,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      publishedAt: announcement.publishedAt ?? undefined,
      expiresAt: undefined,
      likes: announcement._count?.Favorites ?? 0,
      contacts: announcement._count?.contactRequests ?? 0,
      category: {
        id: announcement.category.id,
        name: announcement.category.name,
        slug: announcement.category.slug,
        icon: announcement.category.icon ?? undefined,
      },
      owner: {
        id: announcement.user.id!,
        displayName: announcement.user.displayName ?? undefined,
        profileImage: announcement.user.profileImage ?? undefined,
      },
      fieldValues: announcement.fieldValues.map((fv) => ({
        field: {
          key: fv.field.key,
          label: fv.field.label,
          inputType: fv.field.inputType,
        },
        valueText: fv.valueText ?? undefined,
        valueNumber: fv.valueNumber ?? undefined,
        valueBoolean: fv.valueBoolean ?? undefined,
        valueDate: fv.valueDate ?? undefined,
        options:
          fv.options?.map((opt) => ({
            label: opt.option.label,
            value: opt.option.value,
          })) ?? [],
      })),
    };
  }

  private async notifyRequestAccepted(ownerId: number, announcement: any) {
    return await this.notificationRepository.notify({
      userId: ownerId,
      type: NotificationType.ANNOUNCEMENT_APPROVED,
      title: "Votre annonce a été approuvée",
      message: `Félicitations ! Votre annonce "${announcement.title}" a été approuvée et est maintenant en ligne.`,
      actionUrl: `${ENV.FRONTEND_URL}/profile/announcements/${announcement.id}`,
    });
  }

  private async notifyRequestRejected(
    ownerId: number,
    announcement: any,
    reason: string
  ) {
    return await this.notificationRepository.notify({
      userId: ownerId,
      type: NotificationType.ANNOUNCEMENT_REJECTED,
      title: "Votre annonce a été rejetée",
      message: `Nous sommes désolés de vous informer que votre annonce "${announcement.title}" a été rejetée. Raison : ${reason}`,
      actionUrl: `${ENV.FRONTEND_URL}/profile/announcements/${announcement.id}`,
    });
  }

  /**
   * Helper pour normaliser une réponse paginée
   * Adapté à la structure { data, pagination } du projet
   */
  private normalizePaginatedResponse<T>(
    result: any,
    mapper?: (item: any) => T
  ): PaginatedResponse<T> {
    if (result && result.data && result.pagination) {
      return {
        data: mapper ? result.data.map(mapper) : result.data,
        pagination: result.pagination,
      };
    }

    if (result && result.data && result.meta) {
      const page = result.meta.page;
      const limit = result.meta.limit;
      const total = result.meta.total;
      const totalPages = result.meta.totalPages || Math.ceil(total / limit);

      return {
        data: mapper ? result.data.map(mapper) : result.data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    if (result && result.data && result.total !== undefined) {
      const page = result.page;
      const limit = result.limit;
      const total = result.total;
      const totalPages = result.totalPages || Math.ceil(total / limit);

      return {
        data: mapper ? result.data.map(mapper) : result.data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    // Format avec items au lieu de data
    if (result && result.items) {
      const page = result.page || result.pagination?.page;
      const limit = result.limit || result.pagination?.limit;
      const total = result.total || result.pagination?.total;
      const totalPages = result.totalPages || Math.ceil(total / limit);

      return {
        data: mapper ? result.items.map(mapper) : result.items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    throw new Error(
      "Format de réponse paginée non reconnu. Vérifiez votre repository."
    );
  }

  private async generateUrl(files: string[]) {
    if (!files || files.length === 0) return [];
    return Promise.all(
      files.map((file) =>
        minioService.generatePresignedUrl(ENV.AWS_S3_DEFAULT_BUCKET, file)
      )
    );
  }
}
