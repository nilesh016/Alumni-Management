import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createTransporter from "../config/emailConfig.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 📌 Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 3600000, // 1 hour expiration
    });

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken);

    res.status(201).json({ message: "Registration successful. Check your email for verification." });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Send Verification Email (Helper Function)
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${process.env.BASE_URL}/api/users/verify/${verificationToken}`;
  
  const mailOptions = {
    from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email",
    html: `
      <h2>Welcome to Alumni Management System</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationLink}" target="_blank" rel="noopener noreferrer"
        style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;text-decoration:none;border-radius:5px;">
        Verify Email
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  const transporter = await createTransporter();
  await transporter.sendMail(mailOptions);
  console.log(`✅ Verification email sent to: ${email}`);
};

// 📌 Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    console.log("🔍 Verifying Token:", hashedToken);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: "✅ Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("❌ Email Verification Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Resend Verification Email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send new verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({ message: "Verification email sent successfully." });
  } catch (error) {
    console.error("❌ Resend Verification Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first." });
    }

    // Set JWT as HTTP-only cookie for better security
    res.cookie("jwt", generateToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ message: "Login successful!" });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Logout User
export const logoutUser = async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "User logged out successfully." });
};

// 📌 Get User Profile
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
