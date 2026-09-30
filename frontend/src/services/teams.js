import request from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function listTeams(token) {
  return request("/api/v1/teams", { token });
}

export function getTeam(teamId, token) {
  return request(`/api/v1/teams/${teamId}`, { token });
}

// "No team yet" is an expected state, not an error — return null so the page
// can render a friendly empty state instead of treating 404 as a failure.
export async function getMyTeam(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/teams/my-team`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || "Failed to load your team.");
  }
  return data;
}

export function createTeam(payload, token) {
  return request("/api/v1/teams", { method: "POST", body: payload, token });
}

export function assignUserToTeam(userId, payload, token) {
  return request(`/api/v1/users/${userId}/team`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function createJoinRequest(teamId, token) {
  return request(`/api/v1/teams/${teamId}/join`, { method: "POST", token });
}

export function getMyJoinRequests(token) {
  return request("/api/v1/teams/my-join-requests", { token });
}

export function listPendingJoinRequests(token) {
  return request("/api/v1/teams/join-requests", { token });
}

export function approveJoinRequest(requestId, token) {
  return request(`/api/v1/teams/join-requests/${requestId}/approve`, {
    method: "POST",
    token,
  });
}

export function rejectJoinRequest(requestId, token) {
  return request(`/api/v1/teams/join-requests/${requestId}/reject`, {
    method: "POST",
    token,
  });
}