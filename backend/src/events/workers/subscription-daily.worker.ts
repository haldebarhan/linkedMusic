import logger from "../../config/logger";
import { SubscriptionRepository } from "../../microservices/subscriptions/subscription.repository";
import DatabaseService from "../../utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { container } from "tsyringe";
import { SubcriptionStatus } from "../../utils/enums/subscription-status.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const subscriptionDailyJob = async () => {
  const now = new Date();
  logger.info("🔁 Job démarré : Vérification des Subscriptions");

  const subscriptionRepository = container.resolve(SubscriptionRepository);

  const subscriptions = await prisma.userSubscription.findMany({
    where: {
      status: SubcriptionStatus.ACTIVE,
      endAt: { lt: now },
    },
  });

  logger.info(`📦 ${subscriptions.length} Subscription(s) à expirer`);
  if (subscriptions.length > 0)
    await subscriptionRepository.markSubscriptionAsCompleted(now);

  logger.info("✅ Job terminé");
};
