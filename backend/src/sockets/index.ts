import { Server, Socket } from "socket.io";
import { AuthenticatedSocket } from "@/utils/interfaces/authenticated-socket";
import { registerChatHandlers } from "./handlers/chat.handler";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.data.user;
    console.log("🔌 Nouvelle connexion socket", user);
    registerChatHandlers(io, authSocket);
  });
};
