const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function resolveToken(candidate) {
  if (typeof candidate === 'string' && candidate.startsWith('ey')) {
    return candidate;
  }
  return localStorage.getItem('token') || '';
}

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const resolved = resolveToken(token);
  if (resolved) {
    headers['Authorization'] = `Bearer ${resolved}`;
  }
  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        errorDetail = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorDetail = data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
      } else if (data.message) {
        errorDetail = data.message;
      }
    } catch {
      errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export async function searchKnowledgeRepository(params = {}, token = null) {
  const query = new URLSearchParams();
  if (params.query) query.append('query', params.query);
  if (params.category_id) query.append('category_id', params.category_id.toString());
  if (params.tag) query.append('tag', params.tag);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.skip) query.append('skip', params.skip.toString());

  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-repository/search?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function getKnowledgeTimeline(limit = 50, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-repository/timeline?limit=${limit}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function getKnowledgeDocuments(limit = 100, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/knowledge-repository/documents?limit=${limit}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  searchKnowledgeRepository,
  getKnowledgeTimeline,
  getKnowledgeDocuments,
};
