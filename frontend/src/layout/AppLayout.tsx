import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-linear-to-b from-[#0b0b20] to-[#1b1b3a] text-white">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
