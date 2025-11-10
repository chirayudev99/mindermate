import admin from "firebase-admin";
import User from "../models/User.js";
import Task from "../models/Task.js";

// Initialize Firebase Admin
let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
    );

    if (!serviceAccount.project_id) {
      console.warn("Firebase service account not configured");
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
};

// Send notification to a user
export const sendNotification = async (userId, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.error("Firebase Admin not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return { success: false, error: "No FCM tokens found for user" };
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          invalidTokens.push(user.fcmTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: invalidTokens } },
        });
      }
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

// Send task reminder notification
export const sendTaskReminder = async (taskId) => {
  try {
    const task = await Task.findById(taskId).populate("userId");
    if (!task || task.completed) {
      return { success: false, error: "Task not found or already completed" };
    }

    const title = `Task Reminder: ${task.title}`;
    const body = task.text;

    return await sendNotification(task.userId._id, title, body, {
      taskId: task._id.toString(),
      type: "task_reminder",
      date: task.date,
    });
  } catch (error) {
    console.error("Error sending task reminder:", error);
    return { success: false, error: error.message };
  }
};

// Schedule notifications for tasks with reminder times
export const scheduleTaskNotifications = async () => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Find tasks that need notifications (within the next minute)
    const tasks = await Task.find({
      date: currentDate,
      reminderTime: { $exists: true, $ne: "" },
      completed: false,
    }).populate("userId");

    const notificationsToSend = [];

    for (const task of tasks) {
      if (!task.reminderTime) continue;

      const [taskHours, taskMinutes] = task.reminderTime.split(":").map(Number);
      const taskTime = taskHours * 60 + taskMinutes;
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

      // Check if reminder time is within the current minute
      if (taskTime === currentTimeMinutes) {
        notificationsToSend.push(task);
      }
    }

    // Send notifications
    for (const task of notificationsToSend) {
      await sendTaskReminder(task._id);
    }

    return {
      checked: tasks.length,
      sent: notificationsToSend.length,
    };
  } catch (error) {
    console.error("Error scheduling task notifications:", error);
    return { checked: 0, sent: 0, error: error.message };
  }
};
