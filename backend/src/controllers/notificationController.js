import Notification from "../models/notificationModel.js";

// 📌 Function to Emit Updated Unread Count
const emitUnreadCount = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    const recipientSocketId = global._io?.connectedUsers?.get(userId);
    if (recipientSocketId) {
      global._io.to(recipientSocketId).emit("updateUnreadCount", unreadCount);
    }
  } catch (error) {
    console.error("❌ Emit Unread Count Error:", error);
  }
};

// 📌 Send Notification (with real-time & offline support)
export const sendNotification = async (recipientId, senderId, type, message) => {
  try {
    // ✅ Save the notification in the database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
    });

    // ✅ Emit real-time notification if user is online
    const recipientSocketId = global._io?.connectedUsers?.get(recipientId);
    if (recipientSocketId) {
      global._io.to(recipientSocketId).emit("receiveNotification", notification);
    } else {
      console.log(`⚠️ User ${recipientId} is offline. Notification saved.`);
      await Notification.findByIdAndUpdate(notification._id, { isOffline: true });
    }

    // ✅ Update unread count in real-time
    await emitUnreadCount(recipientId);
  } catch (error) {
    console.error("❌ Send Notification Error:", error);
  }
};

// 📌 Deliver Offline Notifications When User Comes Online
export const deliverOfflineNotifications = async (userId) => {
  try {
    const offlineNotifications = await Notification.find({
      recipient: userId,
      isOffline: true,
    });

    const recipientSocketId = global._io?.connectedUsers?.get(userId);
    if (recipientSocketId && offlineNotifications.length > 0) {
      offlineNotifications.forEach((notification) => {
        global._io.to(recipientSocketId).emit("receiveNotification", notification);
      });

      await Notification.updateMany(
        { recipient: userId, isOffline: true },
        { isOffline: false }
      );

      console.log(`🔵 Delivered ${offlineNotifications.length} offline notifications to User ${userId}`);
    }
  } catch (error) {
    console.error("❌ Deliver Offline Notifications Error:", error);
  }
};

// 📌 Get All Notifications for a User
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(notifications);
  } catch (error) {
    console.error("❌ Get Notifications Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Mark Single Notification as Read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or access denied." });
    }

    // ✅ Update unread count in real-time
    await emitUnreadCount(req.user._id);

    res.status(200).json({ message: "Notification marked as read.", notification });
  } catch (error) {
    console.error("❌ Mark Notification as Read Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Mark All Notifications as Read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    // ✅ Update unread count in real-time
    await emitUnreadCount(req.user._id);

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("❌ Mark All Notifications as Read Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Delete a Notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or access denied." });
    }

    // ✅ Update unread count in real-time
    await emitUnreadCount(req.user._id);

    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("❌ Delete Notification Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Get Unread Notification Count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("❌ Get Unread Notifications Count Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
