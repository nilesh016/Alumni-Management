import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createTransporter from "../config/emailConfig.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register User
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    // Construct verification link
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const verificationLink = `${baseUrl}/api/users/verify/${verificationToken}`;

    // Email options
    const mailOptions = {
      from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome to Alumni Management System</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send email using OAuth2 transporter
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);

    console.log(`✅ Verification email sent to: ${email}`);
    res.status(201).json({ message: "Registration successful. Check your email for verification." });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Verify Email
// @route   GET /api/users/verify/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    console.log("🔍 Verifying Token:", req.params.token);
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
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Login User
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first." });
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
    res.status(500).json({ message: "Server error", error });
  }
};

// @desc    Get User Profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
