import { io } from "./socket";

export const emitNewMessage = (payload: {
  id: number;
  threadId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}) => {
  if (!io) return;

  io.to(`thread:${payload.threadId}`).emit("message:new", payload);

  // mise à jour de la preview du fil (gauche) pour les 2 participants
  io.to(`user:${payload.senderId}`).emit("threads:upsert", {
    threadId: payload.threadId,
    lastSnippet: payload.content,
    lastAt: payload.createdAt,
  });

  io.to(`user:${payload.receiverId}`).emit("threads:upsert", {
    threadId: payload.threadId,
    lastSnippet: payload.content,
    lastAt: payload.createdAt,
  });

  // incrémente badge “unread” côté destinataire
  io.to(`user:${payload.receiverId}`).emit("badge:update", { delta: +1 });
};

/** Appelé quand l’utilisateur marque un thread comme lu */

export const emitThreadRead = (
  userId: number,
  threadId: number,
  unreadDelta: number
) => {
  if (!io) return;
  io.to(`user:${userId}`).emit("threads:read", { threadId });
  if (unreadDelta > 0) {
    io.to(`user:${userId}`).emit("badge:update", { delta: -unreadDelta });
  }
};
