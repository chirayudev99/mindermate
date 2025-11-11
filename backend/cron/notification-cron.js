import mongoose from "mongoose";
import { scheduleTaskNotifications } from "../services/fcmService.js";

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
  let db = null;

  try {
    if (!MONGODB_URI) {
      throw new Error("Missing MONGODB_URI environment variable");
    }

    // Always connect fresh — serverless functions are stateless
    db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected (cron)");

    const result = await scheduleTaskNotifications();

    console.log(`🔔 Checked: ${result.checked}, Sent: ${result.sent}`);

    return res.status(200).json({
      success: true,
      message: `Notifications sent: ${result.sent}`,
      details: result,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return res.status(500).json({
      success: false,
      message: "Cron job failed",
      error: error.message,
    });
  } finally {
    // Close connection so Vercel function can exit cleanly
    if (db) {
      await mongoose.connection.close();
      console.log("🔒 MongoDB connection closed (cron)");
    }
  }
}
