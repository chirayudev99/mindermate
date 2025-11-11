// src/pages/dashboard/index.tsx
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { tasksAPI } from "@/api/config";
import { useAuth } from "@/context/AuthContext";
import { FaCheck, FaPlus, FaBell } from "react-icons/fa";
import AddTaskModal from "./AddTaskModal";
import HorizontalCalendar from "@/components/HorizontalCalendar";
import { notificationService } from "@/services/notificationService";
import TaskProgress from "@/components/TaskProgress";

interface Task {
  _id: string;
  title: string;
  text: string;
  date: string;
  reminderTime?: string;
  time?: string;
  completed?: boolean;
  type?: "prior" | "simple";
}

type TabType = "prior" | "simple";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>("prior");

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tasks = await tasksAPI.getByDate(
        selectedDate.toISOString().split("T")[0]
      );
      setTasks(tasks);
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

  useEffect(() => {
    if (user) {
      const initFCM = async () => {
        await notificationService.requestPermission();
        await notificationService.initialize();
      };
      initFCM();
      return () => {
        notificationService.cleanup();
      };
    }
  }, [user]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await tasksAPI.update(taskId, { completed: !completed });
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

  // Filter tasks based on selected tab
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.type === selectedTab);
  }, [tasks, selectedTab]);

console.log(selectedTab,"selectedTab");


  return (
    <div className="px-4 sm:px-8 py-6 mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-violet-500 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white">
            Hi{" "}
            {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User"},
          </h2>
          <p className="text-gray-100 text-sm sm:text-base">
            Lost time is never found again
          </p>
        </div>
        <TaskProgress
          total={filteredTasks.length}
          completed={filteredTasks.filter((t) => t.completed).length}
        />
      </div>

      {/* Calendar */}
      <div className="flex flex-col items-center mt-8">
        <HorizontalCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-end gap-3 mt-5">
        {(["prior", "simple"] as TabType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTab(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer ${
              selectedTab === type
                ? "bg-violet-600 text-white"
                : "bg-gray-800 text-gray-300"
            }`}
          >
            {type === 'prior' ? "Prior-Task" : "Simple Task"}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-16">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No tasks available
            </h3>
            <p className="text-sm text-gray-400 italic">
              “The key is in not spending time, but in investing it.”
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-start gap-3 transition-all duration-200 ${
                task.completed
                  ? "border-green-400 bg-green-400/10"
                  : "border-white/20 bg-black/30"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
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
                className={`w-7 h-7 sm:w-6 sm:h-6 cursor-pointer border rounded-md flex items-center justify-center transition-all ${
                  task.completed
                    ? "bg-green-500 border-green-500"
                    : "border-white hover:border-violet-400"
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
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-violet-600 hover:bg-violet-700 transition rounded-full p-4 text-white shadow-lg"
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
