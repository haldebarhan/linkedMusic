import { ENV } from "@/config/env";
import { Queue } from "bullmq";
import Redis from "ioredis";

export const PAYMENTS_PENDING_QUEUE = "payment-pending";
export const PAYMENT_STATUS_CHECK_JOBS = "check-status";

const connection = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

export const paymentPendingQueue = new Queue(PAYMENTS_PENDING_QUEUE, {
  connection,
});
