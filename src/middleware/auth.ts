import { Response, NextFunction } from "express";

import {
  verifyToken,
  findUserById,
  isTokenBlacklisted,
} from "../services/authService";

import { AuthRequest } from "../types";

import { logger } from "../utils/logger";
import { getCache, setCache } from "../services/cacheService";

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Access token required" });
      return;
    }

    await setCache("kir", true);

    if (await isTokenBlacklisted(token)) {
      res.status(401).json({ success: false, message: "Token revoked" });
      logger.error("Revoked token rejected");
      return;
    }

    const decoded = verifyToken(token);
    const user = await findUserById(decoded.userId);

    if (!user || !user.isActive) {
      res
        .status(401)
        .json({ success: false, message: "Invalid token or user not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res
      .status(403)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
