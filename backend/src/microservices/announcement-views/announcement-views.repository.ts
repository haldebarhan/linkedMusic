import { Order } from "../../utils/enums/order.enum";
import { PaginationParams } from "../../utils/interfaces/pagination";
import DatabaseService from "../../utils/services/database.service";
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
    const limit = pagination.limit || 20;
    const cursor = pagination.cursor;

    return await prisma.announcementView.findMany({
      where: { userId },
      select: {
        id: true,
        viewedAt: true,
        announcement: true,
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      orderBy: { id: pagination.sortOrder || Order.DESC },
      take: limit + 1,
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
