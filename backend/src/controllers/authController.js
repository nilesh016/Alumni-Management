import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../config/emailConfig.js"; // ✅ Correct Import

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc Register User & Send Verification Email
// @route POST /api/auth/register
// @access Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📩 Register Request:", req.body); // ✅ Debugging

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken, // Store token for email verification
      isVerified: false, // Default false
    });

    // Ensure BASE_URL exists
    const baseUrl = process.env.BASE_URL || "http://localhost:5000"; // Fallback for testing
    const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;

    // Send Verification Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verificationLink}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", email);

    res.status(201).json({ message: "User registered successfully! Check your email for verification." });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Verify User Email
// @route GET /api/auth/verify/:token
// @access Public
export const verifyEmail = async (req, res) => {
  try {
    console.log("🔍 Verifying Token:", req.params.token); // ✅ Debugging
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined; // Remove token after verification
    await user.save();

    res.json({ message: "✅ Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("❌ Email Verification Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Login User (Only Verified Users)
// @route POST /api/auth/login
// @access Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Login Attempt:", req.body); // ✅ Debugging

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
