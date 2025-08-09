import { redisClient } from "../config/redis";
import { logger } from "../utils/logger";

export const setCache = async (
  key: string,
  value: any,
  ttl: number = 3600
): Promise<void> => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error("Cache set error:", error);
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error("Cache get error:", error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error("Cache delete error:", error);
  }
};

export const generateUserCacheKey = (userId: number): string =>
  `user:${userId}`;
