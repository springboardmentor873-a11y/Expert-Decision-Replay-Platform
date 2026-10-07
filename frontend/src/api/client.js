import axios from 'axios';

/**
 * Normalizes the backend API base URL:
 * - Checks VITE_API_URL (primary) and VITE_API_BASE_URL (fallback).
 * - In local dev (empty), defaults to '/api/v1' (proxied via Vite).
 * - In production (e.g. 'https://expert-decision-replay-4b9m.vercel.app'),
 *   safely appends '/api/v1' without duplicating it if already present.
 */
const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (!rawUrl) {
    return '/api/v1';
  }
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
};

const API_BASE = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edrp_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration & refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('edrp_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem('edrp_access_token', access_token);
          if (newRefresh) {
            localStorage.setItem('edrp_refresh_token', newRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('edrp_access_token');
          localStorage.removeItem('edrp_refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('edrp_access_token');
        localStorage.removeItem('edrp_refresh_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
