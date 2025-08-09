import { getChannel } from "../config/rabbitmq";
import { logger } from "../utils/logger";

export const publishUserEvent = async (
  event: string,
  userId: number,
  data: any
): Promise<void> => {
  try {
    const channel = getChannel();
    const message = {
      event,
      userId,
      data,
      timestamp: new Date().toISOString(),
    };

    await channel.sendToQueue(
      "user-events",
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );

    logger.info(`User event published: ${event} for user ${userId}`);
  } catch (error) {
    logger.error("Failed to publish user event:", error);
  }
};

export const publishEmailNotification = async (
  to: string,
  subject: string,
  body: string
): Promise<void> => {
  try {
    const channel = getChannel();
    const message = {
      to,
      subject,
      body,
      timestamp: new Date().toISOString(),
    };

    await channel.sendToQueue(
      "email-notifications",
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );

    logger.info(`Email notification queued for: ${to}`);
  } catch (error) {
    logger.error("Failed to queue email notification:", error);
  }
};
