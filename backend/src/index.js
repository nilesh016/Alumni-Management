import dotenv from "dotenv";
dotenv.config(); // ✅ Load environment variables at the very beginning

import express from "express";
import cors from "cors";
import morgan from "morgan"; // ✅ Logging middleware
import connectDB from "./config/db.js";
import { createServer } from "http"; // 🔹 Import HTTP for Socket.io
import { Server } from "socket.io"; // 🔹 Import Socket.io

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import resetPasswordRoutes from "./routes/resetPasswordRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import alumniRoutes from "./routes/alumniRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";




// ✅ Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app); // ✅ Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // ✅ Allow frontend from env
    credentials: true, // ✅ Allow cookies if needed
  },
});

// ✅ Store Socket.io globally for use in controllers
global._io = io;

// ✅ Store connected users (socket ID mapping)
global.connectedUsers = new Map(); // ✅ Ensure it's globally accessible

// ✅ Handle socket connection
io.on("connection", (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  // 🔹 Store user socket ID
  socket.on("userConnected", (userId) => {
    global.connectedUsers.set(userId, socket.id);
    socket.join(userId); // ✅ Join a room for direct notifications
    console.log(`✅ User ${userId} mapped to socket ${socket.id}`);
  });

  // 🔹 Listen for notification events
  socket.on("sendNotification", ({ recipientId, message }) => {
    const recipientSocketId = global.connectedUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveNotification", { message });
      console.log(`📩 Real-time notification sent to ${recipientId}: ${message}`);
    } else {
      console.log(`⚠️ User ${recipientId} is offline, storing in DB.`);
      // TODO: Save to DB for offline users
    }
  });

  // 🔹 Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    for (let [userId, socketId] of global.connectedUsers.entries()) {
      if (socketId === socket.id) {
        global.connectedUsers.delete(userId);
        console.log(`🗑️ Removed user ${userId} from connected users`);
        break;
      }
    }
  });
});

// ✅ Middleware
app.use(express.json());
app.use(morgan("dev")); // ✅ Request logging
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ✅ Attach `io` to request (to use in controllers)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/password", resetPasswordRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);


// ✅ Default Route
app.get("/", (req, res) => res.send("API is running..."));

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { error: err.stack }), // Hide stack trace in production
  });
});

// ✅ Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

// ✅ Start Server with Socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Graceful Shutdown Handling
process.on("SIGINT", async () => {
  console.log("⚠️ Shutting down gracefully...");
  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });
});
