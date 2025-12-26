import "reflect-metadata";
import compression from "compression";
import express, { Application, NextFunction, Request, Response } from "express";
import { ENV } from "./config/env";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import logger, { logMiddleware } from "./config/logger";
import { swaggerOptions } from "./swagger-config";
import swaggerUi from "swagger-ui-express";
import { createServer, Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIo } from "./sockets/io-singleton";
import hpp from "hpp";

// ROUTES
import authRoutes from "./api/auth/route";
import adminRoutes from "./api/admin/route";
import userRoutes from "./api/users/route";

import { authSocketMiddleware } from "./middlewares/auth-socket.middleware";
import { setupSocket } from "./sockets";
import { getAllowedOrigins } from "./utils/functions/allowed-origins";
import {
  startSubscriptionDailyCron,
  startCheckSubscriptionStatus,
  startAnnouncementHighlightedCron,
  startUpgradeUsersBadge,
  startAlertAdminJob,
} from "./events/schedulers/scheduler";

import path from "path";
import { verifyJekoSignature } from "./utils/functions/signature";
import { WebhookEvent } from "./utils/interfaces/payment-payload";
import { updatePayementStatus } from "./utils/functions/update-payment-status";
import helmet from "helmet";

const allowed = getAllowedOrigins();
const wsAllowed = [...allowed, "ws:", "wss:"];

const skipForRateLImiter = (req: Request) =>
  req.method === "OPTIONS" || req.path.startsWith("/socket.io");

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    error: "Trop de requêtes. veuillez réessayer plus tard",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipForRateLImiter,
});

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    error: "Trop de tentatives de connexion. réessayez plus tard",
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true,
  skip: skipForRateLImiter,
});

// Rate limiting pour les routes admin
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    error: "Limite de requêtes admin atteinte",
    retryAfter: 60,
  },
  skip: skipForRateLImiter,
});

class Server {
  public app: Application;
  private httpServer: HTTPServer;
  private io: IOServer;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.setupErrorHandling();
    startSubscriptionDailyCron();
    startCheckSubscriptionStatus();
    startAnnouncementHighlightedCron();
    startUpgradeUsersBadge();
    startAlertAdminJob();
  }

  config() {
    const corsConfig: cors.CorsOptions = {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    };

    this.app.use(cors(corsConfig));
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
            ],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
              "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css",
            ],
            imgSrc: [
              "'self'",
              "data:",
              "https://zikdev.s3.eu-west-1.amazonaws.com/",
              "https://images.unsplash.com/",
            ],
            mediaSrc: [
              "'self'",
              "https://zikdev.s3.eu-west-1.amazonaws.com/",
              "blob:",
            ],
            connectSrc: ["'self'", ...allowed],
            "script-src-attr": ["'unsafe-inline'"],
          },
        },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      })
    );
    this.app.use((req, res, next) => {
      if (req.method === "OPTIONS") return res.sendStatus(204);
      return next();
    });

    this.app.use(compression());

    this.app.use((req: any, res: any, next: any) => {
      if (req.path === "/webhook/jeko") {
        return next();
      }
      return express.json({ limit: "10mb" })(req, res, next);
    });

    this.app.use(hpp());
    this.app.use(express.urlencoded({ extended: false, limit: "10mb" }));

    this.app.use(globalLimiter as any);
    this.app.use(logMiddleware);
    this.app.set("trust proxy", 1);
    this.app.set("PORT", ENV.PORT ?? 8000);
  }

  routes() {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: ENV.NODE_ENV,
      });
    });

    this.app.post(
      "/webhook/jeko",
      express.raw({ type: "application/json" }),
      async (req: Request, res: Response) => {
        const signature = req.headers["jeko-signature"];
        const rawBody = req.body;

        if (!verifyJekoSignature(rawBody, signature, ENV.JEKO_WEBHOOK_SECRET)) {
          return res.status(401).send("Invalid signature");
        }

        const webhookData = JSON.parse(rawBody.toString()) as WebhookEvent;
        await updatePayementStatus(webhookData);
        return res.status(200).send("OK");
      }
    );

    this.app.get(
      "/payments/callback/:reference/return",
      (req: Request, res: Response) => {
        const { reference } = req.params;
        const FRONT_URL = ENV.FRONTEND_URL;
        const location = `${FRONT_URL.replace(
          /\/$/,
          ""
        )}/transactions/callback/return/${reference}`;
        return res.redirect(302, location);
      }
    );

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerOptions, { explorer: true })
    );

    this.app.use("/api", authRoutes);
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/users", userRoutes);

    const distPath = path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "dist",
      "frontend",
      "browser"
    );

    this.app.use(express.static(distPath));
    this.app.use((req: Request, res: Response) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/webhook") ||
        req.path.startsWith("/health") ||
        req.path.startsWith("/payments") ||
        req.path.startsWith("/socket.io")
      ) {
        return res.status(404).json({ error: "Route non trouvée" });
      }

      return res.sendFile(path.join(distPath, "index.html"));
    });
  }

  start() {
    const port = this.app.get("PORT");
    this.socketConfig();
    this.httpServer.listen(port, async () => {
      logger.info(`🚀 Serveur démarré sur ${ENV.BASE_URL}:${port}`);
      logger.info(`📚 Documentation API: ${ENV.BASE_URL}:${port}/api-docs`);
      logger.info(`🏥 Health check: ${ENV.BASE_URL}:${port}/health`);
      logger.info(`🔧 Environnement: ${ENV.NODE_ENV}`);
    });

    process.on("SIGTERM", () => {
      logger.info("Signal SIGTERM reçu, arrêt du serveur...");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("Signal SIGINT reçu, arrêt du serveur...");
      process.exit(0);
    });
  }

  setupErrorHandling(): void {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error("Erreur serveur:", {
          error: err?.message ?? String(err),
          stack: err?.stack,
          url: req.url,
          method: req.method,
          ip: req.ip,
        });

        const payload =
          ENV.NODE_ENV === "production"
            ? {
                error: "Erreur interne du serveur",
                timestamp: new Date().toISOString(),
              }
            : {
                error: err?.message,
                stack: err?.stack,
                timestamp: new Date().toISOString(),
              };
        res.status(500).json(payload);
      }
    );
    const shouldExit = ENV.NODE_ENV === "production";
    process.on("unhandledRejection", (reason: any, p) => {
      const msg = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      logger.error("[unhandledRejection]", { msg, stack, promise: p });
      if (shouldExit) process.exit(1);
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("[uncaughtException]", {
        error: error.message,
        stack: error.stack,
      });
      if (shouldExit) process.exit(1);
    });
  }

  private socketConfig() {
    let serverOptions: any = this.app;
    if (ENV.NODE_ENV === "production") {
      const fs = require("fs");
      const httpsOptions = {
        key: fs.readFileSync("/etc/letsencrypt/live/zikmusik.com/privkey.pem"),
        cert: fs.readFileSync(
          "/etc/letsencrypt/live/zikmusik.com/fullchain.pem"
        ),
      };
      this.httpServer = require("https").createServer(
        httpsOptions,
        serverOptions
      );
    } else {
      this.httpServer = createServer(serverOptions);
    }
    this.io = new IOServer(this.httpServer, {
      path: "/socket.io",
      cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });
    this.io.use(async (socket, next) => {
      try {
        await authSocketMiddleware(socket, next);
      } catch (err: any) {
        logger.warn("[socket auth] error", err?.message || err);
        next(new Error("unauthorized"));
      }
    });
    setIo(this.io);
    setupSocket(this.io);
  }
}

(async () => {
  const server = new Server();
  server.start();
})();
