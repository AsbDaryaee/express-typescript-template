import { Router } from "express";

const router = Router();

// GET all users
router.get("/", (req, res) => {
  res.json({ message: "Get all users" });
});

// GET user by ID
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({ message: `Get user ${userId}` });
});

// POST create user
router.post("/", (req, res) => {
  res.json({ message: "Create user" });
});

// PUT update user
router.put("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({ message: `Update user ${userId}` });
});

// DELETE user
router.delete("/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({ message: `Delete user ${userId}` });
});

export default router;
