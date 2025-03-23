import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  sendMessage,
  fetchMessages,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Access or create a 1-on-1 chat
router.post("/", protect, accessChat);

// 🔹 Fetch all chats of the logged-in user
router.get("/", protect, fetchChats);

// 🔹 Create a new group chat
router.post("/group", protect, createGroupChat);

// 🔹 Send a message in a chat
router.post("/message", protect, sendMessage);

// 🔹 Get all messages in a chat
router.get("/:chatId/messages", protect, fetchMessages);

export default router;
