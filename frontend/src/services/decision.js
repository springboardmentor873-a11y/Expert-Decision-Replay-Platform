import request from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function listDecisions(token) {
  return request("/api/v1/decisions", { token });
}

export function getDecision(decisionId, token) {
  return request(`/api/v1/decisions/${decisionId}`, { token });
}

export function createDecision(payload, token) {
  return request("/api/v1/decisions", { method: "POST", body: payload, token });
}

export function updateDecision(decisionId, payload, token) {
  return request(`/api/v1/decisions/${decisionId}`, { method: "PATCH", body: payload, token });
}

export function submitDecisionForReview(decisionId, token) {
  return request(`/api/v1/decisions/${decisionId}/submit`, { method: "POST", token });
}

export function addAlternative(decisionId, payload, token) {
  return request(`/api/v1/decisions/${decisionId}/alternatives`, {
    method: "POST",
    body: payload,
    token,
  });
}

export function deleteAlternative(decisionId, alternativeId, token) {
  return request(`/api/v1/decisions/${decisionId}/alternatives/${alternativeId}`, {
    method: "DELETE",
    token,
  });
}

// File upload needs multipart/form-data, which the shared `request` helper
// doesn't handle (it always sends JSON) — so this one talks to fetch directly.
export async function uploadAttachment(decisionId, file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || "Upload failed. Please try again.");
  }
  return data;
}

export function deleteAttachment(decisionId, attachmentId, token) {
  return request(`/api/v1/decisions/${decisionId}/attachments/${attachmentId}`, {
    method: "DELETE",
    token,
  });
}

export function attachmentDownloadUrl(decisionId, attachmentId) {
  return `${API_BASE_URL}/api/v1/decisions/${decisionId}/attachments/${attachmentId}/download`;
}
