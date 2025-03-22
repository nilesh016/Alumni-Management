import express from "express";
import { verifyEmail, getProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";  // Rate-limiting for sensitive routes

const router = express.Router();

// 🔹 Rate-limiting for Email Verification Route
const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit to 5 requests per hour
  message: "Too many verification requests, please try again later.",
});

// Apply rate limiter to the email verification route
router.get("/verify/:token", verifyEmailLimiter, verifyEmail);

// 🔹 Get User Profile (Protected Route)
router.get("/profile", protect, getProfile);

export default router;
