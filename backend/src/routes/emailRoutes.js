import express from "express";
import { body } from "express-validator"; // ✅ Input validation
import { resendVerificationEmail } from "../controllers/emailController.js"; 
import createTransporter from "../config/emailConfig.js"; 

const router = express.Router();

// 📌 Send Email (General Use)
router.post(
  "/send-email",
  [
    body("to").trim().isEmail().withMessage("Valid recipient email is required").toLowerCase(),
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("text").trim().notEmpty().withMessage("Email content is required"),
    body("html").optional().trim(), // ✅ Allow HTML but prevent empty spaces
  ],
  async (req, res) => {
    const { to, subject, text, html } = req.body;

    try {
      // ✅ Ensure email content is present
      if (!text && (!html || html.trim() === "")) {
        return res.status(400).json({ error: "Email must contain text or HTML content" });
      }

      const transporter = await createTransporter();
      const mailOptions = {
        from: `"Alumni Management System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html && html.trim() !== "" ? html : undefined, // ✅ Prevent sending empty HTML
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to: ${to}`);

      res.status(200).json({ message: "📩 Email sent successfully!" });
    } catch (error) {
      console.error("❌ Email Sending Error:", error);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  }
);

// 📌 Resend Verification Email
router.post(
  "/resend-verification",
  [
    body("email").trim().isEmail().withMessage("Valid email is required").toLowerCase(),
  ],
  resendVerificationEmail
);

export default router;
