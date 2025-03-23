import express from "express";
import { body } from "express-validator";
import { getUserProfile, updateUserProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Get User Profile (Protected Route)
router.get("/profile", protect, getUserProfile);

// ✅ Update User Profile (Protected Route)
router.patch(
  "/profile",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("bio").optional().isLength({ max: 500 }).withMessage("Bio must be under 500 characters"),
    
    // 🔹 Social Links Validation
    body("socialLinks.linkedin").optional().isURL().withMessage("Invalid LinkedIn URL"),
    body("socialLinks.github").optional().isURL().withMessage("Invalid GitHub URL"),
    body("socialLinks.twitter").optional().isURL().withMessage("Invalid Twitter URL"),
    
    // 🔹 Education, Work, Achievements Validation (Optional)
    body("education").optional().isArray().withMessage("Education must be an array"),
    body("workExperience").optional().isArray().withMessage("Work experience must be an array"),
    body("achievements").optional().isArray().withMessage("Achievements must be an array"),
  ],
  updateUserProfile
);

export default router;
