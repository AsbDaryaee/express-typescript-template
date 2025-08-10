import { Response, NextFunction } from "express";
import { getUserById } from "../services/userService";
import { AuthRequest } from "../types";
import { logger } from "../utils/logger";
import { isTokenBlacklisted, verifyToken } from "../services/tokenService";

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

    if (await isTokenBlacklisted(token)) {
      res
        .status(401)
        .json({ success: false, message: "Token has been revoked" });
      logger.warn("Attempted use of revoked token");
      return;
    }

    const decoded = verifyToken(token);

    const user = await getUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      logger.warn(`Token used for non-existent user`);
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
      logger.warn(`Token used for non-existent user`);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        logger.warn("Expired token used");
        res.status(401).json({
          success: false,
          message: "Token has expired",
        });
        return;
      }

      if (error.name === "JsonWebTokenError") {
        logger.warn("Invalid token signature");
        res.status(401).json({
          success: false,
          message: "Invalid token",
        });
        return;
      }
    }

    logger.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
