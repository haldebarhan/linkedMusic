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

// ROUTES
import authRoutes from "./api/auth/route";
import adminRoutes from "./api/admin/route";

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    error: "Trop de requêtes, veuillez réessayer plus tard",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  message: {
    error: "Trop de tentatives de connexion, réessayez plus tard",
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true,
});

// Rate limiting pour les routes admin
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requêtes par minute
  message: {
    error: "Limite de requêtes admin atteinte",
    retryAfter: 60,
  },
});

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.setupErrorHandling();
  }

  config() {
    // Sécurité - Headers de sécurité
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false, // Pour Swagger UI
      })
    );

    this.app.use(compression());

    // Parsing des requêtes
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: false, limit: "10mb" }));

    // CORS sécurisé
    this.app.use(
      cors({
        origin: this.getAllowedOrigins(),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    this.app.use(globalLimiter as any);
    this.app.use(logMiddleware);
    this.app.use(express.urlencoded({ extended: false }));
    this.app.set("PORT", ENV.PORT ?? 4000);
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

    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerOptions, { explorer: true })
    );

    this.app.use("/api/auth", authLimiter, authRoutes);
    this.app.use("/api/admin", adminLimiter, adminRoutes);

    this.app.use((req, res) => {
      res.status(404).json({ error: "Route non trouvée" });
    });
  }

  start() {
    const port = this.app.get("PORT");
    this.app.listen(port, () => {
      logger.info(`🚀 Serveur démarré sur http://localhost:${port}`);
      logger.info(`📚 Documentation API: http://localhost:${port}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${port}/health`);
      logger.info(`🔧 Environnement: ${ENV.NODE_ENV}`);
    });

    // Gestion gracieuse de l'arrêt
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
    // Gestion des erreurs globales
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error("Erreur serveur:", {
          error: err.message,
          stack: err.stack,
          url: req.url,
          method: req.method,
          ip: req.ip,
        });

        // Ne pas exposer les détails d'erreur en production
        if (ENV.NODE_ENV === "production") {
          res.status(500).json({
            error: "Erreur interne du serveur",
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(500).json({
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );

    // Gestion des promesses non catchées
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Promesse non gérée:", { reason, promise });
      // Ne pas arrêter le serveur en production, mais logger l'erreur
      if (ENV.NODE_ENV !== "production") {
        process.exit(1);
      }
    });

    // Gestion des exceptions non catchées
    process.on("uncaughtException", (error: Error) => {
      logger.error("Exception non gérée:", error);
      process.exit(1);
    });
  }

  private getAllowedOrigins(): string[] {
    const origins = [];

    if (ENV.NODE_ENV === "development") {
      origins.push("http://localhost:3000", "http://localhost:3001");
    }

    if (ENV.FRONTEND_URL) {
      origins.push(ENV.FRONTEND_URL);
    }

    if (ENV.ADMIN_URL) {
      origins.push(ENV.ADMIN_URL);
    }

    return origins;
  }
}

const server = new Server();
server.start();
