import { Order } from "@/utils/enums/order.enum";
import { PlanStatus } from "@/utils/enums/subscription-status.enum";
import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class PlanRepository {
  async create(data: any) {
    return await prisma.subscriptionPlan.create({ data });
  }

  async findBySlug(slug: string) {
    return await prisma.subscriptionPlan.findUnique({
      where: { slug },
      include: { benefits: { include: { benefit: true } }, parent: true },
    });
  }

  async findById(id: number) {
    return prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        benefits: {
          select: { benefit: { select: { id: true, label: true } } },
        },
      },
    });
  }

  async updatePlan(id: number, data: any) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }) {
    const { skip, take, where, order } = params;
    return await prisma.subscriptionPlan.findMany({
      take,
      skip,
      where: { status: PlanStatus.ACTIVE, ...where },
      orderBy: { createdAt: order ?? Order.DESC },
      include: {
        benefits: { select: { benefit: true, inherited: true } },
        parent: { select: { name: true } },
      },
    });
  }

  async count(where?: any): Promise<number> {
    return prisma.subscriptionPlan.count({ where });
  }

  async desactivatePlan(id: number) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async activatePlan(id: number) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        active: true,
      },
    });
  }

  async putPlanPendingRemoval(id: number) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        status: PlanStatus.PENDING_REMOVAL,
        active: false,
      },
    });
  }

  async removePlan(id: number) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        status: PlanStatus.REMOVED,
        active: false,
      },
    });
  }
}
