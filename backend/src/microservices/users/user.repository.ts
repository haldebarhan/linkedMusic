import { BaseRepository } from "@/utils/classes/base.repoository";
import { injectable } from "tsyringe";
import { CreateUserDTO, UpdateUserDTO } from "./user.dto";
import { PrismaClient, Status, SubscriptionStatus, User } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class UserRepository extends BaseRepository<
  User,
  Omit<CreateUserDTO, "password" | "pseudo">,
  UpdateUserDTO & { profileImage?: string }
> {
  constructor() {
    super(prisma.user);
  }

  async closeAccount(id: number, comment: string) {
    return await prisma.user.update({
      where: { id },
      data: {
        status: Status.CLOSED,
        comments: comment,
      },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            autoRenew: true,
            status: true,
            plan: {
              select: {
                name: true,
                period: true,
                priceCents: true,
                benefits: { select: { benefit: { select: { label: true } } } },
              },
            },
          },
        },
      },
    });
  }

  async findByParams(where: any) {
    return prisma.user.findUnique({
      where,
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            autoRenew: true,
            status: true,
            plan: {
              select: {
                name: true,
                period: true,
                priceCents: true,
                benefits: { select: { benefit: { select: { label: true } } } },
              },
            },
          },
        },
      },
    });
  }

  async findByPhone(phone: string, excludeUserId?: number) {
    return prisma.user.findFirst({
      where: {
        phone,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            plan: { select: { name: true, period: true } },
          },
        },
      },
    });
  }

  async findByDisplayName(displayName: string, excludeUserId?: number) {
    return prisma.user.findFirst({
      where: {
        displayName,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            plan: { select: { name: true, period: true } },
          },
        },
      },
    });
  }

  async update(id: number, data: Partial<UpdateUserDTO>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            autoRenew: true,
            status: true,
            plan: {
              select: {
                name: true,
                period: true,
                priceCents: true,
                benefits: { select: { benefit: { select: { label: true } } } },
              },
            },
          },
        },
      },
    });
  }
}
