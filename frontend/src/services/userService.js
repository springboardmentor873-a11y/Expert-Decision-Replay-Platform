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

export async function updateProfile(profileData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/profile`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(profileData),
  });
  return handleResponse(response);
}

export async function changePassword(passwordData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/change-password`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(passwordData),
  });
  return handleResponse(response);
}

export async function getUserRoster(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/roster`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  updateProfile,
  changePassword,
  getUserRoster,
};
