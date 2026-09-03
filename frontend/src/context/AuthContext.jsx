import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../services/auth";

const AuthContext = createContext(null);

const STORAGE_KEY = "edrp_tokens"; // { access_token, refresh_token }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On first load, if we have a stored access token, check it's still valid
  // and fetch the user it belongs to.
  useEffect(() => {
    async function restoreSession() {
      if (!tokens?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser(tokens.access_token);
        setUser(currentUser);
      } catch {
        // Token expired or invalid — clear it rather than leaving a broken session around
        localStorage.removeItem(STORAGE_KEY);
        setTokens(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const newTokens = await loginRequest(email, password);
    const currentUser = await getCurrentUser(newTokens.access_token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTokens));
    setTokens(newTokens);
    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    if (tokens?.refresh_token) {
      // Best-effort — even if this fails, we still clear the local session
      await logoutRequest(tokens.refresh_token).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setTokens(null);
    setUser(null);
  }

  const value = { user, tokens, loading, login, logout, isAuthenticated: Boolean(user) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
