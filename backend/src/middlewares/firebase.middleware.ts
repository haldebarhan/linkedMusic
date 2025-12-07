import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import { NextFunction } from "express";
import { FirebaseService } from "../utils/services/firebase.service";
import { formatResponse } from "../utils/helpers/response-formatter";
import { PrismaClient } from "@prisma/client";
import DatabaseService from "../utils/services/database.service";

const firebaseService = FirebaseService.getInstance();
const prisma: PrismaClient = DatabaseService.getPrismaClient();

export const firebaseMiddleware = async (
  req: AuthenticatedRequest,
  res: any,
  next: NextFunction
) => {
  try {
    let response: any;
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

    req.user = decodedToken;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).send({ error: "Please authenticate" });
  }
};
