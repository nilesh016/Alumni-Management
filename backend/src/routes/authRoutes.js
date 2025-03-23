import express from "express";
import { body, param } from "express-validator"; // ✅ Input validation
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";

const router = express.Router();

// 📌 User Registration
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .toLowerCase(), // ✅ Convert email to lowercase
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  registerUser
);

// 📌 User Login
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .toLowerCase(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

// 📌 Email Verification
router.get(
  "/verify/:token",
  param("token").trim().notEmpty().withMessage("Verification token is required"),
  verifyEmail
);

export default router;
