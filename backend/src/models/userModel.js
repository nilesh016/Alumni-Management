import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"], // Email format validation
    },
    password: { type: String, required: true, minlength: 6 },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }, // Email verification status
    verificationToken: { type: String }, // Email verification token

    // ✅ Reset Password Fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ✅ Profile Fields
    avatar: { type: String, default: "" }, // Profile Picture URL, could be a default avatar image
    bio: { type: String, default: "" },
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is unchanged
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
