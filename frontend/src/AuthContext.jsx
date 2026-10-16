import { createContext, useContext, useState, useCallback } from "react";
import { api, setToken, clearToken, isAuthed } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("edrp_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [authed, setAuthed] = useState(isAuthed());

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.access_token);

    // Always take the role from /me (fresh from the DB), never from the
    // JWT — a JWT's "role" claim is only correct as of the moment it was
    // issued and goes stale the instant an admin changes someone's role.
    const me = await api.getMe();
    localStorage.setItem("edrp_user", JSON.stringify(me));
    setUser(me);
    setAuthed(true);
  }, []);

  // payload: { full_name, email, password, role_name } — role_name is one of
  // employee | reviewer | manager | administrator
  const register = useCallback(async (payload) => {
    await api.register(payload);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.getMe();
    localStorage.setItem("edrp_user", JSON.stringify(me));
    setUser(me);
    return me;
  }, []);

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
