import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true }, // ✅ Indexed for faster lookups
    content: { type: String, required: true },
    messageType: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
    
    // ✅ Read Receipts (Users who have read the message)
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    
    // ✅ Message Status
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" }, 

    // ✅ Reactions (Users can react to messages)
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }, // Example: "👍", "❤️", "😂"
      }
    ]
  },
  { timestamps: true }
);

// ✅ Indexing for performance
messageSchema.index({ chat: 1, createdAt: -1 });

// ✅ Auto-update message status
messageSchema.methods.markAsDelivered = async function () {
  if (this.status === "sent") {
    this.status = "delivered";
    await this.save();
  }
};

messageSchema.methods.markAsRead = async function (userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    this.status = "read";
    await this.save();
  }
};

const Message = mongoose.model("Message", messageSchema);
export default Message;
