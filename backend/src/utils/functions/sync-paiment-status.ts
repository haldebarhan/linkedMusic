import { enqueuePaymentPendingJob } from "@/events/jobs/payment-pending.job";
import { PaymentStatus, PrismaClient } from "@prisma/client";
import DatabaseService from "../services/database.service";
import { CinetPayClient } from "@/core/payments/cinet-pay/cinet-pay";
import { addDays } from "date-fns";
import { container } from "tsyringe";
import { PaymentRepository } from "@/microservices/payments/payment.repository";
const prisma: PrismaClient = DatabaseService.getPrismaClient();

const paymentRepository = container.resolve(PaymentRepository);
const paymentProvider = container.resolve(CinetPayClient);

export const syncPaymentStatusByReference = async (reference: string) => {
  const payment = await paymentRepository.findOneByReference(reference);
  if (!payment) return null;
  if (payment.status !== PaymentStatus.PENDING) return payment;
  const check = await paymentProvider.checkPaymentStatus(payment.reference);
  let newStatus: PaymentStatus = PaymentStatus.PENDING;
  if (check.status === "SUCCESS") newStatus = PaymentStatus.SUCCEEDED;
  else if (check.status === "FAILED") newStatus = PaymentStatus.FAILED;
  else if (check.status === "CANCELED") newStatus = PaymentStatus.FAILED;
  if (newStatus !== PaymentStatus.PENDING) {
    const updated = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { reference },
        data: {
          status: newStatus,
        },
      });
      if (newStatus === PaymentStatus.SUCCEEDED) {
        await ensureSubscriptionActivated(tx, payment.userId, payment.planId);
        return payment;
      }
      return payment;
    });
    return updated;
  }
  await enqueuePaymentPendingJob(payment.reference);
  return payment;
};
const ensureSubscriptionActivated = async (
  tx: any,
  userId: number,
  plan: any
) => {
  const endAt = computeEndAt(plan.durationDays);
  const autoRenew = true;
  const [sub] = await Promise.all([
    tx.userSubscription.create(userId, plan.id, new Date(), endAt, autoRenew),
    plan.isFree
      ? tx.userSubscription.insertFreeClaim(userId)
      : Promise.resolve(),
  ]);
  return sub;
};
const computeEndAt = (durationDays?: number | null): Date | null => {
  return durationDays && durationDays > 0
    ? addDays(new Date(), durationDays)
    : null;
};
