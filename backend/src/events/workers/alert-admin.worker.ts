import {
  AnnouncementStatus,
  NotificationType,
  PrismaClient,
  Role,
  Status,
} from "@prisma/client";
import DatabaseService from "../../utils/services/database.service";
import logger from "../../config/logger";
import { container } from "tsyringe";
import { NotificationRepository } from "../../microservices/notifications/notification.repository";
import { ENV } from "../../config/env";
import { getIo } from "../../sockets/io-singleton";
import { userRoom } from "../../sockets/room";
import { EVENTS } from "../../sockets/event";
import { countUnread } from "../../sockets/handlers/notification.handler";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const alertAdminJob = async () => {
  logger.info("🔁 Job démarré : Alert d'Annonces à valider");
  const notificationRepository = container.resolve(NotificationRepository);

  const pendingAnnouncementsCount = await prisma.announcement.count({
    where: {
      status: AnnouncementStatus.PENDING_APPROVAL,
      isPublished: false,
    },
  });

  if (pendingAnnouncementsCount > 0) {
    logger.info(`Notification (s) en attente: ${pendingAnnouncementsCount}`);

    const admins = await getAdmins();

    await Promise.all(
      admins.map(async (admin) => {
        try {
          const notification = await notificationRepository.notify({
            userId: admin.id,
            title: "Annonces en attente de validation",
            type: NotificationType.ANNOUNCEMENT_CREATED,
            message: `Il y a ${pendingAnnouncementsCount} annonce(s) en attente de validation.`,
            actionUrl: `${ENV.FRONTEND_URL}/admin/publications`,
          });

          const io = getIo();
          const roomId = userRoom(admin.id);

          await Promise.all([
            io.to(roomId).emit(EVENTS.NOTIFICATION_NEW, {
              notification,
              type: NotificationType.ANNOUNCEMENT_CREATED,
            }),

            io.to(roomId).emit(EVENTS.NOTIFICATION_UNREAD, {
              total: await countUnread(admin.id),
            }),
          ]);
        } catch (error) {
          logger.log(
            "Erreur lors de l'émission Socket.IO ou création de notification:",
            error
          );
        }
      })
    );
  }

  logger.info("✅ Job terminé");
};

const getAdmins = async () => {
  return await prisma.user.findMany({
    where: { role: Role.ADMIN, status: Status.ACTIVATED },
    select: { id: true },
  });
};
