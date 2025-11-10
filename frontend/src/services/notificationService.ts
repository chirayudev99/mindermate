// FCM Notification Service
import { getFCMToken, onMessageListener } from "@/config/firebase";
import { tasksAPI } from "@/api/config";

interface Task {
  _id: string;
  title: string;
  text: string;
  date: string;
  reminderTime: string;
  completed?: boolean;
}

class NotificationService {
  private fcmToken: string | null = null;
  private messageListener: any = null;

  // Initialize FCM and register token
  async initialize(): Promise<boolean> {
    try {
      // Get FCM token
      const token = await getFCMToken();
      if (!token) {
        console.warn("Failed to get FCM token");
        return false;
      }

      this.fcmToken = token;

      // Register token with backend
      await this.registerToken(token);

      // Listen for foreground messages
      this.setupMessageListener();

      console.log("FCM initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing FCM:", error);
      return false;
    }
  }

  // Register FCM token with backend
  private async registerToken(token: string): Promise<void> {
    try {
      const { notificationsAPI } = await import("@/api/config");
      await notificationsAPI.registerToken(token);
      console.log("FCM token registered with backend");
    } catch (error) {
      console.error("Error registering FCM token:", error);
    }
  }

  // Setup message listener for foreground notifications
  private setupMessageListener(): void {
    onMessageListener()
      .then((payload: any) => {
        console.log("Foreground message received:", payload);
        // Show notification in foreground
        if (payload.notification) {
          this.showForegroundNotification(payload);
        }
      })
      .catch((error) => {
        console.error("Error in message listener:", error);
      });
  }

  // Show notification when app is in foreground
  private showForegroundNotification(payload: any): void {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      const notification = new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: payload.data?.taskId || "task-reminder",
        requireInteraction: true,
        data: payload.data,
      });

      // Handle notification click
      notification.onclick = async (event) => {
        event.preventDefault();
        if (payload.data?.taskId && payload.data?.action === "complete") {
          try {
            await tasksAPI.update(payload.data.taskId, { completed: true });
            window.location.reload();
          } catch (error) {
            console.error("Error marking task as complete:", error);
          }
        }
        notification.close();
        window.focus();
      };
    }
  }

  // Request notification permission (for FCM)
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  // Schedule notification for a task (backend will handle the actual sending)
  scheduleNotification(task: Task): void {
    if (!task.reminderTime || task.completed) {
      return;
    }

    // The backend cron job will handle sending notifications
    // We just need to ensure the task has reminderTime set
    console.log(`Task ${task._id} will receive notification at ${task.reminderTime}`);
  }

  // Schedule notifications for multiple tasks
  scheduleNotifications(tasks: Task[]): void {
    console.log(`Tasks with reminders: ${tasks.filter(t => t.reminderTime && !t.completed).length}`);
    // Backend cron job handles the actual notification sending
  }

  // Get FCM token
  getToken(): string | null {
    return this.fcmToken;
  }

  // Cleanup
  cleanup(): void {
    if (this.messageListener) {
      // Cleanup if needed
    }
  }
}

export const notificationService = new NotificationService();
