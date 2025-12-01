import logger from "@/config/logger";
import cron from "node-cron";
import { subscriptionDailyJob } from "../workers/subscription-daily.worker";
import { paymentsStatusCheckJob } from "../workers/payment-status.worker";
import { announcementEndHighlightJob } from "../workers/announcement-highligth.worker";
import { upgradeBadgeJob } from "../workers/badge.worker";
import { Badge } from "@prisma/client";

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

export const startAnnouncementHighlightedCron = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des annonces");
    await announcementEndHighlightJob();
  });
};

export const startUpgradeUsersBadge = () => {
  cron.schedule("0 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des badges");
    await upgradeBadgeJob(Badge.STANDARD);
  });

  cron.schedule("5 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des badges");
    await upgradeBadgeJob(Badge.BRONZE);
  });

  cron.schedule("10 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des badges");
    await upgradeBadgeJob(Badge.SILVER);
  });

  cron.schedule("15 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des badges");
    await upgradeBadgeJob(Badge.GOLD);
  });

  cron.schedule("20 0 * * *", async () => {
    logger.info("⏰ Cron lancé : vérification des badges");
    await upgradeBadgeJob(Badge.VIP);
  });
};
