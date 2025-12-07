import { ENV } from "../../config/env";
import { Queue } from "bullmq";
import Redis from "ioredis";

export const SUBSCRIPTION_DAILY_QUEUE = "subscription-daily";
export const SUBSCRIPTION_SWEEP_JOB = "subscription-sweep";

const connection = new Redis(ENV.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});

export const subscriptionDailyQueue = new Queue(SUBSCRIPTION_DAILY_QUEUE, {
  connection,
});
