import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  sendTaskReminder,
  scheduleTaskNotifications,
} from "../services/fcmService.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Register FCM token
router.post("/register-token", async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add token if not already present
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.json({ message: "FCM token registered successfully" });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Unregister FCM token
router.post("/unregister-token", async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: fcmToken },
    });

    res.json({ message: "FCM token unregistered successfully" });
  } catch (error) {
    console.error("Error unregistering FCM token:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send test notification
router.post("/test", async (req, res) => {
  try {
    const { sendNotification } = await import("../services/fcmService.js");
    const result = await sendNotification(
      req.user._id,
      "Test Notification",
      "This is a test notification from Mindermate",
      { type: "test" }
    );

    res.json(result);
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Schedule notification for a specific task (for immediate testing)
router.post("/schedule/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await sendTaskReminder(taskId);

    res.json(result);
  } catch (error) {
    console.error("Error scheduling notification:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
