import express from "express";
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Get User Profile
// Only accessible if the user is authenticated
router.get("/profile", protect, getUserProfile); // ✅ Get user profile

// 🔹 Update User Profile
// Only accessible if the user is authenticated
router.put("/profile", protect, updateUserProfile); // ✅ Update user profile

export default router;
