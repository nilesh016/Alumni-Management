import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

// 📌 Get User Profile (Protected)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Update User Profile (Protected)
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, bio, avatar, socialLinks, education, workExperience, achievements, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure email uniqueness if updated
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Hash new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Update other fields
    Object.assign(user, { name, email, bio, avatar, socialLinks, education, workExperience, achievements });

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user: { ...user._doc, password: undefined } });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
