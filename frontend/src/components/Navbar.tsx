import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FaCheckSquare, FaPen, FaUser, FaBars, FaTimes } from "react-icons/fa";

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", icon: <FaCheckSquare />, text:"Dashboard" },
    { to: "/ai-schedule", icon: <FaPen />,text:"AiSchedule"  },
    // { to: "/profile", icon: <FaUser /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 bg-black/40 backdrop-blur-md flex-col items-center justify-between py-8 border-r border-white/10 h-screen sticky top-0 left-0">
        <div className="flex flex-col items-center gap-8">
          {navLinks.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              className={({ isActive }) =>
                `text-xl transition cursor-pointer ${
                  isActive
                    ? "text-violet-500"
                    : "text-gray-400 hover:text-violet-400"
                }`
              }
            >
              {link.icon}
            </NavLink>
          ))}
           <button
          onClick={logout}
          className={`text-xl transition cursor-pointer text-gray-400 hover:text-violet-400`}
        >
          <FaUser />
        </button>
        </div>

       
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/50 backdrop-blur-md flex justify-between items-center px-4 py-3 z-50 border-b border-white/10">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white text-2xl">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h1 className="text-lg font-semibold text-white">Mindermate</h1>
        <button
          onClick={logout}
          className="bg-violet-600 hover:bg-violet-700 p-2 rounded-full transition"
        >
          <FaUser size={16} />
        </button>
      </div>

      {/* Mobile Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-48 bg-black/90 backdrop-blur-md flex flex-col justify-between py-10 px-6 border-r border-white/10 z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-start gap-6 mt-8">
          {navLinks.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `text-lg flex items-center gap-3 transition ${
                  isActive
                    ? "text-violet-400"
                    : "text-gray-300 hover:text-violet-300"
                }`
              }
            >
              {link.icon}
              <p className="text-sm" >{link.text}</p>
            </NavLink>
        
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
