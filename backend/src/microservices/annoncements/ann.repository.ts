import { Order } from "@/utils/enums/order.enum";
import DatabaseService from "@/utils/services/database.service";
import { AnnouncementStatus, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementRepository {
  async create(data: any) {
    return await prisma.announcement.create({
      data,
      include: {
        serviceType: { select: { id: true, name: true, slug: true } },
        categories: { include: { category: true } },
      },
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
            categories: { include: { category: { select: { slug: true } } } },
          },
        },
        AnnValues: {
          include: { field: true, options: { include: { option: true } } },
        },
        user: {
          include: {
            _count: {
              select: {
                announcements: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserTopPublication(userId: number, limit = 10) {
    return await prisma.announcement.findMany({
      where: {
        ownerId: userId,
        // isPublished: true,
        // status: AnnouncementStatus.PUBLISHED,
      },
      orderBy: [
        { views: Order.DESC },
        { updatedAt: Order.DESC },
        { Conversation: { _count: Order.DESC } },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        createdAt: true,
        views: true,
        _count: { select: { Conversation: true } },
      },
    });
  }

  async countUserTotalActivePublication(userId: number) {
    const where: any = {
      ownerId: userId,
      isPublished: true,
      status: AnnouncementStatus.PUBLISHED,
    };
    return prisma.announcement.count({
      where,
    });
  }

  async countUserAnnouncementTotalViews(userId: number) {
    return await prisma.announcement.aggregate({
      where: { ownerId: userId },
      _sum: { views: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { where, skip, take, order } = params;
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
        serviceType: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: order ?? Order.DESC },
    });
  }

  async removeAnnouncement(id: number) {
    return await prisma.announcement.delete({ where: { id } });
  }

  async count(where?: any) {
    return await prisma.announcement.count({ where });
  }

  async incrementViews(id: number) {
    return await prisma.announcement.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }
}
