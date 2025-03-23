import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createTransporter from "../config/emailConfig.js";

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// 📌 Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, batch, profession, location } = req.body;

    if (!name || !email || !password || !batch || !profession || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      batch,
      profession,
      location,
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 3600000, // 1 hour expiry
    });

    await sendVerificationEmail(normalizedEmail, verificationToken);
    res.status(201).json({ message: "Registration successful. Verify your email." });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Send Verification Email (Helper Function)
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${process.env.BASE_URL}/api/users/email/verify/${verificationToken}`;
  const mailOptions = {
    from: `Alumni Management System <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email",
    html: `<h2>Welcome</h2><p>Click to verify: <a href="${verificationLink}" target="_blank">Verify Email</a></p>`
  };

  const transporter = await createTransporter();
  await transporter.sendMail(mailOptions);
  console.log(`✅ Verification email sent to: ${email}`);
};

// 📌 Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: "✅ Email verified successfully!" });
  } catch (error) {
    console.error("❌ Email Verification Error:", error);
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

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first." });
    }

    res.cookie("jwt", generateToken(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful!" });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Get User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Search Alumni
export const searchAlumni = async (req, res) => {
  try {
    const { batch, profession, location, name } = req.query;
    const filters = {};

    if (batch) filters.batch = batch;
    if (profession) filters.profession = profession;
    if (location) filters.location = location;
    if (name) filters.name = { $regex: name, $options: "i" };

    const users = await User.find(filters).select("-password");
    res.json(users);
  } catch (error) {
    console.error("❌ Search Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 📌 Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, batch, profession, location } = req.body;

    if (name) user.name = name;
    if (batch) user.batch = batch;
    if (profession) user.profession = profession;
    if (location) user.location = location;

    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Export all controllers (No duplicate exports!)
export {
  registerUser,
  verifyEmail,
  loginUser,
  getProfile,
  searchAlumni,
  updateUserProfile // ✅ Only exported once!
};
