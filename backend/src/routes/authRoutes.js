import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";

const router = express.Router();

// 🔹 Authentication Routes
router.post("/register", registerUser);   // Route to register a new user
router.post("/login", loginUser);         // Route for user login
router.get("/verify/:token", verifyEmail); // Route to verify the email using the verification token

export default router;
