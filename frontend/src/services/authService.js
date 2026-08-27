import api from "../api/axios";

export const authService = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (payload) => api.post("/auth/register", payload),
  refresh: (refresh_token) => api.post("/auth/refresh", { refresh_token }),
  logout: () => api.post("/auth/logout"),
};
