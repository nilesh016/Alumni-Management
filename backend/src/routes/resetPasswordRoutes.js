import express from "express";
import { forgotPassword, resetPassword } from "../controllers/resetPasswordController.js";

const router = express.Router();

// 🔹 Forgot Password - Send Reset Email
// Sends an email to the user with a reset link
router.post("/forgot-password", forgotPassword); // ✅ Trigger sending reset email

// 🔹 Reset Password - Change Password with Token
// Handles the password reset once the user clicks the reset link
router.post("/reset-password/:token", resetPassword); // ✅ Reset the password using token

export default router;
