import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/Task.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All AI scheduler routes require authentication
router.use(authenticate);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

// Helper function to get current time in IST
const getCurrentISTTime = () => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime;
};

// Helper function to format time in 12-hour format
const formatTime12Hour = (date) => {
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes.toString().padStart(2, '0');
  return `${hours}:${minutesStr} ${ampm}`;
};

// Helper function to format time in 24-hour format for reminderTime
const formatTime24Hour = (date) => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// AI Scheduler - Parse user prompt and create tasks
router.post("/parse", async (req, res) => {
  try {
    const { prompt, date, defaultType } = req.body;

    if (!prompt || !date) {
      return res.status(400).json({ message: "Prompt and date are required" });
    }

    // Get current IST time
    const currentIST = getCurrentISTTime();
    const currentTimeStr = formatTime12Hour(currentIST);
    const currentTime24 = formatTime24Hour(currentIST);

    // Create a detailed prompt for Gemini
    const fullPrompt = `You are a task scheduling assistant. Parse the user's natural language input and extract tasks.

CURRENT TIME (IST): ${currentTimeStr} (24-hour: ${currentTime24})

IMPORTANT: You must return ONLY a valid JSON object with a "tasks" key containing an array of task objects. Do not include any markdown formatting or code blocks.

Each task object must have these fields:
- title (string): Concise task title (2-5 words)
- text (string): Helpful description (one sentence)
- time (string): Time range in format "HH:MM AM/PM - HH:MM AM/PM" or empty string if not specified
- date (string): Date in YYYY-MM-DD format (use: ${date})
- reminderTime (string): Reminder time in 24 hour format "HH:MM" or empty string if not specified
- isRelativeTime (boolean): true if the user mentioned relative time like "in 10 mins", "in 1 hour", false otherwise
- relativeMinutes (number): if isRelativeTime is true, the number of minutes from current time, else 0

Time extraction rules:
- For relative times like "in 10 mins", "in 1 hour", "in 30 minutes":
  * Calculate from CURRENT TIME: ${currentTimeStr}
  * Set isRelativeTime to true
  * Set relativeMinutes to the number of minutes
  * Example: "in 10 mins" at current time ${currentTimeStr} → relativeMinutes: 10
  * Example: "in 1 hour" → relativeMinutes: 60
  * Example: "in 2 hours" → relativeMinutes: 120

- For absolute times:
  * "at 10" or "at 10 AM" → "10:00 AM - 11:00 AM"
  * "at night" or "in the evening" → "08:00 PM - 09:00 PM"
  * "in the morning" → "09:00 AM - 10:00 AM"
  * "in the afternoon" → "02:00 PM - 03:00 PM"
  * "at 9 PM" → "09:00 PM - 10:00 PM"
  * Set isRelativeTime to false
  * Set relativeMinutes to 0

- For reminderTime: 
  * If time is specified, set reminder at the same time as task start time
  * If no time specified, use empty string ""
  * Format: "HH:MM" in 24-hour format

- If no time mentioned at all, use empty string "" for time and reminderTime

Return format must be: { "tasks": [...] }

Parse these tasks: "${prompt}"`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(fullPrompt, {
      temperature: 0.7,
    });

    const response = result.response;
    let responseContent = response.text();

    responseContent = responseContent.trim();
    if (responseContent.startsWith("```json")) {
      responseContent = responseContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (responseContent.startsWith("```")) {
      responseContent = responseContent.replace(/```\n?/g, "");
    }

    let parsedTasks;
    try {
      const parsed = JSON.parse(responseContent);
      parsedTasks = parsed.tasks || [];

      if (!Array.isArray(parsedTasks)) {
        throw new Error("Tasks must be an array");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return res.status(500).json({
        message: "Failed to parse AI response",
        error: "Invalid JSON format",
      });
    }

    if (!Array.isArray(parsedTasks) || parsedTasks.length === 0) {
      return res.status(400).json({
        message: "No tasks could be extracted from the prompt",
      });
    }

    const createdTasks = [];
    const taskType = defaultType || "Prior-Task";

    for (const taskData of parsedTasks) {
      if (!taskData.title || !taskData.text) continue;

      let taskTime = taskData.time || "";
      let reminderTime = taskData.reminderTime || "";

      // Handle relative time
      if (taskData.isRelativeTime && taskData.relativeMinutes > 0) {
        const taskDateTime = new Date(currentIST.getTime() + taskData.relativeMinutes * 60 * 1000);
        const endDateTime = new Date(taskDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        taskTime = `${formatTime12Hour(taskDateTime)} - ${formatTime12Hour(endDateTime)}`;
        
        // Set reminder at the same time as task start time
        reminderTime = formatTime24Hour(taskDateTime);
      } else if (taskTime && !reminderTime) {
        // If absolute time is provided but no reminder, set reminder at task start time
        try {
          const timeMatch = taskTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            reminderTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        } catch (err) {
          console.error("Error calculating reminder time:", err);
        }
      }

      // Ensure reminderTime is a string
      reminderTime = reminderTime && typeof reminderTime === "string" ? reminderTime.trim() : "";

      const task = new Task({
        userId: req.user._id,
        type: taskType,
        title: taskData.title,
        text: taskData.text,
        date: taskData.date || date,
        time: taskTime,
        reminderTime,
        completed: false,
      });

      await task.save();
      createdTasks.push({
        _id: task._id,
        userId: task.userId,
        type: task.type,
        title: task.title,
        text: task.text,
        date: task.date,
        time: task.time,
        reminderTime: task.reminderTime,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
    }

    if (createdTasks.length === 0) {
      return res.status(400).json({
        message: "No valid tasks could be created",
      });
    }

    res.status(201).json({
      message: `Successfully created ${createdTasks.length} task(s)`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("AI Scheduler error:", error);

    if (error.message && error.message.includes("API")) {
      return res.status(500).json({
        message: "Gemini API error",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message || "Unknown error occurred",
    });
  }
});

export default router;