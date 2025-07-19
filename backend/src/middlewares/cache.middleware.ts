// cache.middleware.ts
import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis-client'

export const cache = async (req: Request, res: Response, next: NextFunction) => {
    // Utilise l'URL complète comme clé de cache
    const key = `GET:${req.originalUrl}`;

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            console.log('[CACHE HIT]', key);
            return res.json(JSON.parse(cached));
        }

        console.log('[CACHE MISS]', key);

        // Intercepte la méthode `res.json` pour stocker le résultat dans le cache
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            redisClient.setEx(key, 60, JSON.stringify(body)); // 60 secondes TTL
            return originalJson(body);
        };

        return next();
    } catch (error) {
        console.error('Cache error:', error);
        return next();
    }
};
