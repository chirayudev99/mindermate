import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import aiSchedulerRoutes from "./routes/ai-scheduler.js";
import notificationRoutes from "./routes/notifications.js";
import { initializeFirebase } from "./services/fcmService.js";
import cron from "node-cron";
import { scheduleTaskNotifications } from "./services/fcmService.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
initializeFirebase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai-scheduler", aiSchedulerRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mindermate")
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Schedule cron job to check for notifications every minute
      cron.schedule("* * * * *", async () => {
        try {
          const result = await scheduleTaskNotifications();
          if (result.sent > 0) {
            console.log(`Sent ${result.sent} notification(s)`);
          }
        } catch (error) {
          console.error("Error in notification cron job:", error);
        }
      });
      console.log("Notification scheduler started (runs every minute)");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
