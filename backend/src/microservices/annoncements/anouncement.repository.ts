import { PrismaClient, Announcement, Prisma } from "@prisma/client";
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
      where.fieldValues = {
        some: this.buildFieldFilters(filters.fieldFilters),
      };
    }

    return this.findWithPagination(
      pagination,
      where,
      this.defaultInclude
    ) as Promise<PaginatedResponse<AnnouncementWithDetails>>;
  }

  private buildFieldFilters(
    fieldFilters: Record<string, any>
  ): Prisma.AnnFieldValueWhereInput {
    const filters: Prisma.AnnFieldValueWhereInput[] = [];

    for (const [fieldKey, value] of Object.entries(fieldFilters)) {
      if (value === undefined || value === null) continue;

      const filter: Prisma.AnnFieldValueWhereInput = {
        field: { key: fieldKey },
      };

      // Type boolean
      if (typeof value === "boolean") {
        filter.valueBoolean = value;
      }
      // Type number ou range
      else if (typeof value === "number") {
        filter.valueNumber = value;
      } else if (
        typeof value === "object" &&
        (value.min !== undefined || value.max !== undefined)
      ) {
        filter.valueNumber = {};
        if (value.min !== undefined) filter.valueNumber.gte = value.min;
        if (value.max !== undefined) filter.valueNumber.lte = value.max;
      }
      // Type string
      else if (typeof value === "string") {
        filter.valueText = {
          contains: value,
          mode: "insensitive",
        };
      }
      // Type array (pour MULTISELECT)
      else if (Array.isArray(value)) {
        filter.options = {
          some: {
            option: {
              value: {
                in: value,
              },
            },
          },
        };
      }

      filters.push(filter);
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private readonly defaultInclude = {
    category: true,
    user: {
      select: {
        id: true,
        displayName: true,
        profileImage: true,
        email: true,
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
}
