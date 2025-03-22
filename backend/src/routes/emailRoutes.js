import express from "express";
import { resendVerificationEmail } from "../controllers/emailController.js"; // ✅ Import resend function
import createTransporter from "../config/emailConfig.js"; // ✅ Import centralized email transporter

const router = express.Router();

// 🔹 Send Email Route
router.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const transporter = await createTransporter();  // Create email transporter
    const mailOptions = {
      from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text, // Plain text content of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}`);

    // Respond with success
    res.status(200).json({ message: "📩 Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    // Respond with error details (don't expose sensitive details to the user)
    res.status(500).json({ error: "Failed to send email", details: error.message });
  }
});

// 🔹 Resend Verification Email Route ✅ (Added)
router.post("/resend-verification", resendVerificationEmail);  // Route for resending verification email

export default router;
