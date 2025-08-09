import amqp, { Connection, Channel } from "amqplib";
import { config } from "./index";
import { logger } from "../utils/logger";

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(config.RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare queues
    await channel.assertQueue("user-events", { durable: true });
    await channel.assertQueue("email-notifications", { durable: true });

    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
};

export const disconnectRabbitMQ = async (): Promise<void> => {
  if (channel) await channel.close();
  if (connection) await connection.close();
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  return channel;
};
