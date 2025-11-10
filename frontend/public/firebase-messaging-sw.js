// Service Worker for Firebase Cloud Messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

// Initialize Firebase in the service worker
const firebaseConfig = {
    apiKey: "AIzaSyD9Cpzb-BL90pKuWNjDbUK_BsstkBlXuw4",
    authDomain: "mindermate.firebaseapp.com",
    projectId: "mindermate",
    storageBucket: "mindermate.firebasestorage.app",
    messagingSenderId: "814324552593",
    appId: "1:814324552593:web:71c1461f92f4a208b48030",
    measurementId: "G-DBRGQR5TCF"
  };

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Task Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.taskId || "task-reminder",
    requireInteraction: true,
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const taskId = event.notification.data?.taskId;
  const urlToOpen = "/";

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
