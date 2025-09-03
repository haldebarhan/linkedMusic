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
  mapSort,
} from "@/utils/helpers/apply-dynamique-values";
import { AnnouncementRepository } from "./ann.repository";
import { buildWhere } from "./filter-builder";
import { SearchService } from "@/utils/services/search.service";
import { buildMeiliFilter } from "./meili-filters";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
type ListOpts = { q?: string; sort?: string };

@injectable()
export class AnnouncementService {
  constructor(
    private readonly catalogueRepository: CatalogueRepository,
    private annRepository: AnnouncementRepository
  ) {}

  async create(userId: number, data: CreateAnnouncementDto) {
    try {
      const serviceType = await this.getServiceType(data.serviceTypeId);
      const annData = this.buildAnnDTO(userId, serviceType, data);
      const fieldsByKey = new Map(
        serviceType.fields.map((sf) => [sf.field.key, { sf, field: sf.field }])
      );
      this.checkRequiredFields(fieldsByKey, data.values);
      return await prisma.$transaction(async (tx) => {
        const ann = await tx.announcement.create(annData);
        await applyDynamicValues({
          tx,
          announcementId: ann.id,
          values: data.values ?? {},
          fieldsByKey,
          mode: "create", // pas de suppression préalable
        });
        try {
          const doc = await buildDocForIndex(ann.id);
          await SearchService.addOrUpdate(doc);
        } catch (e) {
          console.error("[meili] addOrUpdate failed", e);
        }
        return ann;
      });
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
    opts?: ListOpts
  ) {
    const q = opts?.q?.trim();
    const sort = mapSort(opts?.sort);
    if (q) {
      const meiliFilter = buildMeiliFilter(categorySlug, filters);
      const { hits, estimatedTotalHits } = await SearchService.searchPaged(q, {
        filters: meiliFilter,
        sort,
        page,
        hitsPerPage: limit,
        facets: ["styles", "serviceType", "city", "pro"],
      });
      const total = estimatedTotalHits || 0;
      return {
        data: hits,
        metadata: {
          total,
          page,
          totalPage: Math.max(Math.ceil(total / limit), 1),
        },
      };
    }
    const where = await buildWhere(categorySlug, filters);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.annRepository.findAll(where, skip, limit),
      this.annRepository.count(where),
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

  async update(
    announcementId: number,
    userId: number,
    dto: UpdateAnnouncementDto
  ) {
    const announcement = await this.findOne(announcementId);
    if (announcement.ownerId !== userId) throw createError(403, "Forbidden");
    const serviceType = await this.catalogueRepository.findOneServiceType({
      id: announcement.serviceTypeId,
    });
    if (!serviceType) throw createError(404, "service type not found");
    const fieldsByKey = new Map(
      serviceType.fields.map((sf) => [sf.field.key, { sf, field: sf.field }])
    );

    const missingRequired: string[] = [];
    for (const { sf, field } of fieldsByKey.values()) {
      if (
        sf.required &&
        hasOwn(dto.values, field.key) &&
        isEmptyValue(dto.values![field.key])
      ) {
        missingRequired.push(field.key);
      }
    }
    if (missingRequired.length)
      throw new Error(
        `Missing required dynamic fields: ${missingRequired.join(", ")}`
      );

    return await prisma.$transaction(async (tx) => {
      // champs "plats"
      const updated = await tx.announcement.update({
        where: { id: announcementId },
        data: {
          title: dto.title ?? undefined,
          description: dto.description ?? undefined,
          images: dto.images ?? undefined,
          price: dto.price ?? undefined,
          location: dto.location ?? undefined,
        },
      });

      // valeurs dynamiques : on remplace uniquement les clés présentes
      if (dto.values && Object.keys(dto.values).length) {
        await applyDynamicValues({
          tx,
          announcementId,
          values: dto.values,
          fieldsByKey,
          mode: "replace-keys", // supprime la/les clé(s) ciblées et réécrit
        });
      }
      try {
        const doc = await buildDocForIndex(announcementId);
        await SearchService.addOrUpdate(doc); // update = upsert chez Meili
      } catch (e) {
        console.error("[meili] update failed", e);
      }

      return updated;
    });
  }

  private async getServiceType(id: number) {
    const serviceType = await this.catalogueRepository.findServiceType(id);
    if (!serviceType) throw createError(404, "Invalid Service Type");
    return serviceType;
  }

  private buildAnnDTO(
    userId: number,
    serviceType: any,
    data: CreateAnnouncementDto
  ) {
    const annData: any = {
      title: data.title,
      description: data.description,
      ownerId: userId,
      images: data.images ?? [],
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
}
