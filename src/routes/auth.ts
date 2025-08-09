import { Router } from "express";

const router = Router();

router.post("/register", (req, res) => {
  res.json({ message: "Register endpoint" });
});

router.post("/login", (req, res) => {
  res.json({ message: "Login endpoint" });
});

router.post("/logout", (req, res) => {
  res.json({ message: "Logout endpoint" });
});

export default router;
