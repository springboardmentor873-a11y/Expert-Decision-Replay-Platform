import request from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function toQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function getKnowledgeSummary(token) {
  return request("/api/v1/knowledge/summary", { token });
}

export function listRepositoryDocuments(token, params = {}) {
  return request(`/api/v1/knowledge/documents${toQueryString(params)}`, { token });
}

export function getRepositoryDocument(documentId, token) {
  return request(`/api/v1/knowledge/documents/${documentId}`, { token });
}

export function listRepositoryDecisions(token, params = {}) {
  return request(`/api/v1/knowledge/decisions${toQueryString(params)}`, { token });
}

export function getKnowledgeGraph(token) {
  return request("/api/v1/knowledge/graph", { token });
}

// The download endpoint needs an auth header, which a plain <a href> can't send —
// fetch it as an authenticated request and hand the browser a blob URL instead.
export async function downloadRepositoryDocument(documentId, fileName, token) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/knowledge/documents/${documentId}/download`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) {
    throw new Error("Could not download this document.");
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}