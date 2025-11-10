// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem("token");
};

// API request helper
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
    }));
    throw new Error(error.message || "Request failed");
  }

  return response;
};

// Auth API
export const authAPI = {
  signup: async (name: string, email: string, password: string) => {
    const response = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    const response = await apiRequest("/auth/me");
    return await response.json();
  },

  logout: async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeToken();
    }
  },
};

// Tasks API
export const tasksAPI = {
  create: async (taskData: {
    type: string;
    title: string;
    text: string;
    date: string;
    time?: string;
    reminderTime?: string;
  }) => {
    const response = await apiRequest("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    return await response.json();
  },

  getByDate: async (date: string) => {
    const response = await apiRequest(`/tasks?date=${date}`);
    return await response.json();
  },

  update: async (taskId: string, updates: { completed?: boolean }) => {
    const response = await apiRequest(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return await response.json();
  },

  delete: async (taskId: string) => {
    const response = await apiRequest(`/tasks/${taskId}`, {
      method: "DELETE",
    });
    return await response.json();
  },
};

// AI Scheduler API
export const aiSchedulerAPI = {
  parseAndCreate: async (prompt: string, date: string, defaultType: string = "Prior-Task") => {
    const response = await apiRequest("/ai-scheduler/parse", {
      method: "POST",
      body: JSON.stringify({ prompt, date, defaultType }),
    });
    return await response.json();
  },
};

// Notifications API
export const notificationsAPI = {
  registerToken: async (fcmToken: string) => {
    const response = await apiRequest("/notifications/register-token", {
      method: "POST",
      body: JSON.stringify({ fcmToken }),
    });
    return await response.json();
  },

  unregisterToken: async (fcmToken: string) => {
    const response = await apiRequest("/notifications/unregister-token", {
      method: "POST",
      body: JSON.stringify({ fcmToken }),
    });
    return await response.json();
  },

  sendTest: async () => {
    const response = await apiRequest("/notifications/test", {
      method: "POST",
    });
    return await response.json();
  },
};

