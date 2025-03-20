import mongoose from "mongoose";
import dotenv from "dotenv";

// ✅ Load .env variables
dotenv.config();

// ✅ Check if .env is loaded correctly
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
