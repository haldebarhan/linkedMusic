import { Order } from "@/utils/enums/order.enum";
import { PaginationParams } from "@/utils/interfaces/pagination";
import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
@injectable()
export class AnnouncementViewRepository {
  async create(userId: number, announcementId: number) {
    return await prisma.announcementView.upsert({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
      create: {
        userId,
        announcementId,
        viewedAt: new Date(),
      },
      update: {
        viewedAt: new Date(),
      },
    });
  }

  async recentViews(userId: number, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    // Construire l'orderBy si fourni dans pagination
    const finalOrderBy = pagination.sortBy
      ? {
          [pagination.sortBy]: pagination.sortOrder || Order.DESC,
        }
      : undefined;
    return await prisma.announcementView.findMany({
      where: { userId },
      select: {
        id: true,
        viewedAt: true,
        announcement: true,
      },
      orderBy: { viewedAt: Order.DESC },
      take: 12,
    });
  }

  async remove(viewId: number) {
    return await prisma.announcementView.delete({ where: { id: viewId } });
  }

  async getOne(viewId: number) {
    return await prisma.announcementView.findFirst({ where: { id: viewId } });
  }

  async removeAll(userId: number) {
    return await prisma.announcementView.deleteMany({ where: { userId } });
  }
}
