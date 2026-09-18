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
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function getTags(token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tags`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function createTag(tagData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tags`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(tagData),
  });
  return handleResponse(response);
}

export async function getDecisionTags(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tags/decision/${decisionId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function assignTagsToDecision(decisionId, tagIds, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tags/decision/${decisionId}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ tag_ids: tagIds }),
  });
  return handleResponse(response);
}

export async function removeTagFromDecision(decisionId, tagId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/tags/decision/${decisionId}/${tagId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  getTags,
  createTag,
  getDecisionTags,
  assignTagsToDecision,
  removeTagFromDecision,
};
