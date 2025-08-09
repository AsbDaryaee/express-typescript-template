import { Request, Response } from "express";

import {
  createUser,
  authenticateUser,
  generateToken,
  findUserByEmail,
  logoutUser,
} from "../services/authService";

import {
  publishUserEvent,
  publishEmailNotification,
} from "../services/queueService";

import {
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  AuthRequest,
} from "../types";

import { logger } from "../utils/logger";

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
    const token = generateToken(user);

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
        token,
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

    const token = generateToken(user);

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
        token,
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
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(400)
        .json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    await logoutUser(token);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};
