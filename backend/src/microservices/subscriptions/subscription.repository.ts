import { Order } from "../../utils/enums/order.enum";
import { SubcriptionStatus } from "../../utils/enums/subscription-status.enum";
import DatabaseService from "../../utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateBenefit } from "./dto/plan.dto";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class SubscriptionRepository {
  async create(
    userId: number,
    planId: number,
    startAt: Date,
    endAt: Date | null,
    autoRenew: boolean
  ) {
    return prisma.userSubscription.create({
      data: {
        userId,
        planId,
        startAt,
        endAt,
        autoRenew,
        status: SubcriptionStatus.ACTIVE,
      },
      include: { plan: true },
    });
  }

  async createBenefit(data: CreateBenefit[]) {
    return await prisma.benefit.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async addBenefitToPlan(planId: number, benefitId: number) {
    return await prisma.planBenefit.create({
      data: {
        planId,
        benefitId,
      },
    });
  }

  async markSubscriptionAsCompleted(date: Date) {
    return await prisma.userSubscription.updateMany({
      where: { status: SubcriptionStatus.ACTIVE, endAt: { lt: date } },
      data: { status: SubcriptionStatus.EXPIRED },
    });
  }

  async cancelActive(userId: number) {
    return prisma.userSubscription.updateMany({
      where: { userId, status: SubcriptionStatus.ACTIVE },
      data: { status: SubcriptionStatus.CANCELED },
    });
  }

  async findActiveByUser(userId: number) {
    return prisma.userSubscription.findFirst({
      where: { userId, status: SubcriptionStatus.ACTIVE },
      orderBy: { startAt: Order.DESC },
      include: { plan: true },
    });
  }

  async freeClaimExists(userId: number) {
    const claim = await prisma.freeClaim.findUnique({ where: { userId } });
    return !!claim;
  }

  async insertFreeClaim(userId: number) {
    return prisma.freeClaim.create({ data: { userId } });
  }

  async findSubscriptionUsersByPlan(planId: number) {
    return prisma.userSubscription.findMany({
      where: { planId, status: SubcriptionStatus.ACTIVE },
    });
  }
}
