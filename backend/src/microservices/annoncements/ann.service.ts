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
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
import { buildUpdateDTO } from "@/utils/helpers/build-ann-update-dto";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const minioService: MinioService = MinioService.getInstance();

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
        this.getServiceType(data.serviceTypeId),
        this.findCategory(data.categoryId),
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
            serviceTypeId: annData.serviceTypeId,
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

  async findAnnouncement(id: number, userId?: number) {
    const [announcement, document] = await Promise.all([
      this.findOne(id),
      SearchService.getDocument(id),
    ]);
    if (userId && announcement.ownerId !== userId)
      throw createError(403, "Forbidden");
    const files = announcement.images;
    const urls =
      files && Array.isArray(files) && files.length > 0
        ? await Promise.all(
            files.map((f) =>
              minioService.presignGetUrl(ENV.MINIO_BUCKET_NAME, f)
            )
          )
        : [];
    return { ...document, fichiers: urls };
  }

  async findAnnouncements(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.annRepository.findAll({ where, take: limit, skip, order }),
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
    if (announcement.images && announcement.images.length > 0) {
      await Promise.all(
        announcement.images.map((ann) =>
          minioService.deleteFile(ENV.MINIO_BUCKET_NAME, ann)
        )
      );
    }
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
    dto: UpdateAnnouncementDto,
    files: string[] = []
  ) {
    try {
      let specialValues: Record<string, string> = {};
      const announcement = await this.findOne(announcementId);
      if (announcement.ownerId !== userId) throw createError(403, "Forbidden");
      const category = await this.findCategory(dto.categoryId!);

      const updateDTO = await buildUpdateDTO({
        tx: prisma,
        annId: announcementId,
        base: dto,
        newFiles: files,
        fileToRemove: dto.removedFiles ?? [],
      });
      const fieldsByKey = new Map(
        category.CategoryField.map((cf) => [
          cf.field.key,
          { sf: cf, field: cf.field },
        ])
      );
      this.checkRequiredFields(fieldsByKey, dto.values);
      const { id: annId } = await prisma.$transaction(async (tx) => {
        const updated = await tx.announcement.update({
          where: { id: announcementId },
          data: {
            ...updateDTO,
          },
          include: {
            serviceType: {
              select: {
                slug: true,
                categories: {
                  select: { category: { select: { slug: true } } },
                },
              },
            },
            AnnValues: {
              include: { field: true, options: { include: { option: true } } },
            },
          },
        });
        specialValues = await applyDynamicValues({
          tx,
          announcementId: updated.id,
          values: dto.values ?? {},
          fieldsByKey,
          mode: "replace-keys",
        });
        return { id: updated.id };
      });
      try {
        const doc = await buildDocForIndex(annId, specialValues);
        await SearchService.deleteById(doc.id);
        await SearchService.addOrUpdate(doc);
        if (dto.removedFiles)
          await Promise.all(
            dto.removedFiles.map((rf) =>
              minioService.deleteFile(ENV.MINIO_BUCKET_NAME, rf)
            )
          );
      } catch (e) {
        console.error("[meili] addOrUpdate failed", e);
      }
    } catch (error) {
      const status = error.status ?? 500;
      throw createError(status, error.message);
    }
  }

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
