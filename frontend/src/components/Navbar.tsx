import { useAuth } from "@/context/AuthContext";
import React from "react";
import { FaCheckSquare, FaUser, FaPen, FaPlus } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  return (
    <aside className="w-20 bg-black/40 backdrop-blur-md flex flex-col items-center justify-between py-8 border-r border-white/10 h-screen sticky top-0 left-0">
      <div className="flex flex-col items-center gap-8">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `text-xl transition cursor-pointer ${
              isActive ? "text-violet-500" : "text-gray-400 hover:text-violet-400"
            }`
          }
        >
          <FaCheckSquare />
        </NavLink>

        <NavLink
          to="/ai-schedule"
          className={({ isActive }) =>
            `text-xl transition cursor-pointer ${
              isActive ? "text-violet-500" : "text-gray-400 hover:text-violet-400"
            }`
          }
        >
          <FaPen />
        </NavLink>

        {/* <NavLink
          to="/profile"
          className={({ isActive }) =>
            `text-xl transition ${
              isActive ? "text-violet-500" : "text-gray-400 hover:text-violet-400"
            }`
          }
        >
          <FaUser />
        </NavLink> */}
      </div>

      <button onClick={logout} className="bg-violet-500 hover:bg-violet-600 cursor-pointer p-3 rounded-full shadow-lg transition">
      <FaUser />
      </button>
    </aside>
  );
};

export default Navbar;
