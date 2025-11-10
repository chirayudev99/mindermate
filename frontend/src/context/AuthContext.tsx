// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authAPI } from "../api/config";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await authAPI.getCurrentUser();
        setUser(res);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to logout. Please try again.");
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
