import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Optional: health check or home route
router.get("/", (req, res) => {
  res.json({ message: "API root - see /api/auth and /api/users" });
});

router.all("*path", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});
export default router;
