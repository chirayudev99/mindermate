import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/dashboard";
import AiScheduler from "./pages/aischeduler";
import Auth from "./pages/auth";
import AppLayout from "./layout/AppLayout";
import { useAuth } from "./context/AuthContext";

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-linear-to-b from-[#0b0b20] to-[#1b1b3a] text-white animate-fadeIn">
      <img src="/logo.png" alt="Mindermate Logo" className="w-24 h-24 mb-4 animate-bounce" />
      <h1 className="text-3xl font-semibold tracking-wide">Mindermate</h1>
    </div>
  );
};

const App: React.FC = () => {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem("splashShown");
    if (!hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem("splashShown", "true");
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user && (
          <>
            <Route path="*" element={<Auth />} />
          </>
        )}

        {user && (
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-schedule" element={<AiScheduler />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
};

export default App;
