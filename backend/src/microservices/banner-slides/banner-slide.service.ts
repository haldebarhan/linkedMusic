import { injectable } from "tsyringe";
import { BannerSlideRepository } from "./banner-slide.repository";
import createError from "http-errors";
import { ENV } from "../../config/env";
import { S3Service } from "../../utils/services/s3.service";
import { invalideCache } from "../../utils/functions/invalidate-cache";

const minioService: S3Service = S3Service.getInstance();

@injectable()
export class BannerSlideService {
  constructor(private readonly bannerSlideRepository: BannerSlideRepository) {}

  async findAll(params: { limit: number; page: number; where?: any }) {
    const { page, limit, where } = params;
    const skip = (page - 1) * limit;
    const [slides, total] = await Promise.all([
      this.bannerSlideRepository.findAll({
        take: limit,
        skip,
        where,
      }),
      this.bannerSlideRepository.count(where),
    ]);
    await Promise.all(
      slides.map(async (slide) => {
        slide.mediaUrl = await minioService.generatePresignedUrl(
          ENV.AWS_S3_DEFAULT_BUCKET,
          slide.mediaUrl
        );
        if (slide.mediaType.startsWith("image")) {
          slide.mediaType = "image";
        } else if (slide.mediaType.startsWith("video")) {
          slide.mediaType = "video";
        }
      })
    );
    return {
      data: slides,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(10 / limit), 1),
      },
    };
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

  async findActive() {
    const slides = await this.bannerSlideRepository.findActive();
    await Promise.all(
      slides.map(async (slide) => {
        slide.mediaUrl = await minioService.generatePresignedUrl(
          ENV.AWS_S3_DEFAULT_BUCKET,
          slide.mediaUrl
        );
        if (slide.mediaType.startsWith("image")) {
          slide.mediaType = "image";
        } else if (slide.mediaType.startsWith("video")) {
          slide.mediaType = "video";
        }
      })
    );
    return slides;
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
