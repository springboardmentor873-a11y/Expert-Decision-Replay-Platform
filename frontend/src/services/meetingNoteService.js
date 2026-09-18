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

export async function getMeetingNotes(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/meeting-notes`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function createMeetingNote(decisionId, noteData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/meeting-notes`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

export async function updateMeetingNote(decisionId, noteId, noteData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/meeting-notes/${noteId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

export async function deleteMeetingNote(decisionId, noteId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/meeting-notes/${noteId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  getMeetingNotes,
  createMeetingNote,
  updateMeetingNote,
  deleteMeetingNote,
};
