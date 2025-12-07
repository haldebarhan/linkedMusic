import { NotificationRepository } from "../../microservices/notifications/notification.repository";
import { AuthenticatedSocket } from "../../utils/interfaces/authenticated-socket";
import { Socket } from "socket.io";
import { userRoom } from "../room";
import { EVENTS } from "../event";

const notificationRepository = new NotificationRepository();

export async function countUnread(userId: number) {
  return notificationRepository.getUnreadCount(userId);
}

async function listUserNotifications(userId: number) {
  return notificationRepository.getUserNotifications(userId);
}

async function markNotificationAsRead(userId: number, notificationId: number) {
  return notificationRepository.markAsRead(notificationId, userId);
}

async function selectNotification(userId: number, notificationId: number) {
  return notificationRepository.getOne(notificationId, userId);
}

export function registerNotificationHandlers(rawSocket: Socket) {
  const socket = rawSocket as AuthenticatedSocket;
  const user = socket.user;
  if (!user?.id) {
    socket.disconnect(true);
    return;
  }
  const userId = user.id;
  socket.join(userRoom(userId));

  countUnread(userId).then((total) => {
    socket.emit(EVENTS.NOTIFICATION_UNREAD, { total });
  });

  socket.on(EVENTS.NOTIFICATION_LIST, async () => {
    try {
      const notifications = await listUserNotifications(userId);
      socket.emit(EVENTS.NOTIFICATION_DATA, notifications);
    } catch (error) {}
  });

  socket.on(EVENTS.NOTIFICATION_MARK_READ, async ({ notificationId }) => {
    try {
      const notification = await selectNotification(userId, notificationId);
      await markNotificationAsRead(userId, notificationId);
      socket.emit(EVENTS.NOTIFICATION_SELECT_DATA, notification);
    } catch (error) {}
  });
}
