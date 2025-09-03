import { Order } from "@/utils/enums/order.enum";
import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementRepository {
  async create(data: any) {
    return await prisma.announcement.create({
      data,
    });
  }

  async findOne(id: number) {
    return await prisma.announcement.findUnique({
      where: { id },
      include: {
        serviceType: {
          select: {
            id: true,
            slug: true,
            category: { select: { slug: true } },
          },
        },
        AnnValues: {
          include: { field: true, options: { include: { option: true } } },
        },
      },
    });
  }

  async findAll(where: any, skip: number, take: number) {
    return await prisma.announcement.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        price: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: Order.DESC },
    });
  }

  async removeAnnouncement(id: number) {
    return await prisma.announcement.delete({ where: { id } });
  }

  async count(where?: any) {
    return await prisma.announcement.count({ where });
  }
  async listByCategory() {}
}
