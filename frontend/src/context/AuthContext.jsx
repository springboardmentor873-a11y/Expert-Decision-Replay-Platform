import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('edrp_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = res.data;
    localStorage.setItem('edrp_access_token', access_token);
    localStorage.setItem('edrp_refresh_token', refresh_token);
    await fetchCurrentUser();
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('edrp_access_token');
    localStorage.removeItem('edrp_refresh_token');
    setUser(null);
  };

  const roleCode = user?.role?.code?.toLowerCase() || '';

  const value = {
    user,
    loading,
    roleCode,
    isAuthenticated: !!user,
    isAdmin: roleCode === 'administrator',
    isManager: roleCode === 'manager',
    isReviewer: roleCode === 'reviewer',
    isEmployee: roleCode === 'employee',
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
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
