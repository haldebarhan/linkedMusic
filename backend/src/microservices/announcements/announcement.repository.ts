import { BaseRepository } from "@/utils/classes/base.repoository";
import DatabaseService from "@/utils/services/database.service";
import {
  PrismaClient,
  Announcement,
  Prisma,
  AnnouncementStatus as Status,
} from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateAnnoncementDTO, UpdateAnnoncementDTO } from "./announcement.dto";
import { Order } from "@/utils/enums/order.enum";
import { AnnouncementStatus } from "@/utils/enums/announcement-status.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class AnnouncementRepository extends BaseRepository<
  Announcement,
  CreateAnnoncementDTO & { images: string[]; ownerId: number },
  UpdateAnnoncementDTO & { images?: string[]; ownerId?: number }
> {
  constructor() {
    super(prisma.announcement);
  }

  async create(
    data: CreateAnnoncementDTO & { images: string[]; ownerId: number }
  ) {
    return prisma.announcement.create({
      data: {
        ...data,
        images: data.images,
        data: data.data as Prisma.InputJsonValue as any,
      },
      include: { serviceType: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }): Promise<any[]> {
    const { skip, take, where, order } = params;
    return prisma.announcement.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: order ?? Order.DESC,
      },
      select: {
        title: true,
        serviceType: {
          select: { name: true, group: { select: { name: true } } },
        },
        price: true,
        location: true,
        isPublished: true,
        isHighlighted: true,
        views: true,
      },
    });
  }

  async update(
    id: number,
    data: UpdateAnnoncementDTO & { images?: string[]; ownerId?: number }
  ) {
    const { data: jsonData, ...restData } = data;
    return prisma.announcement.update({
      where: { id },
      data: {
        ...restData,
        ...(jsonData && { data: jsonData as Prisma.InputJsonValue }),
      },
      include: { serviceType: true },
    });
  }

  async changeStatus(id: number, status: AnnouncementStatus) {
    return await prisma.announcement.update({
      where: { id },
      data: { status: status as Status },
    });
  }

  async validateAd(id: number) {
    return await prisma.announcement.update({
      where: { id },
      data: {
        isPublished: true,
        status: Status.PUBLISHED,
      },
      include: { serviceType: true },
    });
  }
}
