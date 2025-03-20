import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";

const router = express.Router();

// ✅ Authentication Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyEmail); // ✅ Verify Email

export default router;
