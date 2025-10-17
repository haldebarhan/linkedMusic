import {
  SUBSCRIPTION_SWEEP_JOB,
  subscriptionDailyQueue,
} from "../queues/subscription-daily.queue";

export const enqueueSubscriptionDailyJob = async () => {
  await subscriptionDailyQueue.add(
    SUBSCRIPTION_SWEEP_JOB,
    {},
    {
      delay: 60_000,
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
};
