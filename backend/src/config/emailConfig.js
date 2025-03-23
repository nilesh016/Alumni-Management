import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

// ✅ Validate required environment variables
const {
  EMAIL_CLIENT_ID,
  EMAIL_CLIENT_SECRET,
  EMAIL_REFRESH_TOKEN,
  EMAIL_USER,
} = process.env;

if (!EMAIL_CLIENT_ID || !EMAIL_CLIENT_SECRET || !EMAIL_REFRESH_TOKEN || !EMAIL_USER) {
  console.error("❌ Missing required email environment variables.");
  process.exit(1);
}

// ✅ Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  EMAIL_CLIENT_ID,
  EMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// ✅ Set refresh token
oAuth2Client.setCredentials({ refresh_token: EMAIL_REFRESH_TOKEN });

let transporter = null; // Cached transporter

// 📌 Function to get an access token with retry logic
const getAccessToken = async (retries = 3) => {
  try {
    const { token } = await oAuth2Client.getAccessToken();
    if (!token) throw new Error("Failed to retrieve access token.");
    return token;
  } catch (error) {
    console.error(`❌ Error getting access token (${retries} attempts left):`, error.message);

    if (retries > 0) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(getAccessToken(retries - 1)), 2000)
      );
    } else {
      throw new Error("Unable to get access token after multiple attempts.");
    }
  }
};

// 📌 Function to create and return a cached transporter
const createTransporter = async () => {
  try {
    if (!transporter) {
      const accessToken = await getAccessToken();

      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: EMAIL_USER,
          clientId: EMAIL_CLIENT_ID,
          clientSecret: EMAIL_CLIENT_SECRET,
          refreshToken: EMAIL_REFRESH_TOKEN,
          accessToken,
        },
      });

      console.log("✅ Email transporter successfully created.");
    }

    return transporter;
  } catch (error) {
    console.error("❌ Error creating transporter:", error.message);
    throw new Error("Unable to create email transporter.");
  }
};

export default createTransporter;
