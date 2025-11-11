import express from "express";
import Task from "../models/Task.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// Create task
router.post("/", async (req, res) => {
  try {
    const { type, title, text, date, time, reminderTime } = req.body;

    // Validation
    if (!type || !text || !date) {
      return res
        .status(400)
        .json({ message: "Type, text, and date are required" });
    }

    if (!["prior", "simple"].includes(type)) {
      return res.status(400).json({ message: "Invalid task type" });
    }

    // Create task
    const task = new Task({
      userId: req.user._id,
      type,
      title: title || "",
      text,
      date,
      time: time || "",
      reminderTime: reminderTime || "",
      completed: false,
    });

    await task.save();

    res.status(201).json({
      _id: task._id,
      userId: task.userId,
      type: task.type,
      title: task.title,
      text: task.text,
      date: task.date,
      time: task.time || "",
      reminderTime: task.reminderTime || "",
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get tasks by date
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    const tasks = await Task.find({
      userId: req.user._id,
      date: date,
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update task (toggle completed status)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    // Find task and verify ownership
    const task = await Task.findOne({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task
    task.completed = completed !== undefined ? completed : !task.completed;
    await task.save();

    res.json({
      _id: task._id,
      userId: task.userId,
      type: task.type,
      title: task.title,
      text: task.text,
      date: task.date,
      time: task.time || "",
      reminderTime: task.reminderTime || "",
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete task (optional - not used in frontend yet)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
