import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    
    // 🔹 Updated: Multiple Admins for Group Chats
    groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 🔹 New: Unread Messages Count for each User
    unreadMessages: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      }
    ],
    
    // 🔹 New: Typing Users List
    typingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

// 🔹 Method to increment unread count
chatSchema.methods.incrementUnread = async function (userId) {
  const userUnread = this.unreadMessages.find((u) => u.user.equals(userId));
  if (userUnread) {
    userUnread.count += 1;
  } else {
    this.unreadMessages.push({ user: userId, count: 1 });
  }
  await this.save();
};

// 🔹 Method to reset unread count when user reads messages
chatSchema.methods.resetUnread = async function (userId) {
  const userUnread = this.unreadMessages.find((u) => u.user.equals(userId));
  if (userUnread) {
    userUnread.count = 0;
    await this.save();
  }
};

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
