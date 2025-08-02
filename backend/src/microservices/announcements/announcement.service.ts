import { injectable } from "tsyringe";
import { AnnouncementRepository } from "./announcement.repository";
import { ServiceTypeRepository } from "../service-types/service-type.repository";
import { CreateAnnoncementDTO, UpdateAnnoncementDTO } from "./announcement.dto";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";
import { Announcement } from "@prisma/client";
import { MinioService } from "@/utils/services/minio.service";
import { ENV } from "@/config/env";
import { SearchService } from "@/utils/services/search.service";
import { flattenArrayValues, parseObject } from "@/scripts/sync-meilisearch";
import { AnnouncementStatus } from "@/utils/enums/announcement-status.enum";

const minioService: MinioService = MinioService.getInstance();

@injectable()
export class AnnouncementService {
  constructor(
    private readonly annoncemontRepository: AnnouncementRepository,
    private readonly serviceTypeRepository: ServiceTypeRepository
  ) {}

  async create(dto: CreateAnnoncementDTO, userId: number, images: string[]) {
    await this.checkServiceType(dto.serviceTypeId);
    const createdData = { ...dto, ownerId: userId, images };
    const annoncement = await this.annoncemontRepository.create(createdData);
    const { data, ...rest } = annoncement;
    const parsedData = parseObject(data);
    const flattenedData = flattenArrayValues(parsedData);
    await SearchService.addAnnouncement({
      ...rest,
      serviceType: annoncement.serviceType.name ?? "",
      ...flattenedData,
    });
  }

  async findAll(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.annoncemontRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.annoncemontRepository.count(where),
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

  async findOne(announcementId: number, check: boolean = true) {
    const announcement = await this.annoncemontRepository.findOne(
      announcementId
    );
    if (!announcement) throw createError(404, "announcementId not found");
    return check
      ? await this.attachFileToAnnoncement(announcement)
      : announcement;
  }

  async update(
    announcementId: number,
    dto: UpdateAnnoncementDTO,
    userId: number,
    images?: string[]
  ) {
    await this.checkAndGetUserAnnouncement(announcementId, userId);
    if (dto.serviceTypeId) {
      this.checkServiceType(dto.serviceTypeId);
    }
    if (images) await this.deleteAnnoncementImages(images);
    const updatedData = { ...dto, ownerId: userId, images };
    const updated = await this.annoncemontRepository.update(
      announcementId,
      updatedData
    );
    const { data, ...rest } = updated;
    const parsedData = parseObject(data);
    const flattenedData = flattenArrayValues(parsedData);
    await Promise.all([
      SearchService.deleteById(rest.id),
      SearchService.addAnnouncement({
        ...rest,
        serviceType: updated.serviceType.name ?? "",
        ...flattenedData,
      }),
    ]);
  }

  async search(
    query: string,
    params: {
      filters?: string[];
      limit: number;
      page: number;
      order: Order;
    }
  ) {
    const { filters, limit, order, page } = params;
    const offset = (page - 1) * limit;
    const data = await SearchService.search(query, {
      filters: filters?.length ? filters.join(" AND ") : undefined,
      sort: [`createdAt:${order.toLowerCase()}`],
      limit,
      offset,
    });
    return {
      data: data.hits,
      metadata: {
        total: data.estimatedTotalHits,
        page,
        totalPage: Math.max(Math.ceil(data.estimatedTotalHits / 1), 1),
      },
    };
  }

  async removeAd(adId: number, userId: number) {
    const announcement = await this.checkAndGetUserAnnouncement(adId, userId);
    await Promise.all([
      this.annoncemontRepository.delete(announcement.id),
      this.deleteAnnoncementImages(announcement.images),
      SearchService.deleteById(announcement.id),
    ]);
  }

  async changeStatus(adId: number, userId: number, status: AnnouncementStatus) {
    await this.checkAndGetUserAnnouncement(adId, userId);
    return this.annoncemontRepository.changeStatus(adId, status);
  }

  async validateAd(adId: number) {
    const announcement = await this.findOne(adId, false);
    return await this.annoncemontRepository.validateAd(announcement.id);
  }

  private async checkServiceType(serviceTypeId: number) {
    const serviceType = await this.serviceTypeRepository.findOne(serviceTypeId);
    if (!serviceType) throw createError(404, "serviceType not found");
  }

  private async attachFileToAnnoncement(announcement: Announcement) {
    const announcementImageUrls = await Promise.all(
      announcement.images.map(
        async (image) =>
          await minioService.generatePresignedUrl(ENV.MINIO_BUCKET_NAME, image)
      )
    );

    return { ...announcement, images: announcementImageUrls };
  }

  private async deleteAnnoncementImages(images: string[]) {
    return Promise.all(
      images.map(
        async (image) =>
          await minioService.deleteFile(ENV.MINIO_BUCKET_NAME, image)
      )
    );
  }

  private async checkAndGetUserAnnouncement(adId: number, userId: number) {
    const announcement = await this.findOne(adId, false);
    if (userId !== announcement.ownerId)
      throw createError(401, "Unauthorized action");
    return announcement;
  }
}
