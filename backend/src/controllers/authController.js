import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createTransporter from "../config/emailConfig.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ Register User with Email Verification
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📩 Register Request:", req.body);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const verificationLink = `${baseUrl}/api/auth/verify/${verificationToken}`;

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

    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);

    res.status(201).json({ message: "User registered successfully! Check your email for verification." });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ✅ Verify Email
export const verifyEmail = async (req, res) => {
  try {
    console.log("🔍 Verifying Token:", req.params.token);
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined; // ✅ Properly remove token
    await user.save(); // ✅ Save changes properly

    res.json({ message: "✅ Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("❌ Email Verification Error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ✅ Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified, // ✅ Added this field
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};
