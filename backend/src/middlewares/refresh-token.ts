import { FirebaseService } from "@/utils/services/firebase.service";
import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "@/config/logger";
import { PrismaClient, Status } from "@prisma/client";
import DatabaseService from "@/utils/services/database.service";

const firebaseService = FirebaseService.getInstance();
const prisma: PrismaClient = DatabaseService.getPrismaClient();

const refreshTokenMiddleware = async (
  req: AuthenticatedRequest,
  res: any,
  next: NextFunction
) => {
  try {
    const userAgent = req.get("user-agent");
    const ip = req.ip;
    if (!userAgent || !ip)
      return res.status(400).json({ message: "Unknown user agent or IP" });
    const authorizationHeader = req.header("Authorization");
    if (!authorizationHeader) {
      return res.status(401).json({
        message: "Authorization header missing",
      });
    }
    const [, token] = authorizationHeader.split("Bearer ");

    if (!token) {
      return res.status(401).json({
        message: "Authorization token missing",
      });
    }
    const payload = jwt.decode(token) as {
      user_id: string;
      [key: string]: any;
    };

    const user = await prisma.user.findUnique({
      where: { uid: payload.user_id },
    });

    if (!user || user.status !== Status.ACTIVATED) {
      return res.status(401).json({
        message: "Token invalid or expired",
      });
    }

    if (payload.userAgent !== userAgent || payload.ip !== ip) {
      logger.warn("Connexion suspecte détectée", {
        uid: payload.uid,
        currentIP: req.ip,
        expectedIP: payload.ip,
        currentUA: userAgent,
        expectedUA: payload.userAgent,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: Status.SUSPENDED,
          comments:
            "Connexion suspecte détectée: possible usurpation de compte",
        },
      });
      return res.status(403).json({
        message: "Connexion suspecte détectée. Veuillez contacter le support.",
      });
    }
    const refreshToken = await firebaseService.loginWithUid(payload.user_id);
    req.token = refreshToken;
    next();
  } catch (error) {
    logger.error("Authentication Error:", error);
    return res.status(401).send({ error: "Invalid token" });
  }
};

export default refreshTokenMiddleware;
