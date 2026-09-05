import { createContext, useContext, useState, useCallback } from "react";
import { api, setToken, clearToken, isAuthed } from "./api";

const AuthContext = createContext(null);

function decodeRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("edrp_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [authed, setAuthed] = useState(isAuthed());

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.access_token);

    const role = decodeRoleFromToken(data.access_token);
    const me = await api.getMe();
    const fullUser = { ...me, role };

    localStorage.setItem("edrp_user", JSON.stringify(fullUser));
    setUser(fullUser);
    setAuthed(true);
  }, []);

  // payload: { full_name, email, password, role_name } — role_name is one of
  // employee | reviewer | manager | administrator
  const register = useCallback(async (payload) => {
    await api.register(payload);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.getMe();
    const role = user?.role || null;
    const fullUser = { ...me, role };
    localStorage.setItem("edrp_user", JSON.stringify(fullUser));
    setUser(fullUser);
    return fullUser;
  }, [user]);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("edrp_user");
    setUser(null);
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authed, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
