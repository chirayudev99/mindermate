import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "react-toastify";
import { BsArrowRight } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { authAPI } from "../../api/config";
import { useAuth } from "../../context/AuthContext";

const Auth: React.FC = () => {
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin) {
        // ✅ Signup Flow
        if (form.password !== form.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        const response = await authAPI.signup(
          form.name,
          form.username, // email
          form.password
        );
        setUser(response.user);
        toast.success("Account created successfully!");
      } else {
        // ✅ Login Flow
        const response = await authAPI.login(form.username, form.password);
        setUser(response.user);
        toast.success("Logged in successfully!");
      }

      window.location.href = "/"; // redirect to main dashboard or scheduler
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Google OAuth can be implemented later
    toast.info("Google login will be available soon!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b20] to-[#1b1b3a] flex flex-col items-center justify-center text-white px-6">
      {/* Main Card */}
      <div className="w-full max-w-md bg-black/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-semibold">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-lg text-gray-300 italic">
            Lost time is never found again
          </p>
        </div>

        {!isLogin && (
          <div className="flex items-center justify-center mb-6">
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-24 h-24 rounded-full border-2 border-gray-500 flex items-center justify-center overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt="profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Upload</span>
                )}
              </div>
            </label>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                name="name"
                type="text"
                placeholder="your name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              {isLogin ? "Email / Username" : "Email"}
            </label>
            <input
              name="username"
              type="email"
              placeholder="your@email.com"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              name="password"
              type="password"
              placeholder="•••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="•••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full bg-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 mt-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
          >
            {loading ? "Please wait..." : "Proceed"} <BsArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition"
          >
            <FcGoogle size={22} />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex justify-center gap-6 mt-6">
        <button
          className={`transition ${
            isLogin ? "text-violet-400" : "text-gray-300 hover:text-violet-400"
          }`}
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </button>
        <span className="text-gray-500">|</span>
        <button
          className={`transition ${
            !isLogin ? "text-violet-400" : "text-gray-300 hover:text-violet-400"
          }`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Auth;
