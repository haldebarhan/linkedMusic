import logger from "@/config/logger";
import { AuthenticatedSocket } from "@/utils/interfaces/authenticated-socket";
import DatabaseService from "@/utils/services/database.service";
import { FirebaseService } from "@/utils/services/firebase.service";
import { PrismaClient, Status } from "@prisma/client";

const firebaseService = FirebaseService.getInstance();
const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const authSocketMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers["authorization"]?.split("Bearer ")[1];

    if (!token) return next(new Error("Authentication error: token missing"));
    const decodedToken = await firebaseService.verifyIdToken(token);
    if (decodedToken.exp * 1000 < Date.now())
      return next(new Error("AUTH_TOKEN_EXPIRED"));

    if (!decodedToken.uid) return next(new Error("AUTH_TOKEN_EXPIRED"));
    const user = await prisma.user.findUnique({
      where: { uid: decodedToken.uid },
      include: { Profile: true },
    });
    if (!user) return next(new Error("AUTH_TOKEN_EXPIRED"));
    if (user.status !== Status.ACTIVATED)
      return next(
        new Error(
          `Account status: ${user.status}. Please contact customer service`
        )
      );
    socket.user = user;
    next();
  } catch (error) {
    logger.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
};
