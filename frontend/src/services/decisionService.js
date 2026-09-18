import api from '../api';

export const decisionService = {
  // Decisions
  getDecisions: async () => {
    const response = await api.get('/decisions/');
    return response.data;
  },
  
  // Users
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  // Teams
  getTeams: async () => {
    const response = await api.get('/teams/');
    return response.data;
  },

  getDecision: async (id) => {
    const response = await api.get(`/decisions/${id}`);
    return response.data;
  },
  
  createDecision: async (data) => {
    const response = await api.post('/decisions/', data);
    return response.data;
  },
  
  updateDecision: async (id, data) => {
    const response = await api.put(`/decisions/${id}`, data);
    return response.data;
  },
  
  deleteDecision: async (id) => {
    const response = await api.delete(`/decisions/${id}`);
    return response.data;
  },

  // Alternatives
  getAlternatives: async (decisionId) => {
    const response = await api.get(`/decisions/${decisionId}/alternatives/`);
    return response.data;
  },
  
  createAlternative: async (decisionId, data) => {
    const response = await api.post(`/decisions/${decisionId}/alternatives/`, data);
    return response.data;
  },
  
  updateAlternative: async (decisionId, altId, data) => {
    const response = await api.put(`/decisions/${decisionId}/alternatives/${altId}`, data);
    return response.data;
  },
  
  deleteAlternative: async (decisionId, altId) => {
    const response = await api.delete(`/decisions/${decisionId}/alternatives/${altId}`);
    return response.data;
  },

  // Discussions
  getDiscussions: async (decisionId) => {
    const response = await api.get(`/decisions/${decisionId}/discussions/`);
    return response.data;
  },
  
  createDiscussion: async (decisionId, data) => {
    const response = await api.post(`/decisions/${decisionId}/discussions/`, data);
    return response.data;
  },
  
  deleteDiscussion: async (decisionId, discId) => {
    const response = await api.delete(`/decisions/${decisionId}/discussions/${discId}`);
    return response.data;
  },

  // Documents
  getDocuments: async (decisionId) => {
    const response = await api.get(`/decisions/${decisionId}/documents/`);
    return response.data;
  },
  
  uploadDocument: async (decisionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/decisions/${decisionId}/documents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteDocument: async (decisionId, docId) => {
    const response = await api.delete(`/decisions/${decisionId}/documents/${docId}`);
    return response.data;
  },

  // Approvals
  createApproval: async (decisionId, reviewerId) => {
    const response = await api.post(`/approvals/?decision_id=${decisionId}&reviewer_id=${reviewerId}`);
    return response.data;
  },
  
  updateApproval: async (approvalId, status, comments) => {
    const response = await api.put(`/approvals/${approvalId}`, { status, comments });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },
  
  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllNotificationsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async () => {
    const response = await api.get('/audit-logs/');
    return response.data;
  },
  
  getDecisionAuditLogs: async (decisionId) => {
    const response = await api.get(`/audit-logs/${decisionId}`);
    return response.data;
  },

  // Reports
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard-stats');
    return response.data;
  },
};
