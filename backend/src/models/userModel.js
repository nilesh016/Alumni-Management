import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }, // New field for email verification
    verificationToken: { type: String }, // Store verification token
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
