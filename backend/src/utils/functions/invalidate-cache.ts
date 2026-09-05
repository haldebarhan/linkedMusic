import logger from "@/config/logger";
import redisClient from "../../config/redis-client";

export const invalideCache = async (input: string) => {
  const keys = await redisClient.keys(input);
  for (const key of keys) {
    logger.info("deleting key: ", key);
    await redisClient.del(key);
  }
};
