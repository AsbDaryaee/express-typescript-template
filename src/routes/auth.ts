import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", authenticateToken, logout);

router.post("/refresh", authenticateToken, refresh);

export default router;
