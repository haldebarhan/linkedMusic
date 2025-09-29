import { authSocketMiddleware } from "@/middlewares/auth-socket.middleware";
import { Server, Socket } from "socket.io";
import { registerChatHandlers } from "./handlers/chat.handler";

export const setupSocket = (io: Server) => {
  io.use(authSocketMiddleware);
  io.on("connection", (socket) => {
    registerChatHandlers(io, socket);
  });
};
