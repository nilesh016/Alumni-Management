import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import mongoose from "mongoose";

// 📌 Utility: Send Notification with DB Storage
const sendNotification = async (recipientId, senderId, type, message, io) => {
  try {
    const notification = await Notification.create({ recipient: recipientId, sender: senderId, type, message });

    const recipientSocketId = io.connectedUsers?.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveNotification", notification);
      console.log(`📩 Real-time notification sent to ${recipientId}: ${message}`);
    } else {
      console.log(`⚠️ User ${recipientId} is offline, notification saved.`);
    }
  } catch (error) {
    console.error("❌ Send Notification Error:", error);
  }
};

// 📌 Send Friend Request (Prevent Duplicate Requests)
export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot send a request to yourself." });
    }

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId),
      User.findById(senderId),
    ]);

    if (!receiver || !sender) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if request already exists
    if (receiver.friendRequests.includes(senderId) || sender.friendRequests.includes(receiverId)) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    receiver.friendRequests.push(senderId);
    await receiver.save();

    // 🔹 Send Notification
    await sendNotification(receiverId, senderId, "friend_request", `${sender.name} sent you a friend request.`, req.io);

    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error("❌ Send Friend Request Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Accept Friend Request (Atomic Transaction)
export const acceptFriendRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { senderId } = req.body;
    const receiverId = req.user._id;

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId).session(session),
      User.findById(senderId).session(session),
    ]);

    if (!receiver || !sender) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found." });
    }

    if (!receiver.friendRequests.includes(senderId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No friend request found." });
    }

    receiver.connections.push(senderId);
    sender.connections.push(receiverId);

    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);

    await Promise.all([receiver.save({ session }), sender.save({ session })]);

    await session.commitTransaction();
    session.endSession();

    // 🔹 Send Notification
    await sendNotification(senderId, receiverId, "friend_request_accepted", `${receiver.name} accepted your friend request.`, req.io);

    res.status(200).json({ message: "Friend request accepted successfully." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Accept Friend Request Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Reject Friend Request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { senderId } = req.body;
    const receiverId = req.user._id;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
    await receiver.save();

    // 🔹 Send Notification
    await sendNotification(senderId, receiverId, "friend_request_rejected", `${receiver.name} rejected your friend request.`, req.io);

    res.status(200).json({ message: "Friend request rejected successfully." });
  } catch (error) {
    console.error("❌ Reject Friend Request Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Remove Connection (Unfriend)
export const removeConnection = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found." });
    }

    user.connections = user.connections.filter(id => id.toString() !== friendId);
    friend.connections = friend.connections.filter(id => id.toString() !== userId);

    await Promise.all([user.save(), friend.save()]);

    // 🔹 Send Notification
    await sendNotification(friendId, userId, "friend_removed", `${user.name} removed you from friends.`, req.io);

    res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error("❌ Remove Connection Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
