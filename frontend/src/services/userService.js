import api from "../api/axios";

export const userService = {
  me: () => api.get("/users/me"),
  updateMe: (payload) => api.put("/users/me", payload),
  list: (params = {}) => api.get("/users", { params }),
  get: (userId) => api.get(`/users/${userId}`),
  changeRole: (userId, role) => api.patch(`/users/${userId}/role`, { role }),
  deactivate: (userId) => api.patch(`/users/${userId}/deactivate`),
  activate: (userId) => api.patch(`/users/${userId}/activate`),
};
