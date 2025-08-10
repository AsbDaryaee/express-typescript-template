import { Request, Response } from "express";

import {
  createUser,
  authenticateUser,
  findUserByEmail,
} from "../services/authService";

import {
  generateAccessToken,
  generateRefreshToken,
  invalidateRefreshToken,
  isRefreshTokenValid,
  logoutUser,
  verifyToken,
} from "../services/tokenService";

import {
  publishUserEvent,
  publishEmailNotification,
} from "../services/queueService";

import { LoginRequest, RegisterRequest, ApiResponse } from "../types";

import { logger } from "../utils/logger";
import { User } from "../db/schema/users";

export const register = async (
  req: Request<{}, ApiResponse, RegisterRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const user = await createUser({ email, password, firstName, lastName });
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Publish events
    await publishUserEvent("user.registered", user.id, { email: user.email });
    await publishEmailNotification(
      user.email,
      "Welcome!",
      "Welcome to our platform!"
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};

export const login = async (
  req: Request<{}, ApiResponse, LoginRequest>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await authenticateUser(email, password);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    // Publish event
    await publishUserEvent("user.login", user.id, { timestamp: new Date() });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const user: User = req.user;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });
    }

    const accessToken = authHeader.split(" ")[1];

    await logoutUser(accessToken);
    await invalidateRefreshToken(user.id);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const user: User = req.user;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(400)
        .json({ success: false, message: "No refresh token provided" });
    }

    const refreshToken = authHeader.split(" ")[1];

    const isTokenValid = await isRefreshTokenValid(refreshToken);

    if (!isTokenValid) {
      return res.status(403).json({
        success: false,
        message: "Refresh token is invalid or expired",
      });
    }

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh access token",
    });
  }
};
