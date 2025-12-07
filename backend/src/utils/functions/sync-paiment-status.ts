import { enqueuePaymentPendingJob } from "../../events/jobs/payment-pending.job";
import { PaymentStatus, Prisma, PrismaClient } from "@prisma/client";
import DatabaseService from "../services/database.service";
import { addDays } from "date-fns";
import { container } from "tsyringe";
import { PaymentRepository } from "../../microservices/payments/payment.repository";
import { Jeko } from "../../core/payments/Jeko/jeko";
import { PlanRepository } from "../../microservices/subscriptions/plan.repository";
const prisma: PrismaClient = DatabaseService.getPrismaClient();

const paymentRepository = container.resolve(PaymentRepository);
const planRepository = container.resolve(PlanRepository);
const jekoProvider = container.resolve(Jeko);

export const syncPaymentStatusByReference = async (reference: string) => {
  const payment = await paymentRepository.findOneByReference(reference);
  if (!payment) return null;
  const plan = await planRepository.findById(payment.planId!);
  if (!plan) return null;

  if (payment.status !== PaymentStatus.PENDING) return payment;
  let newStatus: PaymentStatus = PaymentStatus.PENDING;
  const check = await jekoProvider.checkPaymentStatus(payment.externalId!);
  if (check.status && check.status === "success")
    newStatus = PaymentStatus.SUCCEEDED;
  else if (check.status && check.status === "error")
    newStatus = PaymentStatus.FAILED;
  if (newStatus !== PaymentStatus.PENDING) {
    const updated = await prisma.$transaction(async (tx) => {
      const transaction = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
        },
      });
      if (newStatus === PaymentStatus.SUCCEEDED) {
        await ensureSubscriptionActivated(tx, transaction.userId, plan);
        return transaction;
      }
      return payment;
    });
    return updated;
  }
  await enqueuePaymentPendingJob(payment.reference);
  return payment;
};

const ensureSubscriptionActivated = async (
  tx: Prisma.TransactionClient,
  userId: number,
  plan: any
) => {
  const endAt = computeEndAt(plan.durationDays);
  const autoRenew = true;
  const [sub] = await Promise.all([
    tx.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        startAt: new Date(),
        endAt,
        autoRenew,
      },
    }),
    plan.isFree ? tx.freeClaim.create({ data: { userId } }) : Promise.resolve(),
  ]);
  return sub;
};
const computeEndAt = (durationDays?: number | null): Date | null => {
  return durationDays && durationDays > 0
    ? addDays(new Date(), durationDays)
    : null;
};
