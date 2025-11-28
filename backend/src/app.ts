import "reflect-metadata";
import compression from "compression";
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { ENV } from "./config/env";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import logger, { logMiddleware } from "./config/logger";
import { swaggerOptions } from "./swagger-config";
import swaggerUi from "swagger-ui-express";
import { createServer, Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIo } from "./sockets/io-singleton";

// ROUTES
import authRoutes from "./api/auth/route";
import adminRoutes from "./api/admin/route";
import userRoutes from "./api/users/route";
import pspRoutes from "./api/psp/psp.route";
import { authSocketMiddleware } from "./middlewares/auth-socket.middleware";
import { setupSocket } from "./sockets";
import { getAllowedOrigins } from "./utils/functions/allowed-origins";
import {
  startSubscriptionDailyCron,
  startCheckSubscriptionStatus,
  startAnnouncementHighlightedCron,
} from "./events/schedulers/scheduler";
import path from "path";

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  message: {
    error: "Trop de tentatives de connexion. réessayez plus tard",
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true,
  skip: skipForRateLImiter,
});

// Rate limiting pour les routes admin
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requêtes par minute
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
    // startSubscriptionDailyCron();
    // startCheckSubscriptionStatus();
  }

  config() {
    const corsConfig: cors.CorsOptions = {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    };

    this.app.use(cors(corsConfig));
    this.app.use((req, res, next) => {
      if (req.method === "OPTIONS") return res.sendStatus(204);
      return next();
    });

    this.app.use(compression());

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: false, limit: "10mb" }));

    // this.app.use(globalLimiter as any);
    this.app.use(logMiddleware);
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

    this.app.post("/payment/return", (req: Request, res: Response) =>
      res.sendStatus(200)
    );

    this.app.get("/payment/return", (req: Request, res: Response) => {
      const FRONT_URL = ENV.FRONTEND_URL ?? "http://localhost:4200";
      const qs = req.originalUrl.includes("?")
        ? "?" + req.originalUrl.split("?")[1]
        : "";
      const location = `${FRONT_URL.replace(/\/$/, "")}/payment/return${qs}`;
      return res.redirect(302, location);
    });

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerOptions, { explorer: true })
    );

    this.app.use("/api", authRoutes);
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/webhooks/psp", pspRoutes);
    this.app.use("/api", authRoutes);
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/webhooks/psp", pspRoutes);

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
        req.path.startsWith("/webhooks") ||
        req.path.startsWith("/health") ||
        req.path.startsWith("/payment") ||
        req.path.startsWith("/socket.io")
      ) {
        res.status(404).json({ error: "Route non trouvée" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  start() {
    const port = this.app.get("PORT");
    this.socketConfig();
    this.httpServer.listen(port, async () => {
      logger.info(`🚀 Serveur démarré sur http://localhost:${port}`);
      logger.info(`📚 Documentation API: http://localhost:${port}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${port}/health`);
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
    this.httpServer = createServer(this.app);
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
