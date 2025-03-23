import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexing for faster lookups
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      required: true,
      enum: ["friend_request", "message", "event", "update"], // Restrict types
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true }, // Index for quick unread checks
    deleted: { type: Boolean, default: false }, // Soft delete option
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent", // Default status is "sent"
    },
  },
  { timestamps: true }
);

// ✅ Emit real-time event when a notification is created
notificationSchema.post("save", function (doc) {
  const io = global._io; // Get the Socket.io instance
  if (io) {
    io.to(doc.recipient.toString()).emit("receiveNotification", doc);
    console.log(`📩 Real-time Notification Sent to User ${doc.recipient}`);
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
