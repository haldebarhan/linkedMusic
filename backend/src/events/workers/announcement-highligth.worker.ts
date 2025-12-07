import logger from "../../config/logger";
import DatabaseService from "../../utils/services/database.service";
import { PrismaClient } from "@prisma/client";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const announcementEndHighlightJob = async () => {
  const now = new Date();
  logger.info("🔁 Job démarré : Vérification des Annonces");

  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      highlightExpiredAt: { lt: now },
      isHighlighted: true,
    },
  });

  logger.info(`📦 ${announcements.length} Annonce (s) à traiter`);
  if (announcements.length > 0)
    await prisma.announcement.updateMany({
      where: {
        isPublished: true,
        highlightExpiredAt: { lt: now },
      },
      data: { isHighlighted: false },
    });

  logger.info("✅ Job terminé");
};
