import User from "../models/userModel.js";
import createTransporter from "../config/emailConfig.js"; // Email Notifications

// 📌 Search Alumni
export const searchAlumni = async (req, res) => {
  try {
    const { query, batch, department, location, mutualFriendId, page = 1, limit = 10 } = req.query;
    
    // Ensure pagination values are numbers
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    
    let filter = {};

    if (query) filter.name = { $regex: query, $options: "i" };
    if (batch) filter.batch = batch;
    if (department) filter.department = department;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (mutualFriendId) filter.connections = { $in: [mutualFriendId] };

    const alumni = await User.find(filter)
      .select("-password")
      .populate("connections", "name avatar")
      .limit(pageSize)
      .skip((pageNumber - 1) * pageSize)
      .lean(); // ✅ Faster read operation

    res.status(200).json(alumni);
  } catch (error) {
    console.error("❌ Search Alumni Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Send Friend Request
export const sendFriendRequest = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const senderId = req.user._id.toString();

    if (userId === senderId) {
      return res.status(400).json({ message: "You cannot send a request to yourself!" });
    }

    const recipient = await User.findById(userId);
    if (!recipient) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate requests
    if (recipient.friendRequests.includes(senderId) || recipient.pendingRequests?.includes(senderId)) {
      return res.status(400).json({ message: "Friend request already sent!" });
    }
    if (recipient.connections.includes(senderId)) {
      return res.status(400).json({ message: "You are already connected!" });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { friendRequests: senderId } });

    // 🔹 Send Email Notification (Optional)
    try {
      const transporter = await createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: "New Friend Request",
        text: `You have a new friend request from ${req.user.name}!`,
      });
    } catch (err) {
      console.error("❌ Email Error:", err.message);
      return res.status(500).json({ message: "Friend request sent, but email notification failed." });
    }

    res.status(200).json({ message: "Friend request sent!" });
  } catch (error) {
    console.error("❌ Send Friend Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Cancel Friend Request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const senderId = req.user._id.toString();

    const recipient = await User.findById(userId);
    if (!recipient) return res.status(404).json({ message: "User not found" });

    if (!recipient.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "No pending request found!" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { friendRequests: senderId } });

    res.status(200).json({ message: "Friend request canceled!" });
  } catch (error) {
    console.error("❌ Cancel Friend Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const recipientId = req.user._id.toString();

    const sender = await User.findById(userId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) return res.status(404).json({ message: "User not found" });

    if (!recipient.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "No pending friend request!" });
    }

    await Promise.all([
      User.findByIdAndUpdate(recipientId, {
        $pull: { friendRequests: userId },
        $addToSet: { connections: userId },
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { connections: recipientId },
      }),
    ]);

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (error) {
    console.error("❌ Accept Friend Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const recipientId = req.user._id.toString();

    await User.findByIdAndUpdate(recipientId, {
      $pull: { friendRequests: userId },
    });

    res.status(200).json({ message: "Friend request rejected!" });
  } catch (error) {
    console.error("❌ Reject Friend Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Remove Connection (Unfriend)
export const removeConnection = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const currentUserId = req.user._id.toString();

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, { 
        $pull: { connections: userId, friendRequests: userId, pendingRequests: userId } 
      }),
      User.findByIdAndUpdate(userId, { 
        $pull: { connections: currentUserId, friendRequests: currentUserId, pendingRequests: currentUserId } 
      }),
    ]);

    res.status(200).json({ message: "Connection removed successfully!" });
  } catch (error) {
    console.error("❌ Remove Connection Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
