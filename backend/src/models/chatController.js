import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

// ✅ Create or Get 1-on-1 Chat
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "UserId is required" });

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, userId] }, // ✅ More optimized query
    })
      .populate("users", "name email")
      .populate("latestMessage");

    if (!chat) {
      chat = await Chat.create({ users: [req.user._id, userId] });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("❌ Error accessing chat:", error);
    res.status(500).json({ message: "Failed to access chat" });
  }
};

// ✅ Fetch User Chats
export const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "name email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("❌ Error fetching chats:", error);
    res.status(500).json({ message: "Failed to retrieve chats" });
  }
};

// ✅ Create Group Chat with Admin
export const createGroupChat = async (req, res) => {
  try {
    const { users, chatName } = req.body;
    if (!users || users.length < 2) return res.status(400).json({ message: "At least 2 users required" });

    users.push(req.user._id);
    const groupChat = await Chat.create({
      chatName,
      users,
      isGroupChat: true,
      groupAdmin: req.user._id, // ✅ Assign admin role to creator
    });

    res.status(201).json(groupChat);
  } catch (error) {
    console.error("❌ Error creating group chat:", error);
    res.status(500).json({ message: "Failed to create group chat" });
  }
};

// ✅ Send Message with Status & Socket.io Event
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType } = req.body;
    if (!content || !chatId) return res.status(400).json({ message: "Content and chatId are required" });

    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      messageType: messageType || "text",
      status: "sent", // ✅ Track message status
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    // 🔹 Emit event for real-time update
    req.io.to(chatId).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ✅ Fetch Messages of a Chat + Mark as Read
export const fetchMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");

    // 🔹 Mark messages as "read" for the user
    const updatedMessages = await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id }, status: "read" }
    );

    // 🔹 Emit read receipt event
    req.io.to(req.params.chatId).emit("messageRead", { chatId: req.params.chatId, userId: req.user._id });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ✅ Handle Typing Indicator with Socket.io
export const typingIndicator = (socket) => {
  socket.on("typing", ({ chatId, userId }) => {
    socket.broadcast.to(chatId).emit("userTyping", { chatId, userId });
  });

  socket.on("stopTyping", ({ chatId, userId }) => {
    socket.broadcast.to(chatId).emit("userStoppedTyping", { chatId, userId });
  });
};

// ✅ Remove User from Group (Only Admin Can Remove)
export const removeUserFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.groupAdmin.equals(req.user._id)) return res.status(403).json({ message: "Only admin can remove users" });

    chat.users = chat.users.filter((id) => !id.equals(userId));
    await chat.save();

    res.status(200).json({ message: "User removed from group" });
  } catch (error) {
    console.error("❌ Error removing user:", error);
    res.status(500).json({ message: "Failed to remove user from group" });
  }
};

// ✅ Promote User to Group Admin
export const promoteToAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.groupAdmin.equals(req.user._id)) return res.status(403).json({ message: "Only admin can promote users" });

    chat.groupAdmin = userId;
    await chat.save();

    res.status(200).json({ message: "User promoted to admin" });
  } catch (error) {
    console.error("❌ Error promoting user:", error);
    res.status(500).json({ message: "Failed to promote user to admin" });
  }
};
