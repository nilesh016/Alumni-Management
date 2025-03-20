import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
