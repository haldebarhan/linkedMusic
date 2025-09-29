import type { Server } from "socket.io";
let ioRef: Server | null = null;

export const setIo = (io: Server) => (ioRef = io);
export const getIo = (): Server => {
  if (!ioRef) throw new Error("Socket.io not initialized");
  return ioRef;
};
