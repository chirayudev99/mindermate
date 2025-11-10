// src/pages/AiScheduler.tsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaPaperPlane } from "react-icons/fa";
import HorizontalCalendar from "../../components/HorizontalCalendar";
import { aiSchedulerAPI } from "../../api/config";
import { tasksAPI } from "../../api/config";
import { useAuth } from "../../context/AuthContext";

interface Task {
  _id: string;
  time: string;
  title: string;
  text: string;
  type: string;
  date: string;
  completed?: boolean;
}

const AiScheduler: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Prior-Task");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Fetch tasks for selected date
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, selectedDate]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const tasksData = await tasksAPI.getByDate(
        selectedDate.toISOString().split("T")[0]
      );
      setTasks(tasksData);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.warning("Please enter a message");
      return;
    }

    if (!user) {
      toast.error("Please login to use AI scheduler");
      return;
    }

    setAiProcessing(true);
    const userMessage = message;
    setMessage("");

    try {
      toast.info("AI is processing your request...");

      const dateString = selectedDate.toISOString().split("T")[0];
      const response = await aiSchedulerAPI.parseAndCreate(
        userMessage,
        dateString,
        selectedCategory
      );

      toast.success(`Successfully created ${response.tasks.length} task(s)!`);

      // Refresh tasks list
      await fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to create tasks. Please try again.");
      console.error("AI Scheduler error:", error);
    } finally {
      setAiProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#1a142b] to-[#0f0c1a] text-white px-6 py-8">
      {/* Title */}
      <h1 className="text-3xl font-semibold text-center mb-8 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
        AI Day Scheduler
      </h1>

      {/* Calendar */}
      <div className="w-full max-w-5xl mb-6">
        <HorizontalCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Task List */}
      <div className="w-full max-w-3xl flex flex-col gap-4 mb-28">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-16">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No tasks scheduled
            </h3>
            <p className="text-sm text-gray-400 italic">
              Describe your tasks below and AI will schedule them for you!
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#1e1a2e] border border-[#2c2347] rounded-xl p-5 hover:border-purple-500 transition"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-purple-400 font-semibold">
                  {task.time || "No specific time"}
                </p>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    task.type === "Prior-Task"
                      ? "bg-purple-500/30 text-purple-300"
                      : "bg-blue-500/30 text-blue-300"
                  }`}
                >
                  {task.type}
                </span>
              </div>
              <h2 className="text-lg font-medium mb-1">{task.title}</h2>
              <p className="text-gray-300 text-sm">{task.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Chat Input Section */}
      <div className="fixed bottom-0 left-0 w-full bg-[#13101f]/90 backdrop-blur-md border-t border-[#2c2347] py-4 flex justify-center">
        <div className="flex items-center gap-4 w-full max-w-3xl px-4">
          <input
            type="text"
            placeholder="Write what are the things you wanted to do"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-[#1e1a2e] text-white rounded-xl px-4 py-3 focus:outline-none placeholder-gray-400"
          />
          <div className="flex gap-2">
            {["Prior-Task", "Simple Task"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? "bg-purple-600 text-white"
                    : "bg-[#2c2347] text-gray-300 hover:bg-[#3a2f5a]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={handleSend}
            disabled={aiProcessing || !message.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-full transition"
          >
            {aiProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaPaperPlane size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiScheduler;
