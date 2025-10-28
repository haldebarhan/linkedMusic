import logger from "@/config/logger";
import { PaymentStatus } from "@/utils/enums/payment-status.enum";
import { syncPaymentStatusByReference } from "@/utils/functions/sync-paiment-status";
import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const paymentsStatusCheckJob = async () => {
  logger.info("🔁 Job démarré : Vérification des transactions en PENDING");
  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDING,
    },
  });
  if (payments.length > 0) {
    logger.info(`📦 ${payments.length} paiement(s) à vérifier`);
    let count = 0;
    const MAX_JOBS = 10;
    let errorCount = 0;
    const MAX_ERRORS = 5;
    for (const payment of payments) {
      try {
        const p = await syncPaymentStatusByReference(payment.reference);
        if (p == null) {
          logger.warn(
            `⚠️ Aucune réponse pour la transaction ${payment.reference}`
          );
          continue;
        }
        const reference = p.reference;
        const statusValue = p.status;
        logger.info(
          `✅ Transaction ${reference} mise à jour: ${payment.status} ->${statusValue}`
        );
      } catch (error) {
        logger.error("Erreur lors de la synchronisation du paiement", error);
        errorCount++;
        if (errorCount >= MAX_ERRORS) {
          logger.error("Too many failures. Exiting...");
          break;
        }
      }
      if (++count >= MAX_JOBS) {
        logger.info("Limit reached, exiting to prevent memory leaks.");
        break;
      }
    }
  }
  logger.info("✅ Job terminé");
};
