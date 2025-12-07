import { Order } from "@/utils/enums/order.enum";
import { PaginationParams } from "@/utils/interfaces/pagination";
import DatabaseService from "@/utils/services/database.service";
import { PaymentFilter } from "@/utils/types/payment";
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class PaymentRepository {
  async createPayement(data: {
    userId: number;
    planId: number;
    reference: string;
    amount: number;
    provider?: PaymentProvider;
    status?: PaymentStatus;
  }) {
    const payload = {
      ...data,
      provider: data.provider ?? PaymentProvider.CINETPAY,
    };
    return await prisma.payment.create({
      data: payload,
    });
  }

  async updatePayementStatus(id: number, status: PaymentStatus) {}

  async findOneByReference(reference: string) {
    return await prisma.payment.findUnique({ where: { reference } });
  }

  async findByExternalId(externalId: string) {
    return await prisma.payment.findFirst({ where: { externalId } });
  }

  async update(id: number, data: any) {
    return await prisma.payment.update({
      where: { id },
      data,
    });
  }

  async getUserLastPayments(userId: number, limit = 5) {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: Order.DESC },
      take: limit,
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        purpose: true,
        plan: { select: { name: true } },
        provider: true,
      },
    });
  }

  async getUserPayments(
    userId: number,
    filters: PaymentFilter,
    pagination: PaginationParams
  ) {
    const where: Prisma.PaymentWhereInput = { userId };
    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status as PaymentStatus;
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const finalOrderBy: Prisma.PaymentOrderByWithRelationInput | undefined =
      pagination.sortBy
        ? ({
            [pagination.sortBy]: pagination.sortOrder || Order.DESC,
          } as Prisma.PaymentOrderByWithRelationInput)
        : undefined;
    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        take: limit,
        skip,
        orderBy: finalOrderBy,
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, total };
  }
}
