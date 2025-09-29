import { Server, Socket } from "socket.io";
import { EventKey, EVENTS } from "../event";
import { userRoom, threadRoom } from "../room";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";
import { AuthenticatedSocket } from "@/utils/interfaces/authenticated-socket";
import { MessageRepository } from "@/microservices/messages/message.repository";
import { buildThreadRows } from "@/utils/helpers/build-thread-rows";
import createError from "http-errors";
import logger from "@/config/logger";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const messageRepository = new MessageRepository();

async function unreadCount(userId: number) {
  return messageRepository.computeUnread(userId);
}

async function listThreads(userId: number, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    messageRepository.listThreadsForUser(userId, limit, skip),
    messageRepository.countListThread(userId),
  ]);
  const threadRow = await buildThreadRows(rows, userId);
  return {
    data: threadRow,
    metadata: {
      total,
      page,
      totalPage: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

async function loadConversation(userId: number, convoId: number) {
  // sécurité minimale: user doit appartenir à la conversation
  const convo = await messageRepository.getConversation(convoId);

  if (!convo) throw createError(404, "Conversation not found");
  if (convo.receiverId !== userId && convo.senderId !== userId)
    throw createError(403, "Forbidden");

  const total = await prisma.message.count({
    where: { conversationId: convo.id },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
  });

  return { messages, total, convo };
}

async function markThreadRead(userId: number, convoId: number) {
  await prisma.message.updateMany({
    where: {
      conversationId: convoId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export function registerChatHandlers(
  io: Server,
  rawSocket: Socket,
  page: number = 1,
  limit: number = 200
) {
  const socket = rawSocket as AuthenticatedSocket;
  const user = socket.user;
  if (!user?.id) {
    socket.disconnect(true);
    return;
  }
  const userId = user.id;

  // Met l’utilisateur dans sa room perso
  socket.join(userRoom(userId));
  logger.info(`user [id: ${userId}] join room [${userRoom(userId)}]`);

  // Au connect → push le compteur non lus
  unreadCount(userId).then((n) => {
    socket.emit(EVENTS.NOTIF_UNREAD, { total: n });
  });

  // LISTE DES THREADS
  socket.on(EVENTS.THREADS_LIST, async () => {
    try {
      const rows = await listThreads(userId, page, limit);
      socket.emit(EVENTS.THREADS_DATA, rows);
    } catch (e: any) {
      socket.emit(EVENTS.ERROR, { message: e?.message ?? "Threads error" });
    }
  });

  // SÉLECTION D’UN FIL
  socket.on(
    EVENTS.THREAD_SELECT,
    async ({ threadId }: { threadId: number }) => {
      try {
        // join la room du thread
        socket.join(threadRoom(threadId));
        // mark read
        await markThreadRead(userId, threadId);
        // notifier le compteur mis à jour
        socket.emit(EVENTS.NOTIF_UNREAD, {
          total: await unreadCount(userId),
        });
      } catch (e: any) {
        socket.emit(EVENTS.ERROR, {
          message: e?.message ?? "Select error",
        });
      }
    }
  );

  // CHARGER CONVERSATION
  socket.on(
    EVENTS.CONVO_LOAD,
    async ({
      threadId,
    }: {
      threadId: number;
      page?: number;
      limit?: number;
    }) => {
      try {
        const { messages, total, convo } = await loadConversation(
          userId,
          threadId
        );
        socket.emit(EVENTS.CONVO_DATA, { threadId: convo.id, messages, total });

        // marquer comme lu tout de suite
        await markThreadRead(userId, convo.id);
        socket.emit(EVENTS.NOTIF_UNREAD, { total: await unreadCount(userId) });
      } catch (e: any) {
        socket.emit(EVENTS.ERROR, {
          message: e?.message ?? "Load convo error",
        });
      }
    }
  );

  // CHARGER CONVERSATION
  socket.on(
    EVENTS.MESSAGE_SEND,
    async ({ threadId, content }: { threadId: number; content: string }) => {
      try {
        const convo = await prisma.conversation.findFirstOrThrow({
          where: {
            id: threadId,
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
        });
        const saved = await prisma.message.create({
          data: {
            conversationId: convo.id,
            senderId: userId,
            content: content?.trim(),
          },
        });

        // broadcast aux participants
        io.to(threadRoom(convo.id)).emit(EVENTS.MESSAGE_NEW, {
          threadId: convo.id,
          message: saved,
        });

        // badge non-lus côté « autre »
        const peerId =
          convo.senderId === userId ? convo.receiverId : convo.senderId;
        io.to(userRoom(peerId)).emit(EVENTS.NOTIF_UNREAD, {
          total: await unreadCount(peerId),
        });
      } catch (e: any) {
        socket.emit(EVENTS.ERROR, { message: e?.message ?? "Send error" });
      }
    }
  );

  // MARQUER LU (manuel)
  socket.on(
    EVENTS.MESSAGE_MARK_READ,
    async ({ threadId }: { threadId: number }) => {
      try {
        await markThreadRead(userId, threadId);
        socket.emit(EVENTS.NOTIF_UNREAD, { total: await unreadCount(userId) });
      } catch (e: any) {
        socket.emit(EVENTS.ERROR, { message: e?.message ?? "Mark read error" });
      }
    }
  );
}
