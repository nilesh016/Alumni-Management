import User from "../models/userModel.js";
import createTransporter from "../config/emailConfig.js";
import crypto from "crypto";

// 📌 Resend Verification Email (Optimized)
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user and check verification status
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Prevent frequent email resends (Limit: 5 minutes)
    const lastSent = user.verificationSentAt || 0;
    const now = Date.now();
    if (now - lastSent < 5 * 60 * 1000) {
      return res.status(429).json({ message: "Please wait before requesting another verification email." });
    }

    // Generate a new secure verification token (if needed)
    if (!user.verificationToken) {
      user.verificationToken = crypto.randomBytes(32).toString("hex");
    }
    user.verificationSentAt = now; // Track last sent time
    await user.save(); // ✅ Save only when necessary

    // Construct verification link
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    const verificationLink = `${baseUrl}/api/auth/verify/${user.verificationToken}`;

    // Email content
    const mailOptions = {
      from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Resend",
      html: `
        <h2>Welcome back to the Alumni Management System</h2>
        <p>You requested a new verification email.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#007bff;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send the verification email
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);

    console.log(`✅ Verification email re-sent to: ${email}`);
    res.status(200).json({ message: "A new verification email has been sent!" });
  } catch (error) {
    console.error("❌ Resend Verification Email Error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
