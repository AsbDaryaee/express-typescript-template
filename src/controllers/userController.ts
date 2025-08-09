import { Response } from "express";
import {
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
} from "../services/userService";
import { AuthRequest, ApiResponse } from "../types";
import { logger } from "../utils/logger";

export const getUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "User retrieved successfully",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    const user = await updateUser(userId, updates);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await getAllUsers(limit, offset);

    res.json({
      success: true,
      message: "Users retrieved successfully",
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    logger.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};
