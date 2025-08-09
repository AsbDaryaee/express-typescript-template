import { createClient } from "redis";
import { config } from "./index";
import { logger } from "../utils/logger";

const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  await redisClient.disconnect();
};

export { redisClient };
