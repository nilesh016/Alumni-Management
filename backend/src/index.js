import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables at the very beginning

console.log("🔍 Checking OAuth2 ENV Variables:");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "Not Set ❌");
console.log("EMAIL_CLIENT_ID:", process.env.EMAIL_CLIENT_ID ? "Loaded ✅" : "Not Loaded ❌");
console.log("EMAIL_CLIENT_SECRET:", process.env.EMAIL_CLIENT_SECRET ? "Loaded ✅" : "Not Loaded ❌");
console.log("EMAIL_REFRESH_TOKEN:", process.env.EMAIL_REFRESH_TOKEN ? "Loaded ✅" : "Not Loaded ❌");
console.log("EMAIL_ACCESS_TOKEN:", process.env.EMAIL_ACCESS_TOKEN ? "Loaded ✅" : "Not Loaded ❌");

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import resetPasswordRoutes from "./routes/resetPasswordRoutes.js"; // ✅ Import Reset Password Routes
import profileRoutes from "./routes/profileRoutes.js"; // ✅ Import Profile Routes

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/password", resetPasswordRoutes); // ✅ Added Reset Password Routes
app.use("/api/profile", profileRoutes); // ✅ Added Profile Routes

// ✅ Default Route
app.get("/", (req, res) => res.send("API is running..."));

// ✅ Error Handling Middleware (Before catch-all)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// ✅ Catch-all for undefined routes (MUST BE LAST)
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
