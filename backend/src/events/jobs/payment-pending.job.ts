import {
  PAYMENT_STATUS_CHECK_JOBS,
  paymentPendingQueue,
} from "../queues/payment-pending.queue";

export const enqueuePaymentPendingJob = async (reference: string) => {
  await paymentPendingQueue.add(
    PAYMENT_STATUS_CHECK_JOBS,
    { reference },
    {
      delay: 60_000,
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: true,
      backoff: { type: "exponential", delay: 30_000 },
    }
  );
};
