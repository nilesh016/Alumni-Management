import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.EMAIL_CLIENT_ID,
  process.env.EMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// Set refresh token
oAuth2Client.setCredentials({ refresh_token: process.env.EMAIL_REFRESH_TOKEN });

// Function to get an access token using OAuth2 client
const getAccessToken = async () => {
  try {
    const { token } = await oAuth2Client.getAccessToken();
    return token;
  } catch (error) {
    console.error("❌ Error getting access token:", error);
    throw new Error("Unable to get access token.");
  }
};

// Create email transporter
const createTransporter = async () => {
  try {
    const accessToken = await getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
        accessToken,
      },
    });

    return transporter;
  } catch (error) {
    console.error("❌ Error creating transporter:", error);
    throw new Error("Unable to create email transporter.");
  }
};

export default createTransporter;
