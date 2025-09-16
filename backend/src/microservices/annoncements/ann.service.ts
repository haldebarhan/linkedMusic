import { injectable } from "tsyringe";
import { CatalogueRepository } from "../catalogues/catalogue.repository";
import { CreateAnnouncementDto, UpdateAnnouncementDto } from "./ann.dto";
import createError from "http-errors";
import { hasOwn, isEmptyValue } from "@/utils/functions/utilities";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";
import {
  applyDynamicValues,
  buildDocForIndex,
} from "@/utils/helpers/apply-dynamique-values";
import { AnnouncementRepository } from "./ann.repository";
import { SearchService } from "@/utils/services/search.service";
import { buildMeiliFilter } from "./meili-filters";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementService {
  constructor(
    private readonly catalogueRepository: CatalogueRepository,
    private annRepository: AnnouncementRepository,
    private readonly searchService: SearchService
  ) {}

  async create(userId: number, data: CreateAnnouncementDto, files: string[]) {
    let specialValues: Record<string, string> = {};
    try {
      const [serviceType, category] = await Promise.all([
        await this.getServiceType(data.serviceTypeId),
        await this.findCategory(data.categoryId),
      ]);
      const annData = this.buildAnnDTO(userId, serviceType, data, files);
      const fieldsByKey = new Map(
        category.CategoryField.map((cf) => [
          cf.field.key,
          { sf: cf, field: cf.field },
        ])
      );

      this.checkRequiredFields(fieldsByKey, data.values);
      const { id: annId } = await prisma.$transaction(async (tx) => {
        const ann = await tx.announcement.create({
          data: {
            title: annData.title,
            description: annData.description,
            ownerId: userId,
            images: files,
            serviceType: { connect: { id: annData.serviceTypeId } },
            price: annData.price ?? null,
            location: annData.location ?? null,
          },
        });
        specialValues = await applyDynamicValues({
          tx,
          announcementId: ann.id,
          values: data.values ?? {},
          fieldsByKey,
          mode: "create",
        });
        return { id: ann.id };
      });
      try {
        const doc = await buildDocForIndex(annId, specialValues);
        await SearchService.addOrUpdate(doc);
      } catch (e) {
        console.error("[meili] addOrUpdate failed", e);
      }
    } catch (error) {
      const status = error.status ?? 500;
      throw createError(status, error.message);
    }
  }

  async findOne(id: number) {
    const announcement = await this.annRepository.findOne(id);
    if (!announcement) throw createError(404, "announcement not found");
    return announcement;
  }

  async listByCategory(
    categorySlug: string,
    filters: Record<string, any>,
    page: number,
    limit: number,
    opts?: { q?: string; order?: Order }
  ) {
    const query = (opts?.q ?? "").trim();
    const meiliFilter = buildMeiliFilter(categorySlug, {
      styles: filters.styles,
      location: filters.location,
      serviceTypeId: filters.serviceTypeId,
      tag: filters.tag,
      serviceType: filters.serviceType,
    });

    const meiliSort =
      opts?.order === Order.ASC ? ["createdAt:asc"] : ["createdAt:desc"];

    const res = await SearchService.searchPaged(query, {
      filters: meiliFilter,
      sort: meiliSort,
      page,
      hitsPerPage: limit,
    });
    const hits = (res as any).hits ?? [];
    const total =
      (res as any).totalHits ?? (res as any).estimatedTotalHits ?? 0;
    const totalPage =
      Math.max((res as any).totalPages, 1) ??
      Math.max(Math.ceil(total / limit), 1);
    return {
      data: hits,
      metadata: {
        total,
        page,
        totalPage,
      },
    };
  }

  async removeAnnouncement(announcementId: number, userId: number) {
    const announcement = await this.findOne(announcementId);
    if (announcement.ownerId !== userId) throw createError(403, "Forbidden");
    const deleted = await this.annRepository.removeAnnouncement(
      announcement.id
    );
    try {
      await SearchService.deleteById(announcementId);
    } catch (e) {
      console.error("[meili] delete failed", e);
    }
    return deleted;
  }

  //   async update(
  //     announcementId: number,
  //     userId: number,
  //     dto: UpdateAnnouncementDto,
  //     files: string[]
  //   ) {
  //     const announcement = await this.findOne(announcementId);
  //     if (announcement.ownerId !== userId) throw createError(403, "Forbidden");
  //     const categories = await this.findCategory(announcement);
  //     const serviceType = await this.catalogueRepository.findOneServiceType({
  //       id: announcement.serviceTypeId,
  //     });

  //     if (!serviceType) throw createError(404, "service type not found");
  //     const fieldsByKey = new Map(
  //       category.CategoryField.map((cf) => [
  //         cf.field.key,
  //         { sf: cf, field: cf.field },
  //       ])
  //     );

  //     const missingRequired: string[] = [];
  //     for (const { sf, field } of fieldsByKey.values()) {
  //       if (
  //         sf.required &&
  //         hasOwn(dto.values, field.key) &&
  //         isEmptyValue(dto.values![field.key])
  //       ) {
  //         missingRequired.push(field.key);
  //       }
  //     }
  //     if (missingRequired.length)
  //       throw new Error(
  //         `Missing required dynamic fields: ${missingRequired.join(", ")}`
  //       );

  //     return await prisma.$transaction(async (tx) => {
  //       // champs "plats"
  //       const updated = await tx.announcement.update({
  //         where: { id: announcementId },
  //         data: {
  //           title: dto.title ?? undefined,
  //           description: dto.description ?? undefined,
  //           images: files ?? undefined,
  //           price: dto.price ?? undefined,
  //           location: dto.location ?? undefined,
  //         },
  //       });

  //       // valeurs dynamiques : on remplace uniquement les clés présentes
  //       if (dto.values && Object.keys(dto.values).length) {
  //         await applyDynamicValues({
  //           tx,
  //           announcementId,
  //           values: dto.values,
  //           fieldsByKey,
  //           mode: "replace-keys", // supprime la/les clé(s) ciblées et réécrit
  //         });
  //       }
  //       try {
  //         const doc = await buildDocForIndex(announcementId);
  //         await SearchService.addOrUpdate(doc); // update = upsert chez Meili
  //       } catch (e) {
  //         console.error("[meili] update failed", e);
  //       }

  //       return updated;
  //     });
  //   }

  private async getServiceType(id: number) {
    const serviceType = await this.catalogueRepository.findServiceType(id);
    if (!serviceType) throw createError(404, "Invalid Service Type");
    return serviceType;
  }

  private async findCategory(id: number) {
    const category = await this.catalogueRepository.findCategory(id);
    if (!category) throw createError(404, `Invalid Service Type for ID: ${id}`);
    return category;
  }

  private buildAnnDTO(
    userId: number,
    serviceType: any,
    data: CreateAnnouncementDto,
    images: string[]
  ) {
    const annData: any = {
      title: data.title,
      description: data.description,
      ownerId: userId,
      images: images ?? [],
      serviceTypeId: serviceType.id,
      categoryId: serviceType.categoryId,
      price: data.price ?? null,
      location: data.location ?? null,
      isPublished: true,
    };
    return annData;
  }

  private checkRequiredFields(fieldsByKey: any, values?: Record<string, any>) {
    // Vérifier les required du pivot
    const missingRequired: string[] = [];
    for (const { sf, field } of fieldsByKey.values()) {
      if (sf.required && !hasOwn(values, field.key)) {
        missingRequired.push(field.key);
      }
    }

    if (missingRequired.length) {
      throw new Error(
        `Missing required dynamic fields: ${missingRequired.join(", ")}`
      );
    }
  }

  private async assertCategoriesAllowed(
    tx: PrismaClient,
    serviceTypeId: number,
    categoryIds: number[]
  ) {
    const distinct = Array.from(new Set(categoryIds || []));
    if (!distinct.length) return;

    const count = await tx.categoryServiceType.count({
      where: { serviceTypeId, categoryId: { in: distinct } },
    });

    if (count !== distinct.length) {
      throw createError(
        400,
        "Certaines catégories ne sont pas compatibles avec ce serviceType"
      );
    }
  }
}
