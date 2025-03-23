import express from "express";
import { verifyEmail, getProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import { param, validationResult } from "express-validator"; // 🔹 Input validation

const router = express.Router();

// ✅ Rate-limiting: Prevent excessive verification requests
const verifyEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit to 3 requests per 10 minutes
  message: { message: "Too many verification attempts. Please try again later." },
});

// ✅ Middleware for handling validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 🔹 Email Verification Route (Protected with Rate Limit & Input Validation)
router.get(
  "/email/verify/:token",
  verifyEmailLimiter,
  [param("token").notEmpty().withMessage("Verification token is required")],
  validateRequest,
  verifyEmail
);

// 🔹 Get User Profile (Protected Route)
router.get("/profile", protect, getProfile);

export default router;
