const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("edrp_token");
}

async function request(path, { method = "GET", body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

export const api = {
  // ---- Auth (Milestone 1) ----
  register: (payload) => request("/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/login", { method: "POST", body: payload, auth: false }),
  getMe: () => request("/me"),
  updateMe: (payload) => request("/me", { method: "PUT", body: payload }),
  updateMyProfile: (payload) => request("/me/profile", { method: "PUT", body: payload }),

  // ---- Admin: users & roles (Milestone 1) ----
  listUsers: () => request("/users"),
  updateUserRole: (userId, roleName) =>
    request(`/users/${userId}/role`, { method: "PUT", body: { role_name: roleName } }),

  // ---- Teams (Milestone 1) ----
  listTeams: () => request("/teams", { auth: false }),
  createTeam: (payload) => request("/teams", { method: "POST", body: payload }),
  assignUserToTeam: (userId, teamId) =>
    request(`/teams/assign/${userId}`, { method: "PUT", body: { team_id: Number(teamId) } }),

  // ---- Decisions (Milestone 2) ----
  listDecisions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/decisions${qs ? `?${qs}` : ""}`);
  },
  getDecision: (id) => request(`/decisions/${id}`),
  createDecision: (payload) => request("/decisions", { method: "POST", body: payload }),
  updateDecision: (id, payload) => request(`/decisions/${id}`, { method: "PUT", body: payload }),
  deleteDecision: (id) => request(`/decisions/${id}`, { method: "DELETE" }),

  listAlternatives: (id) => request(`/decisions/${id}/alternatives`),
  addAlternative: (id, payload) => request(`/decisions/${id}/alternatives`, { method: "POST", body: payload }),

  listComments: (id) => request(`/decisions/${id}/comments`),
  addComment: (id, payload) => request(`/decisions/${id}/comments`, { method: "POST", body: payload }),
  deleteComment: (decisionId, commentId) =>
    request(`/decisions/${decisionId}/comments/${commentId}`, { method: "DELETE" }),

  listAttachments: (id) => request(`/decisions/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/decisions/${id}/upload`, { method: "POST", body: form, isForm: true });
  },

  listVersions: (id) => request(`/decisions/${id}/versions`),
};

export function setToken(token) {
  localStorage.setItem("edrp_token", token);
}

export function clearToken() {
  localStorage.removeItem("edrp_token");
}

export function isAuthed() {
  return Boolean(getToken());
}
