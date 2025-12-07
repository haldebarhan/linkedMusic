import { NextFunction, Request, Response } from "express";
import winston from "winston";
import { ENV } from "./env";
const logFormat = winston.format.printf(
  ({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  }
);

const logger = winston.createLogger({
  level: ENV.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(logFormat, winston.format.colorize()),
      level: process.env.NODE_ENV === "production" ? "error" : "debug",
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (ENV.NODE_ENV === "production") {
  logger.add(
    new winston.transports.Http({
      host: ENV.BASE_URL,
      path: "/logs",
      ssl: true,
    })
  );
}

export const logMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`[${req.method}] ${req.originalUrl}`);
  next();
};

export default logger;
