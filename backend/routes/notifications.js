import express from "express";
import { authenticate } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  sendTaskReminder,
  scheduleTaskNotifications,
  initializeFirebase,
} from "../services/fcmService.js";

const router = express.Router();

// ===== PUBLIC CRON ENDPOINT (No Authentication) =====
// This endpoint will be called by cron-job.org every minute
router.post("/cron/check-notifications", async (req, res) => {
  try {
    // Optional: Add secret key for security
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔔 Cron job triggered:', new Date().toISOString());
    
    // Initialize Firebase if not already done
    initializeFirebase();
    
    // Run the notification scheduler
    const result = await scheduleTaskNotifications();
    
    console.log(`✅ Checked ${result.checked} tasks, sent ${result.sent} notifications`);
    
    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      checked: result.checked,
      sent: result.sent,
      message: `Checked ${result.checked} tasks, sent ${result.sent} notifications`
    });
  } catch (error) {
    console.error('❌ Error in cron job:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Or if you prefer GET (simpler for testing in browser)
router.get("/cron/check-notifications", async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.query.secret !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔔 Cron job triggered (GET):', new Date().toISOString());
    
    initializeFirebase();
    const result = await scheduleTaskNotifications();
    
    console.log(`✅ Checked ${result.checked} tasks, sent ${result.sent} notifications`);
    
    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      checked: result.checked,
      sent: result.sent,
      message: `Checked ${result.checked} tasks, sent ${result.sent} notifications`
    });
  } catch (error) {
    console.error('❌ Error in cron job:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ===== AUTHENTICATED ROUTES BELOW =====
// All other notification routes require authentication
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