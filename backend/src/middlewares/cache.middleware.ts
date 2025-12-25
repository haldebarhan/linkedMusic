import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import redisClient from "../config/redis-client";
import crypto from "crypto";

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export const cache = (options: CacheOptions = {}) => {
  const defaultTtl = options.ttl ?? 86400;
  const prefix = options.prefix ?? "";

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (req.method !== "GET") return next();

    const ttl = defaultTtl;
    const key = generateCacheKey(req, prefix);

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        console.log("[CACHE HIT]", key);
        res.setHeader("Content-Type", "application/json");
        return res.send(JSON.parse(cached));
      }

      console.log("[CACHE MISS]", key);

      // Override res.json plutôt que res.send
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          redisClient
            .setEx(key, ttl, JSON.stringify(body))
            .catch((err) => console.error("Cache set error:", err));
        }
        return originalJson(body);
      };

      // Fallback pour res.send avec détection du JSON
      const originalSend = res.send.bind(res);
      res.send = (body) => {
        if (res.statusCode === 200 && body) {
          let dataToCache;

          // Si c'est déjà une string JSON
          if (typeof body === "string") {
            try {
              JSON.parse(body); // Vérifie que c'est du JSON valide
              dataToCache = body;
            } catch {
              // Pas du JSON, on ne cache pas
              return originalSend(body);
            }
          } else if (typeof body === "object") {
            dataToCache = JSON.stringify(body);
          }

          if (dataToCache) {
            redisClient
              .setEx(key, ttl, dataToCache)
              .catch((err) => console.error("Cache set error:", err));
          }
        }
        return originalSend(body);
      };

      return next();
    } catch (error) {
      console.error("Cache error:", error);
      return next();
    }
  };
};

function generateCacheKey(req: AuthenticatedRequest, prefix: string): string {
  const url = req.originalUrl.split("?")[0];
  const params = new URLSearchParams(req.query as any);
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const paramsString = new URLSearchParams(sortedParams).toString();

  const hash = crypto.createHash("md5").update(paramsString).digest("hex");
  const userPart = req.user ? `:user:${req.user.id}` : "";

  return `${prefix}GET:${url}:${hash}${userPart}`;
}
