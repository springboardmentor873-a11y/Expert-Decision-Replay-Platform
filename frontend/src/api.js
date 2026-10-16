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

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Network Error: Could not connect to server at ${BASE_URL}. (${err.message})`);
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    if (res.status === 401 && auth && path !== "/login") {
      clearToken();
      localStorage.removeItem("edrp_user");
      window.location.href = "/login";
    }
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
  listUserDirectory: () => request("/users/directory"),
  updateUserRole: (userId, roleName) =>
    request(`/users/${userId}/role`, { method: "PUT", body: { role_name: roleName } }),

  // ---- Teams (Milestone 1 & Team Join Requests) ----
  listTeams: () => request("/teams", { auth: false }),
  createTeam: (payload) => request("/teams", { method: "POST", body: payload }),
  setTeamManager: (teamId, managerId) =>
    request(`/teams/${teamId}/manager`, {
      method: "PUT",
      body: { manager_id: managerId ? Number(managerId) : null },
    }),
  assignUserToTeam: (userId, teamId) =>
    request(`/teams/assign/${userId}`, { method: "PUT", body: { team_id: Number(teamId) } }),
  requestToJoinTeam: (teamId) =>
    request(`/teams/${teamId}/join-requests`, { method: "POST" }),
  listTeamJoinRequests: () => request("/teams/join-requests"),
  approveTeamJoinRequest: (requestId) =>
    request(`/teams/join-requests/${requestId}/approve`, { method: "POST" }),
  rejectTeamJoinRequest: (requestId) =>
    request(`/teams/join-requests/${requestId}/reject`, { method: "POST" }),
  leaveTeam: (teamId) =>
    request(`/teams/${teamId}/leave`, { method: "POST" }),
  cancelTeamJoinRequest: (requestId) =>
    request(`/teams/join-requests/${requestId}`, { method: "DELETE" }),

  // ---- Decisions (Milestone 2 & 4) ----
  listDecisions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/decisions${qs ? `?${qs}` : ""}`);
  },
  searchDecisions: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((k) => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
        cleanParams[k] = params[k];
      }
    });
    const qs = new URLSearchParams(cleanParams).toString();
    return request(`/decisions/search${qs ? `?${qs}` : ""}`);
  },
  listTeamDecisions: () => request("/decisions/team"),
  getDecision: (id) => request(`/decisions/${id}`),
  getDecisionAiSummary: (id) => request(`/decisions/${id}/ai-summary`),
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

  // ---- Approval Workflow (Milestone 3) ----
  listApprovalSteps: (decisionId) => request(`/decisions/${decisionId}/approvals`),
  createApprovalWorkflow: (decisionId, reviewerIds) =>
    request(`/decisions/${decisionId}/approvals`, {
      method: "POST",
      body: { reviewer_ids: reviewerIds },
    }),
  decideApprovalStep: (decisionId, stepId, decision, comment) =>
    request(`/decisions/${decisionId}/approvals/${stepId}/decide`, {
      method: "POST",
      body: { decision, comment },
    }),
  escalateApprovalStep: (decisionId, stepId, newReviewerId, comment) =>
    request(`/decisions/${decisionId}/approvals/${stepId}/escalate`, {
      method: "POST",
      body: { new_reviewer_id: newReviewerId, comment },
    }),

  // ---- Notifications (Milestone 3) ----
  listNotifications: (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? "?unread_only=true" : ""}`),
  unreadNotificationCount: () => request("/notifications/unread-count"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),

  // ---- Reports & Audit Logs (Milestone 3 & 4) ----
  decisionsSummary: () => request("/reports/decisions/summary"),
  approvalsSummary: () => request("/reports/approvals/summary"),
  teamsSummary: () => request("/reports/teams/summary"),
  exportDecisionsCsvPath: "/reports/decisions/export",
  exportAuditCsvPath: "/reports/audit/export",
  exportDecisionPdfPath: (id) => `/reports/decisions/${id}/export/pdf`,
  exportExecutivePdfPath: "/reports/decisions/export/pdf",

  listAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit-logs${qs ? `?${qs}` : ""}`);
  },
  getEntityAuditLogs: (entityType, entityId) =>
    request(`/audit-logs/entity/${entityType}/${entityId}`),

  // ---- Dashboard (Milestone 3) ----
  getDashboard: () => request("/dashboard"),
};

export async function downloadFile(path, filename) {
  const token = getToken();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let detail = `Download failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "attachment";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function openFileInNewTab(path) {
  // Synchronously open a blank window on user click so modern browsers don't block popup
  const newWin = window.open("about:blank", "_blank");
  if (newWin) {
    newWin.document.write(
      "<div style='font-family:sans-serif;padding:50px;text-align:center;color:#334155;'>" +
        "<h2>📄 Loading Supporting Document...</h2>" +
        "<p>Fetching file safely from Expert Decision Replay Platform server...</p>" +
      "</div>"
    );
  }

  try {
    const token = getToken();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const res = await fetch(`${BASE_URL}${cleanPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      let msg = `Failed to open file (${res.status})`;
      try {
        const data = await res.json();
        msg = data.detail || msg;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const fileUrl = URL.createObjectURL(blob);
    if (newWin) {
      newWin.location.href = fileUrl;
    } else {
      window.location.href = fileUrl;
    }
  } catch (err) {
    if (newWin) newWin.close();
    throw err;
  }
}

export function setToken(token) {
  localStorage.setItem("edrp_token", token);
}

export function clearToken() {
  localStorage.removeItem("edrp_token");
}

export function isAuthed() {
  return Boolean(getToken());
}
