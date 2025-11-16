import { Order } from "@/utils/enums/order.enum";
import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class BannerSlideRepository {
  async findAll(params: { skip?: number; take?: number; where?: any }) {
    const { skip, take, where } = params;
    return await prisma.bannerSlide.findMany({
      take,
      skip,
      where,
      orderBy: { order: Order.ASC },
    });
  }

  async count(where?: any) {
    return await prisma.bannerSlide.count({ where });
  }

  async findActive() {
    return await prisma.bannerSlide.findMany({
      where: { isActive: true },
      orderBy: { order: Order.ASC },
    });
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
