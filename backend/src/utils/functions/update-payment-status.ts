import { container } from "tsyringe";
import { WebhookEvent } from "../interfaces/payment-payload";
import { PaymentRepository } from "../../microservices/payments/payment.repository";
import { PaymentStatus } from "@prisma/client";

const paymentRepository = container.resolve(PaymentRepository);

export const updatePayementStatus = async (webhookData: WebhookEvent) => {
  const reference = webhookData.transactionDetails.reference;
  const payment = await paymentRepository.findOneByReference(reference);
  if (!payment) return;
  let status: PaymentStatus = PaymentStatus.PENDING;
  if (webhookData.status === "success") status = PaymentStatus.SUCCEEDED;
  else if (webhookData.status === "error") status = PaymentStatus.FAILED;
  else if (webhookData.status === "pending") status = PaymentStatus.PENDING;
  return await paymentRepository.update(payment.id, {
    status,
  });
};
