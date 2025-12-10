import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../utils/interfaces/authenticated-request";
import redisClient from "../config/redis-client";

export const cache = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const ttl = 86400;
  const key = generateCacheKey(req);

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      console.log("[CACHE HIT]", key);
      return res.json(JSON.parse(cached));
    }

    console.log("[CACHE MISS]", key);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redisClient.setEx(key, ttl, JSON.stringify(body));
      return originalJson(body);
    };

    return next();
  } catch (error) {
    console.error("Cache error:", error);
    return next();
  }
};

function generateCacheKey(req: AuthenticatedRequest): string {
  const url = req.originalUrl.split("?")[0];
  const params = new URLSearchParams(req.query as any);
  const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const paramsString = new URLSearchParams(sortedParams).toString();
  const userPart = req.user ? `:user:${req.user.id}` : "";

  return `GET:${url}${paramsString ? "?" + paramsString : ""}${userPart}`;
}
