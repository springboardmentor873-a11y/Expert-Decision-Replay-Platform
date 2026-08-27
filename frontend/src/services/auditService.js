import api from "../api/axios";

export const auditService = {
  list: (params = {}) => api.get("/audit", { params }),
};
