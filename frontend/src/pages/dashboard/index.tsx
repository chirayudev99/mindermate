// src/pages/dashboard/index.tsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { tasksAPI } from "@/api/config";
import { useAuth } from "@/context/AuthContext";
import { FaCheck, FaPlus, FaBell } from "react-icons/fa";
import AddTaskModal from "./AddTaskModal";
import HorizontalCalendar from "@/components/HorizontalCalendar";
import { notificationService } from "@/services/notificationService";

interface Task {
  _id: string;
  title: string;
  text: string;
  date: string;
  reminderTime?: string;
  time?: string;
  completed?: boolean;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tasks = await tasksAPI.getByDate(
        selectedDate.toISOString().split("T")[0]
      );
      setTasks(tasks);
      // Schedule notifications after fetching tasks
      notificationService.scheduleNotifications(tasks);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch tasks. Please try again.");
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, selectedDate]);

  // Setup FCM notifications
  useEffect(() => {
    if (user) {
      // Initialize FCM and register token
      const initFCM = async () => {
        // Request notification permission first
        await notificationService.requestPermission();
        // Initialize FCM
        await notificationService.initialize();
      };

      initFCM();

      // Cleanup on unmount
      return () => {
        notificationService.cleanup();
      };
    }
  }, [user]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await tasksAPI.update(taskId, {
        completed: !completed,
      });
      // Update local state instantly (optimistic UI)
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, completed: !completed } : t
        )
      );
      toast.success(
        completed ? "Task marked as incomplete" : "Task completed!"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update task. Please try again.");
      console.error("Error toggling task:", error);
    }
  };

  return (
    <div className="m-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 rounded-3xl p-6 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-xl font-semibold">
            Hi{" "}
            {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User"},
          </h2>
          <p className="text-gray-100 text-lg">
            Lost time is never found again
          </p>
        </div>
        <div className="bg-white/20 rounded-full w-20 h-20 flex flex-col items-center justify-center border border-white/30 text-white">
          <p className="text-lg font-medium">{tasks.length}</p>
          <span className="text-xs tracking-wide">TODAY</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex flex-col items-center mt-10">
        <HorizontalCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Tasks */}
      <div className="mt-10 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-16">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No tasks available
            </h3>
            <p className="text-sm text-gray-400 italic">
              “The key is in not spending time, but in investing it.”
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`p-5 rounded-xl border flex justify-between items-start transition-all duration-200 ${
                task.completed
                  ? "border-green-400 bg-green-400/10"
                  : "border-white/20 bg-black/30"
              }`}
            >
              <div className="flex-1">
                   {/* <p className="text-purple-400 font-semibold">
                  {task.time || "No specific time"}
                </p> */}
                <div className="flex items-center gap-2">
             
                  <p
                    className={`text-violet-400 font-semibold text-base ${
                      task.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.reminderTime && !task.completed && (
                    <FaBell
                      className="text-yellow-400 text-xs"
                      title={`Reminder at ${task.reminderTime}`}
                    />
                  )}
                </div>
                <p
                  className={`text-sm text-gray-300 mt-1 ${
                    task.completed ? "line-through text-gray-500" : ""
                  }`}
                >
                  {task.text}
                </p>
                {task.reminderTime && (
                  <p className="text-xs text-gray-400 mt-1">
                    Time: {task.time}
                  </p>
                )}
              </div>

              <button
                onClick={() => toggleTask(task._id, task.completed || false)}
                className={`w-6 h-6 border rounded-sm flex items-center justify-center transition-all ${
                  task.completed
                    ? "bg-green-500 border-green-500"
                    : "border-white"
                }`}
              >
                {task.completed && <FaCheck size={12} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Task Floating Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-violet-600 hover:bg-violet-700 transition rounded-full p-4 text-white shadow-lg"
      >
        <FaPlus size={18} />
      </button>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDate={selectedDate}
        onTaskAdded={fetchTasks}
      />
    </div>
  );
};

export default Dashboard;
