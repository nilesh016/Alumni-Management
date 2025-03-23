import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// 🔹 Education Schema
const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
});

// 🔹 Work Experience Schema
const workExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String },
});

// 🔹 Achievements Schema
const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
});

// 🔹 Friend Requests Schema
const friendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    batch: { type: String, required: true, index: true },
    profession: { type: String, index: true },
    location: { type: String, index: true },
    
    // ✅ User Role & Verification
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },

    // ✅ Password & Authentication
    password: { type: String, required: true, minlength: 6 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ✅ Profile Fields
    avatar: { type: String, default: "https://via.placeholder.com/150" },
    bio: { type: String, default: "" },
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },

    // ✅ Work & Education
    education: [educationSchema],
    workExperience: [workExperienceSchema],
    achievements: [achievementSchema],

    // ✅ Friend Connections & Requests
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [friendRequestSchema],

    // ✅ Soft Delete Option
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Create compound index for efficient searching
userSchema.index({ batch: 1, profession: 1, location: 1 });

// 🔹 Virtual Full Name
userSchema.virtual("fullName").get(function () {
  return this.name;
});

// 🔹 Hash Password Before Saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Compare Entered Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
