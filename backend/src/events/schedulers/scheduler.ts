import logger from "@/config/logger";
import cron from "node-cron";
import { subscriptionDailyJob } from "../workers/subscription-daily.worker";
import { paymentsStatusCheckJob } from "../workers/payment-status.worker";

export const startSubscriptionDailyCron = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des abonnements");
    await subscriptionDailyJob();
  });
};

export const startCheckSubscriptionStatus = () => {
  cron.schedule("* * * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des paiements");
    await paymentsStatusCheckJob();
  });
};
