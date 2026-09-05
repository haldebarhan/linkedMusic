import { NextFunction, Request, Response } from "express";
import winston from "winston";
import devLogger from "../config/logger/dev-logger"
import productionLogger from "../config/logger/production-logger"
import { ENV } from "./env";

const logger: winston.Logger = ENV.NODE_ENV === "production" ? productionLogger() : devLogger()

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
