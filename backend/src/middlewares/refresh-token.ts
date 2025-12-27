import { FirebaseService } from "../utils/services/firebase.service";
import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import { NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../config/logger";
import { PrismaClient, Status } from "@prisma/client";
import DatabaseService from "../utils/services/database.service";
import { ENV } from "../config/env";
import axios from "axios";

const firebaseService = FirebaseService.getInstance();
const prisma: PrismaClient = DatabaseService.getPrismaClient();

let certs: { [kid: string]: string } = {};
let lastCertFetch = 0;
const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CERT_CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

const fetchCerts = async () => {
  if (Date.now() - lastCertFetch < CERT_CACHE_TTL) return certs;
  try {
    const { data } = await axios.get(CERT_URL);
    certs = data;
    lastCertFetch = Date.now();
    return certs;
  } catch (err) {
    logger.error("Failed to fetch Firebase certs:", err);
    throw new Error("Cert fetch failed");
  }
};

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
      return res.status(401).json({ message: "Authorization header missing" });
    }
    const [, token] = authorizationHeader.split("Bearer ");
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    // Fetch certs
    const certsMap = await fetchCerts();

    // Parse header pour kid
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString()
    );
    const kid = header.kid;
    if (!kid || !certsMap[kid]) {
      return res
        .status(401)
        .json({ message: "Invalid token (missing/invalid kid)" });
    }

    // Vérifie avec cert, ignore exp
    const payload = jwt.verify(token, certsMap[kid], {
      algorithms: ["RS256"],
      ignoreExpiration: true, // Key pour refresh
    }) as { sub: string; [key: string]: any };

    // Optionnel: Check si expiré depuis trop longtemps
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now - payload.exp > 86400) {
      // >1 jour
      return res.status(401).json({ message: "Token too old" });
    }

    const user = await prisma.user.findUnique({
      where: { uid: payload.sub }, // sub = uid en Firebase
    });

    if (!user || user.status !== Status.ACTIVATED) {
      return res
        .status(401)
        .json({ message: "Token invalid or user inactive" });
    }

    req.token = await firebaseService.loginWithUid(user.uid);
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication Error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token signature" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default refreshTokenMiddleware;
