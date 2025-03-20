import express from "express";
import transporter from "../config/emailConfig.js"; // ✅ Centralized Email Configuration

const router = express.Router();

// ✅ Send Email Route
router.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "📩 Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
