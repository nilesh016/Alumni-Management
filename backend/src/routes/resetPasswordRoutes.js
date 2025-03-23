import express from "express";
import { body, param } from "express-validator"; // 🔹 Input validation
import rateLimit from "express-rate-limit"; // 🔹 Rate limiting
import { forgotPassword, resetPassword } from "../controllers/resetPasswordController.js";

const router = express.Router();

// ✅ Rate Limiting: Prevent spamming forgot password requests
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per IP per windowMs
  message: "Too many password reset attempts. Please try again later.",
});

// ✅ Forgot Password - Send Reset Email
router.post(
  "/forgot-password",
  forgotPasswordLimiter, // Apply rate limit
  [body("email").isEmail().withMessage("Invalid email format")], // Validate email format
  forgotPassword
);

// ✅ Rate Limit for Reset Password to prevent brute force attacks
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 requests per IP per windowMs
  message: "Too many password reset attempts. Please try again later.",
});

// ✅ Reset Password - Change Password with Token
router.patch(
  "/reset-password/:token",
  resetPasswordLimiter, // Apply rate limit
  [
    param("token").notEmpty().withMessage("Reset token is required"), // Validate token
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Passwords do not match"), // Ensure passwords match
  ],
  resetPassword
);

export default router;
