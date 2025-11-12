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

// Helper function to get current time in IST (UTC+5:30)
// Returns an object with IST date, hours, and minutes
const getCurrentISTTime = () => {
  const now = new Date();
  // IST is UTC+5:30, so add 5 hours and 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Get IST date in YYYY-MM-DD format
  const istDate = istTime.toISOString().split("T")[0];

  // Get IST hours and minutes (UTC methods work because we've already adjusted the time)
  const istHours = istTime.getUTCHours();
  const istMinutes = istTime.getUTCMinutes();

  return {
    date: istDate,
    hours: istHours,
    minutes: istMinutes,
    fullDate: istTime,
  };
};

// Schedule notifications for tasks with reminder times
export const scheduleTaskNotifications = async () => {
  try {
    // Use IST time to match the timezone used when creating tasks
    const istTime = getCurrentISTTime();
    const nowUTC = new Date();

    // Get date and time in IST
    const currentDate = istTime.date;
    const currentTime = `${istTime.hours.toString().padStart(2, "0")}:${istTime.minutes.toString().padStart(2, "0")}`;

    console.log(
      `🔍 Checking notifications at ${currentTime} IST on ${currentDate} (UTC: ${nowUTC.toISOString()})`
    );

    // Find tasks that need notifications (within the next minute)
    const tasks = await Task.find({
      date: currentDate,
      reminderTime: { $exists: true, $ne: "" },
      completed: false,
    }).populate("userId");

    console.log(`📋 Found ${tasks.length} tasks with reminder times for today`);

    const notificationsToSend = [];
    const skippedTasks = [];

    for (const task of tasks) {
      if (!task.reminderTime) {
        skippedTasks.push({ taskId: task._id, reason: "No reminder time" });
        continue;
      }

      const [taskHours, taskMinutes] = task.reminderTime.split(":").map(Number);

      // Validate time format
      if (isNaN(taskHours) || isNaN(taskMinutes)) {
        skippedTasks.push({
          taskId: task._id,
          reason: `Invalid time format: ${task.reminderTime}`,
        });
        continue;
      }

      const taskTime = taskHours * 60 + taskMinutes;
      const currentTimeMinutes = istTime.hours * 60 + istTime.minutes;

      console.log(
        `  Task "${task.title}": reminderTime=${task.reminderTime}, taskTime=${taskTime}, currentTime=${currentTimeMinutes}`
      );

      // Check if reminder time matches the current minute (with a small buffer for timing)
      // Allow notifications if reminder time is within the current minute window
      if (taskTime === currentTimeMinutes) {
        notificationsToSend.push(task);
        console.log(`  ✅ Task "${task.title}" matches current time`);
      } else {
        skippedTasks.push({
          taskId: task._id,
          title: task.title,
          reason: `Time mismatch: reminder=${task.reminderTime} (${taskTime}), current=${currentTime} (${currentTimeMinutes})`,
        });
      }
    }

    console.log(
      `📤 Preparing to send ${notificationsToSend.length} notification(s)`
    );

    // Send notifications
    let sentCount = 0;
    let failedCount = 0;
    const sendResults = [];

    for (const task of notificationsToSend) {
      try {
        // Check if user has FCM tokens before attempting to send
        if (
          !task.userId ||
          !task.userId.fcmTokens ||
          task.userId.fcmTokens.length === 0
        ) {
          console.log(
            `  ⚠️  Skipping task "${task.title}": User has no FCM tokens`
          );
          sendResults.push({
            taskId: task._id,
            title: task.title,
            success: false,
            error: "No FCM tokens found for user",
          });
          failedCount++;
          continue;
        }

        console.log(
          `  📲 Sending notification for task "${task.title}" to user ${task.userId._id} (${task.userId.fcmTokens.length} token(s))`
        );
        const result = await sendTaskReminder(task._id);

        if (result.success) {
          sentCount++;
          console.log(
            `  ✅ Successfully sent notification for task "${task.title}"`
          );
          sendResults.push({
            taskId: task._id,
            title: task.title,
            success: true,
            successCount: result.successCount,
          });
        } else {
          failedCount++;
          console.log(
            `  ❌ Failed to send notification for task "${task.title}": ${result.error}`
          );
          sendResults.push({
            taskId: task._id,
            title: task.title,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        failedCount++;
        console.error(
          `  ❌ Error sending notification for task "${task.title}":`,
          error
        );
        sendResults.push({
          taskId: task._id,
          title: task.title,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      `✅ Notification check complete: ${sentCount} sent, ${failedCount} failed, ${skippedTasks.length} skipped`
    );

    return {
      checked: tasks.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedTasks.length,
      details: {
        sendResults,
        skippedTasks: skippedTasks.slice(0, 10), // Limit to first 10 for response size
      },
    };
  } catch (error) {
    console.error("Error scheduling task notifications:", error);
    return { checked: 0, sent: 0, failed: 0, error: error.message };
  }
};
