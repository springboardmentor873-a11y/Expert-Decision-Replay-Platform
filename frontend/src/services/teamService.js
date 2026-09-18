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

export async function getTeams(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function getTeamById(teamId, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function getTeamWorkspace(teamId, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}/workspace`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function createTeam(teamData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(teamData),
  });
  return handleResponse(response);
}

export async function updateTeam(teamId, teamData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(teamData),
  });
  return handleResponse(response);
}

export async function deleteTeam(teamId, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function addTeamMember(teamId, memberData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}/members`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(memberData),
  });
  return handleResponse(response);
}

export async function removeTeamMember(teamId, userId, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  getTeams,
  getTeamById,
  getTeamWorkspace,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
};
