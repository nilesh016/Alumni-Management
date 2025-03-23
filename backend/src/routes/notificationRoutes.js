import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deliverOfflineNotifications,
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

// 📌 Deliver Offline Notifications when user logs in
router.post("/deliver-offline", protect, async (req, res) => {
  try {
    await deliverOfflineNotifications(req.user._id);
    res.status(200).json({ message: "Offline notifications delivered successfully." });
  } catch (error) {
    console.error("❌ Deliver Offline Notifications Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
