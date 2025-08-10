import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/myapp",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-key",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "4h",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
} as const;
