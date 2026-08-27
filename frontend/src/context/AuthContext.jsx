import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "../services/authService";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await userService.me();
      setUser(data);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    // Raised by api/axios.js when a refresh attempt fails (expired session).
    const handleForcedLogout = () => setUser(null);
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [loadProfile]);

  const login = async (email, password) => {
    const { data } = await authService.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    await loadProfile();
  };

  const register = async (payload) => {
    await authService.register(payload);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Best-effort audit record — still clear local session either way.
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const refreshCurrentUser = () => loadProfile();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
