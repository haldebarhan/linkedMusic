import redisClient from "../../config/redis-client"

export const invalideCache = async (input: string) => {
    const keys = await redisClient.keys(input)
    for (const key of keys) {
        await redisClient.del(key);
    }
}