import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// 📌 Get all notifications
router.get("/", protect, getNotifications);

// 📌 Get unread notification count (for real-time updates)
router.get("/unread-count", protect, getUnreadNotificationCount);

// 📌 Mark a single notification as read
router.put("/mark-read", protect, markNotificationAsRead);

// 📌 Mark all notifications as read
router.put("/mark-all-read", protect, markAllNotificationsAsRead);

// 📌 Delete a notification
router.delete("/:notificationId", protect, deleteNotification);

export default router;
