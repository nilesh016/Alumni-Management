import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

// 📌 Retry Configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retries > 0) {
      console.log(`🔄 Retrying connection in ${RETRY_DELAY / 1000} seconds... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), RETRY_DELAY);
    } else {
      console.error("❌ Max retries reached. Exiting...");
      process.exit(1);
    }
  }
};

// 📌 Handle MongoDB Errors
mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB Connection Error: ${err.message}`);
});

// 📌 Handle Disconnection & Auto-Reconnect
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB Disconnected! Attempting to reconnect...");
  connectDB();
});

export default connectDB;
