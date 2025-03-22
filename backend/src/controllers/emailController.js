import User from "../models/userModel.js";
import createTransporter from "../config/emailConfig.js";
import crypto from "crypto";

// ✅ Resend Verification Email
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update the user with the new verification token
    user.verificationToken = verificationToken;
    await user.save();

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

    // Send the verification email
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);

    console.log(`✅ Verification email sent to: ${email}`);
    res.status(200).json({ message: "Verification email sent successfully!" });
  } catch (error) {
    console.error("❌ Email Resend Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
