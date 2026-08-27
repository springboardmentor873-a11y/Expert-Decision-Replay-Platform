import api from "../api/axios";

export const teamService = {
  list: () => api.get("/teams"),
  get: (teamId) => api.get(`/teams/${teamId}`),
  create: (payload) => api.post("/teams", payload),
  addMember: (teamId, userId) => api.post(`/teams/${teamId}/members`, { user_id: userId }),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};
