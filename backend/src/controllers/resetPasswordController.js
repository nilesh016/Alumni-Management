import User from "../models/userModel.js";
import crypto from "crypto";
import createTransporter from "../config/emailConfig.js";
import bcrypt from "bcryptjs";

// ✅ Forgot Password (Send Reset Email)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔍 Forgot Password Request for:", email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Reset link
    const resetLink = `${process.env.BASE_URL}/api/password/reset-password/${resetToken}`;

    // Email options
    const mailOptions = {
      from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;color:#fff;background:#dc3545;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    // Send Email
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reset email sent to: ${email}`);

    res.json({ message: "Reset password email sent! Check your inbox." });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Reset Password (Using Token)
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Ensure password meets minimum length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    console.log("🔄 Reset Password Token:", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "✅ Password reset successful! You can now log in." });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
