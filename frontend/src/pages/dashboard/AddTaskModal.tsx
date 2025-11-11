// src/components/AddTaskModal.tsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/Modal";
import { tasksAPI } from "@/api/config";
import { useAuth } from "@/context/AuthContext";
import CustomTimePicker from "@/components/TimePicker";
import { formatTimeRange } from "@/utils/helper";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onTaskAdded: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onTaskAdded,
}) => {
  const { user } = useAuth();
  const [taskType, setTaskType] = useState("prior");
  const [title, setTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!user || !taskText) {
      toast.warning("Please enter a task description");
      return;
    }
    setLoading(true);

    try {
      await tasksAPI.create({
        type: taskType,
        title,
        text: taskText,
        date: selectedDate.toISOString().split("T")[0],
        reminderTime: reminderTime || undefined,
        time: formatTimeRange(reminderTime) || "",
      });

      toast.success("Task added successfully!");

      setTaskText("");
      setTitle("");
      setReminderTime("");
      onTaskAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add task. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold text-center mb-6">Quick Add Task</h2>

      <div className="flex justify-center gap-3 mb-5">
        {["prior", "simple"].map((type) => (
          <button
            key={type}
            onClick={() => setTaskType(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              taskType === type
                ? "bg-violet-600 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {type === 'prior' ? "Prior-Task" : "Simple Task"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Why is this task important?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-sm rounded-xl px-4 py-2 focus:outline-none"
        />
        <textarea
          placeholder="Write your task"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-sm rounded-xl px-4 py-3 h-24 resize-none focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300 whitespace-nowrap">
            Reminder Time:
          </label>
          {/* <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          /> */}
          <CustomTimePicker
  value={reminderTime}
  onChange={setReminderTime}
/>

        </div>
        <button
          onClick={handleAddTask}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 transition text-white rounded-xl py-3 font-medium mt-3"
        >
          {loading ? "Adding..." : "+ Add Task"}
        </button>
      </div>
    </Modal>
  );
};

export default AddTaskModal;
