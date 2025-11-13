import DatabaseService from "@/utils/services/database.service";
import {
  NotificationPreference,
  NotificationType,
  PrismaClient,
} from "@prisma/client";
import { injectable } from "tsyringe";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class NotificationRepository {
  /**
   * Méthode principale : Envoie notification in-app + email
   */
  async notify(params: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: any;
    emailTemplate?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        metadata: params.metadata,
        isRead: false,
      },
    });

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: params.userId },
    });

    return { notification, preferences };
  }

  async markNotificationAsSent(notificationId: number) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { emailSent: true },
    });
  }

  /**
   * Déterminer si on envoie l'email selon le type et les préférences
   */
  shouldSendEmailForType(
    type: NotificationType,
    preferences?: NotificationPreference | null
  ): boolean {
    if (!preferences) return true; // Par défaut, oui

    switch (type) {
      case NotificationType.ANNOUNCEMENT_APPROVED:
      case NotificationType.ANNOUNCEMENT_REJECTED:
        return preferences.emailAnnouncements;

      case NotificationType.CONTACT_REQUEST_RECEIVED:
      case NotificationType.CONTACT_REQUEST_ACCEPTED:
      case NotificationType.CONTACT_REQUEST_REJECTED:
        return preferences.emailContactRequests;

      case NotificationType.MESSAGE_RECEIVED:
        return preferences.emailMessages;

      default:
        return true;
    }
  }

  /**
   * Marquer comme lue
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Marquer toutes comme lues
   */
  async markAllAsRead(userId: number): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Récupérer les notifications d'un user
   */
  async getUserNotifications(userId: number, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Compter les non lues
   */
  async getUnreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
