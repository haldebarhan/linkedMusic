import DatabaseService from "@/utils/services/database.service";
import { PaymentProvider, PaymentStatus, PrismaClient } from "@prisma/client";
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
}
