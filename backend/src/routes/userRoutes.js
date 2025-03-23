import express from "express";
import { verifyEmail, getProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";  
import { param } from "express-validator"; // 🔹 Input validation

const router = express.Router();

// ✅ Rate-limiting: Prevent excessive verification requests
const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit to 3 requests per 10 minutes
  message: "Too many verification attempts. Please try again later.",
});

// 🔹 Email Verification Route (Protected with Rate Limit & Input Validation)
router.get(
  "/email/verify/:token",
  verifyEmailLimiter, 
  param("token").notEmpty().withMessage("Verification token is required"), // Validate token
  verifyEmail
);

// 🔹 Get User Profile (Protected Route)
router.get("/user/profile", protect, getProfile);

export default router;
