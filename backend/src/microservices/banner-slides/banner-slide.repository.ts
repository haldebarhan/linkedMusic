import DatabaseService from "../../utils/services/database.service";
import { PrismaClient, BannerSlide } from "@prisma/client";
import { injectable } from "tsyringe";
import { BaseRepository } from "@/utils/classes/base.repository";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class BannerSlideRepository extends BaseRepository<BannerSlide> {
  constructor() {
    super(prisma, "bannerSlide");
  }
  async count(where?: any) {
    return await prisma.bannerSlide.count({ where });
  }


  async create(data: any) {
    const maxOrder = await prisma.bannerSlide.aggregate({
      _max: { order: true },
    });

    return await prisma.bannerSlide.create({
      data: {
        ...data,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async reorder(id: number, newOrder: number) {
    return await prisma.bannerSlide.update({
      where: { id },
      data: { order: newOrder },
    });
  }

  async remove(id: number) {
    return await prisma.bannerSlide.delete({
      where: { id },
    });
  }

  async findOne(id: number) {
    return await prisma.bannerSlide.findUnique({
      where: { id },
    });
  }

  async toggleStatus(id: number, isActive: boolean) {
    return await prisma.bannerSlide.update({
      where: { id },
      data: { isActive },
    });
  }
}
