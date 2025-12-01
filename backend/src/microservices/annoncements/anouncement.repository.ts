import {
  PrismaClient,
  Announcement,
  Prisma,
  AnnouncementStatus,
  Status,
} from "@prisma/client";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import {
  AnnouncementWithDetails,
  AnnouncementFilters,
  FieldValueInput,
} from "@/utils/types/relation-type";

import {
  PaginatedResponse,
  PaginationParams,
} from "@/utils/interfaces/pagination";
import { injectable } from "tsyringe";
import DatabaseService from "@/utils/services/database.service";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementRepository extends ReferenceBaseRepository<Announcement> {
  constructor() {
    super(prisma, "announcement");
  }

  async findByIdWithDetails(
    id: number
  ): Promise<AnnouncementWithDetails | null> {
    return this.findById(
      id,
      this.defaultInclude
    ) as Promise<AnnouncementWithDetails | null>;
  }

  async searchAndFilter(
    filters: AnnouncementFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AnnouncementWithDetails>> {
    const where: Prisma.AnnouncementWhereInput = {
      isPublished: true,
      status: "PUBLISHED",
      user: {
        status: {
          notIn: [
            Status.DESACTIVATED,
            Status.CLOSED,
            Status.SUSPENDED,
            Status.UNVERIFIED,
            Status.REMOVED,
          ],
        },
      },
    };

    // Filtre par catégorie
    if (filters.categorySlug) {
      where.category = {
        slug: filters.categorySlug,
      };
    }

    // Filtre par localisation
    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: "insensitive",
      };
    }

    if (filters.countryCode) {
      where.countryCode = {
        contains: filters.countryCode,
        mode: "insensitive",
      };
    }

    // Filtre par prix
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        {
          title: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Filtre par utilisateur
    if (filters.userId) {
      where.ownerId = filters.userId;
    }

    // Filtres dynamiques par champs
    if (filters.fieldFilters) {
      const fieldConditions = this.buildFieldFilters(filters.fieldFilters);
      if (fieldConditions.length > 0) {
        // Combine avec les autres conditions
        if (Array.isArray(where.AND)) {
          // Si AND est déjà un tableau, concatène
          where.AND = [...where.AND, ...fieldConditions];
        } else if (where.AND) {
          // Si AND est un objet unique, transforme-le en tableau puis concatène
          where.AND = [
            where.AND as Prisma.AnnouncementWhereInput,
            ...fieldConditions,
          ];
        } else {
          // Sinon, crée AND avec les conditions de champs
          where.AND = fieldConditions;
        }
      }
    }
    const orderBy: Prisma.AnnouncementOrderByWithRelationInput[] = [
      { isHighlighted: Order.DESC },
      {
        [pagination.sortBy || "createdAt"]: pagination.sortOrder || Order.DESC,
      },
    ];

    return this.findWithPagination(
      pagination,
      where,
      this.defaultInclude,
      orderBy
    ) as Promise<PaginatedResponse<AnnouncementWithDetails>>;
  }

  private buildFieldFilters(
    fieldFilters: Record<string, any>
  ): Prisma.AnnouncementWhereInput[] {
    const conditions: Prisma.AnnouncementWhereInput[] = [];

    for (const [fieldKey, value] of Object.entries(fieldFilters)) {
      if (value === undefined || value === null) continue;

      const fieldCondition: Prisma.AnnFieldValueWhereInput = {
        field: { key: fieldKey },
      };

      // Type boolean
      if (typeof value === "boolean") {
        fieldCondition.valueBoolean = value;
      }
      // Type number ou range
      else if (typeof value === "number") {
        fieldCondition.valueNumber = value;
      } else if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        (value.min !== undefined || value.max !== undefined)
      ) {
        fieldCondition.valueNumber = {};
        if (value.min !== undefined) fieldCondition.valueNumber.gte = value.min;
        if (value.max !== undefined) fieldCondition.valueNumber.lte = value.max;
      }
      // Type array (MULTISELECT)
      else if (Array.isArray(value) && value.length > 0) {
        fieldCondition.options = {
          some: {
            option: {
              value: { in: value },
            },
          },
        };
      }
      // Type string (RADIO ou TEXT)
      else if (typeof value === "string" && value.trim() !== "") {
        fieldCondition.OR = [
          {
            options: {
              some: {
                option: {
                  value: value,
                },
              },
            },
          },
          {
            valueText: {
              contains: value,
              mode: "insensitive",
            },
          },
        ];
      }

      conditions.push({
        fieldValues: {
          some: fieldCondition,
        },
      });
    }

    return conditions;
  }

  private readonly defaultInclude = {
    category: true,
    user: {
      select: {
        id: true,
        displayName: true,
        profileImage: true,
        email: true,
        badge: true,
      },
    },
    fieldValues: {
      include: {
        field: {
          include: {
            options: true,
          },
        },
        options: {
          include: {
            option: true,
          },
        },
      },
    },
    _count: { select: { contactRequests: true, Favorites: true } },
  };

  async createWithFieldValues(
    announcementData: Prisma.AnnouncementCreateInput,
    fieldValues: FieldValueInput[]
  ): Promise<AnnouncementWithDetails> {
    return this.transaction(async (prisma) => {
      // 1. Créer l'annonce
      const announcement = await prisma.announcement.create({
        data: announcementData,
      });

      // 2. Créer les valeurs de champs
      for (const fieldValue of fieldValues) {
        const data: Prisma.AnnFieldValueCreateInput = {
          announcement: { connect: { id: announcement.id } },
          field: { connect: { id: fieldValue.fieldId } },
          valueText: fieldValue.valueText,
          valueNumber: fieldValue.valueNumber,
          valueBoolean: fieldValue.valueBoolean,
          valueDate: fieldValue.valueDate,
          valueJson: fieldValue.valueJson,
        };

        const createdFieldValue = await prisma.annFieldValue.create({
          data,
        });

        // 3. Si c'est un MULTISELECT/CHECKBOX, créer les relations avec les options
        if (fieldValue.optionIds && fieldValue.optionIds.length > 0) {
          await prisma.annFieldValueOption.createMany({
            data: fieldValue.optionIds.map((optionId) => ({
              annFieldValueId: createdFieldValue.id,
              optionId,
            })),
          });
        }
      }

      // 4. Retourner l'annonce complète
      return prisma.announcement.findUnique({
        where: { id: announcement.id },
        include: this.defaultInclude,
      }) as Promise<AnnouncementWithDetails>;
    });
  }

  async updateWithFieldValues(
    id: number,
    announcementData: Prisma.AnnouncementUpdateInput,
    fieldValues?: FieldValueInput[]
  ): Promise<AnnouncementWithDetails> {
    return this.transaction(async (prisma) => {
      // 1. Mettre à jour l'annonce
      await prisma.announcement.update({
        where: { id },
        data: announcementData,
      });

      // 2. Si des valeurs de champs sont fournies
      if (fieldValues && fieldValues.length > 0) {
        for (const fieldValue of fieldValues) {
          // Supprimer l'ancienne valeur si elle existe
          await prisma.annFieldValue.deleteMany({
            where: {
              announcementId: id,
              fieldId: fieldValue.fieldId,
            },
          });

          // Créer la nouvelle valeur
          const data: Prisma.AnnFieldValueCreateInput = {
            announcement: { connect: { id } },
            field: { connect: { id: fieldValue.fieldId } },
            valueText: fieldValue.valueText,
            valueNumber: fieldValue.valueNumber,
            valueBoolean: fieldValue.valueBoolean,
            valueDate: fieldValue.valueDate,
            valueJson: fieldValue.valueJson,
          };

          const createdFieldValue = await prisma.annFieldValue.create({
            data,
          });

          // Créer les relations avec les options si nécessaire
          if (fieldValue.optionIds && fieldValue.optionIds.length > 0) {
            await prisma.annFieldValueOption.createMany({
              data: fieldValue.optionIds.map((optionId) => ({
                annFieldValueId: createdFieldValue.id,
                optionId,
              })),
            });
          }
        }
      }

      // 3. Retourner l'annonce complète
      return prisma.announcement.findUnique({
        where: { id },
        include: this.defaultInclude,
      }) as Promise<AnnouncementWithDetails>;
    });
  }

  async incrementViews(id: number): Promise<void> {
    await this.prisma.announcement.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async findByUserId(
    userId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AnnouncementWithDetails>> {
    return this.findWithPagination(
      pagination,
      { ownerId: userId },
      this.defaultInclude
    ) as Promise<PaginatedResponse<AnnouncementWithDetails>>;
  }

  async findHighlighted(
    categorySlug?: string,
    limit: number = 10
  ): Promise<AnnouncementWithDetails[]> {
    const where: Prisma.AnnouncementWhereInput = {
      isHighlighted: true,
      isPublished: true,
      status: "PUBLISHED",
      user: {
        status: {
          notIn: [
            Status.DESACTIVATED,
            Status.CLOSED,
            Status.SUSPENDED,
            Status.UNVERIFIED,
            Status.REMOVED,
          ],
        },
      },
    };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    return this.findAll({
      where,
      include: this.defaultInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    }) as Promise<AnnouncementWithDetails[]>;
  }

  async findSimilar(
    announcementId: number,
    limit: number = 5
  ): Promise<AnnouncementWithDetails[]> {
    const announcement = await this.findById(announcementId, {
      category: true,
    });

    if (!announcement) {
      return [];
    }

    return this.findAll({
      where: {
        id: { not: announcementId },
        categoryId: announcement.categoryId,
        isPublished: true,
        status: "PUBLISHED",
      },
      include: this.defaultInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    }) as Promise<AnnouncementWithDetails[]>;
  }

  async ListPendingAnnouncements(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { skip, take, where, order } = params;
    return await prisma.announcement.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: order ?? Order.DESC,
      },
    });
  }

  async approveAnnouncement(id: number) {
    return await prisma.announcement.update({
      where: { id },
      data: {
        status: AnnouncementStatus.PUBLISHED,
        isPublished: true,
      },
    });
  }

  async rejectAnnouncement(id: number) {
    return await prisma.announcement.update({
      where: { id },
      data: {
        status: AnnouncementStatus.REJECTED,
        isPublished: false,
      },
    });
  }

  async getUserMostViewAnnouncement(userId: number, limit = 5) {
    return await prisma.announcement.findMany({
      where: { ownerId: userId },
      orderBy: { views: Order.DESC },
      take: limit,
      include: { _count: { select: { contactRequests: true } } },
    });
  }

  async countUserTotalAnnouncementViews(userId: number) {
    return await prisma.announcement.aggregate({
      _sum: { views: true },
      where: { ownerId: userId },
    });
  }

  async countUserTotalActivePublications(userId: number) {
    return await prisma.announcement.count({
      where: {
        ownerId: userId,
        status: AnnouncementStatus.PUBLISHED,
        isPublished: true,
      },
    });
  }

  async myLikedAnnouncement(userId: number, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        announcement: {
          isPublished: true,
          status: AnnouncementStatus.PUBLISHED,
        },
      },
      skip,
      take: limit,
      select: {
        announcement: {
          select: { id: true, title: true, location: true, status: true },
        },
        createdAt: true,
      },
      orderBy: [
        { announcement: { isHighlighted: Order.DESC } },
        { createdAt: Order.DESC },
      ],
    });

    const announcements = favorites.map((f) => {
      return {
        likeAt: f.createdAt,
        ...f.announcement,
      };
    });
    return announcements;
  }

  async likeAnnouncement(userId: number, announcementId: number) {
    return await prisma.favorite.create({
      data: {
        userId,
        announcementId,
      },
    });
  }

  async unlikeAnnouncement(id: number) {
    return await prisma.favorite.delete({
      where: { id },
    });
  }

  async getOneFavorite(userId: number, announcementId: number) {
    return await prisma.favorite.findFirst({
      where: { userId, announcementId },
    });
  }

  async likeStatus(userId: number, announcementId: number) {
    return prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        _count: {
          select: { Favorites: true },
        },
        Favorites: {
          where: { userId },
          select: { id: true },
        },
      },
    });
  }
}
