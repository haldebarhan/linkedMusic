import { injectable } from "tsyringe";
import { AnnouncementRepository } from "./anouncement.repository";
import {
  AnnouncementQueryDto,
  AnnouncementResponseDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./announcement.dto";
import { AnnouncementStatus, Prisma } from "@prisma/client";
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
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
import {
  definedEntries,
  mergeFileList,
} from "@/utils/functions/merge-fileList";
const minioService: MinioService = MinioService.getInstance();

@injectable()
export class AnnouncementService {
  constructor(
    private readonly announcementRepository: AnnouncementRepository
  ) {}

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

  async createAnnouncement(ownerId: number, dto: CreateAnnouncementDto) {
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
      status: AnnouncementStatus.DRAFT,
      isPublished: false,
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
          minioService.deleteFile(ENV.MINIO_BUCKET_NAME, f)
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
      countryCode: query.country,
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
      status: AnnouncementStatus.PUBLISHED,
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

  /**
   * Mapper une annonce vers un DTO de réponse
   */
  private mapToResponseDto(
    announcement: AnnouncementWithDetails
  ): AnnouncementResponseDto {
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
}
