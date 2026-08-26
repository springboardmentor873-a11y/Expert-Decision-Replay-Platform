import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authentication state from token on mount / reload
  const restoreAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const userData = await getCurrentUser(savedToken);
        setUser(userData);
        setToken(savedToken);
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const login = async (credentials) => {
    const tokenData = await loginUser(credentials);
    const accessToken = tokenData.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);

    const userData = await getCurrentUser(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    return await registerUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};