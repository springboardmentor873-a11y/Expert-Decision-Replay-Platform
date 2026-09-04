import api from '../api';

export const decisionService = {
  // Decisions
  getDecisions: async () => {
    const response = await api.get('/decisions/');
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
};
