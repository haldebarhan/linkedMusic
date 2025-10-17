import logger from "@/config/logger";
import cron from "node-cron";
import { subscriptionDailyJob } from "../workers/subscription-daily.worker";

export const startSubscriptionDailyCron = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des abonnements");
    await subscriptionDailyJob();
  });
};
