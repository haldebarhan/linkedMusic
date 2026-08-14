import { injectable } from "tsyringe";
import { BannerSlideRepository } from "./banner-slide.repository";
import createError from "http-errors";
import { ENV } from "../../config/env";
import { S3Service } from "../../utils/services/s3.service";
import { invalideCache } from "../../utils/functions/invalidate-cache";
import { cursorPage } from "../../utils/helpers/cursor-pagination";
import { Order } from "../../utils/enums/order.enum";
import { normalizeMediaType } from "@/utils/functions/utilities";
const minioService: S3Service = S3Service.getInstance();

@injectable()
export class BannerSlideService {
  constructor(private readonly bannerSlideRepository: BannerSlideRepository) { }

  async findAll(params: { limit: number; cursor?: number; where?: any; order?: Order }) {
    const { cursor, limit, where, order } = params;
    const rows = await this.bannerSlideRepository.findAll({
      cursor,
      take: limit + 1,
      order: order,
      where,
    });
    rows.length > 0 && await Promise.all(
      rows.map(async (row) => {
        row.mediaUrl = await minioService.generatePresignedUrl(
          ENV.AWS_S3_DEFAULT_BUCKET,
          row.mediaUrl
        );
        row.mediaType = normalizeMediaType(row.mediaType);
      })
    );
    return cursorPage(rows, limit);
  }

  async create(data: { mediaType: string; mediaUrl: string }) {
    await invalideCache("banner-slides*");
    return await this.bannerSlideRepository.create({ ...data });
  }

  async reorder(id: number, newOrder: number) {
    await this.findOne(id);
    await invalideCache("banner-slides*");
    return await this.bannerSlideRepository.reorder(id, newOrder);
  }

  async toggleStatus(id: number, isActive: boolean) {
    await this.findOne(id);
    await invalideCache("banner-slides*");
    return await this.bannerSlideRepository.toggleStatus(id, isActive);
  }

  async remove(id: number) {
    await this.findOne(id);
    await invalideCache("banner-slides*");
    return await this.bannerSlideRepository.remove(id);
  }

  private async findOne(id: number) {
    const slide = await this.bannerSlideRepository.findOne(id);
    if (!slide) throw createError(404, "Slide not found");
    return slide;
  }
}
