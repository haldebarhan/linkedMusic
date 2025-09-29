import http from "http";
import type { Express } from "express";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getAllowedOrigins } from "@/utils/functions/allowed-origins";
import { ENV } from "@/config/env";

export type AppSocketData = { userId: number };
export let io: Server | null = null;

export const attachSocketServer = (app: Express) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const hs: any = socket.handshake;
      const token =
        hs.auth?.token ||
        hs.headers?.["x-access-token"] ||
        (hs.query?.token as string);
      if (!token) return next(new Error("NO_TOKEN"));
      const decoded = jwt.verify(token, ENV.TOKEN_SECRET!) as any;
      const userId = decoded?.sub ?? decoded?.id;
      if (!userId) return next(new Error("INVALID_TOKEN"));
      (socket.data as AppSocketData).userId = userId;
      next();
    } catch (error) {
      next(new Error("AUTH_FAILED"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data as AppSocketData;

    // room privée par utilisateur → notifications/badges
    socket.join(`user:${userId}`);

    // rooms par thread → live dans une seule conversation
    socket.on("thread:join", (threadId: number) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on("thread:leave", (threadId: number) => {
      socket.leave(`thread:${threadId}`);
    });
  });

  return server;
};
