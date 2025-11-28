import DatabaseService from "@/utils/services/database.service";
import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import { PrismaClient, Status, SubscriptionStatus } from "@prisma/client";
import { NextFunction } from "express";
import { FirebaseService } from "@/utils/services/firebase.service";
import logger from "@/config/logger";
import { formatResponse } from "@/utils/helpers/response-formatter";
import { S3Service } from "@/utils/services/s3.service";
import { ENV } from "@/config/env";

const prisma: PrismaClient = DatabaseService.getPrismaClient();
const firebaseService = FirebaseService.getInstance();
const s3service: S3Service = S3Service.getInstance();

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: any,
  next: NextFunction
) => {
  try {
    let response: any;
    const userAgent = req.get("user-agent");
    const ip = req.ip;
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

    const user = await prisma.user.findUnique({
      where: { uid: decodedToken.uid },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          select: {
            startAt: true,
            endAt: true,
            autoRenew: true,
            status: true,
            plan: {
              select: {
                name: true,
                period: true,
                priceCents: true,
                benefits: { select: { benefit: { select: { label: true } } } },
              },
            },
          },
        },
      },
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
    user.profileImage = await s3service.generatePresignedUrl(
      ENV.AWS_S3_DEFAULT_BUCKET,
      user.profileImage
    );
    req.user = { ...user, provider: decodedToken.firebase.sign_in_provider };
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).send({ error: "Please authenticate" });
  }
};

export default authMiddleware;
