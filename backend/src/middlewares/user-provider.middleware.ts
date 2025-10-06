import logger from "@/config/logger";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import DatabaseService from "@/utils/services/database.service";
import { FirebaseService } from "@/utils/services/firebase.service";
import { PrismaClient, Role, Status } from "@prisma/client";
import { NextFunction } from "express";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const firebaseService = FirebaseService.getInstance();

const UserAndProviderMiddleware = async (
  req: AuthenticatedRequest,
  res: any,
  next: NextFunction
) => {
  try {
    const userAgent = req.get("user-agent");
    const ip = req.ip;
    let response: any;
    if (!userAgent || !ip) {
      response = formatResponse(400, {
        message: "Unknown user agent or IP",
      });
      return res.status(400).json(response);
    }
    const authorizationHeader = req.header("Authorization");
    if (!authorizationHeader) {
      response = formatResponse(401, {
        message: "Authorization header missing",
      });
      return res.status(401).json(response);
    }

    const [, token] = authorizationHeader.split("Bearer ");

    if (!token) {
      response = formatResponse(401, {
        message: "Authorization token missing",
      });
      return res.status(401).json(response);
    }

    const decodedToken = await firebaseService.verifyIdToken(token);

    if (decodedToken.exp * 1000 < Date.now()) {
      response = formatResponse(401, {
        message: "AUTH_TOKEN_EXPIRED",
      });
      return res.status(401).json(response);
    }

    if (!decodedToken.uid) {
      response = formatResponse(401, {
        message: "Token invalid or expired",
      });
      return res.status(401).json(response);
    }

    const user = await prisma.user.findFirst({
      where: { uid: decodedToken.uid },
    });

    if (!user) {
      response = formatResponse(401, {
        message: "Token invalid or expired",
      });
      return res.status(401).json(response);
    }

    if (user.status !== Status.ACTIVATED) {
      response = formatResponse(401, {
        message: `Account status: ${user.status}. Please contact customer service`,
      });
      return res.status(401).json(response);
    }

    if (user.role !== Role.USER && user.role !== Role.PROVIDER) {
      response = formatResponse(403, {
        message: `Unauthorized access: USER or PROVIDER role required`,
      });
      return res.status(403).json(response);
    }

    if (decodedToken.userAgent !== userAgent || decodedToken.ip !== ip) {
      logger.warn("Connexion suspecte détectée", {
        uid: decodedToken.uid,
        currentIP: req.ip,
        expectedIP: decodedToken.ip,
        currentUA: userAgent,
        expectedUA: decodedToken.userAgent,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: Status.SUSPENDED,
          comments:
            "Connexion suspecte détectée: possible usurpation de compte",
        },
      });
      response = formatResponse(403, {
        message: "Connexion suspecte détectée. Veuillez contacter le support.",
      });
      return res.status(403).json(response);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    let response = formatResponse(401, {
      message: "Please authenticate",
    });
    return res.status(401).send(response);
  }
};

export default UserAndProviderMiddleware;
