import request from "./api";

export const AUDIT_ACTION_LABELS = {
  decision_created: "Decision Created",
  decision_updated: "Decision Updated",
  decision_submitted: "Submitted for Review",
  decision_archived: "Decision Archived",
  reviewer_approved: "Reviewer Approved",
  reviewer_rejected: "Reviewer Rejected",
  manager_approved: "Manager Approved",
  manager_rejected: "Manager Rejected",
};

export function listAuditLogs(token, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return request(`/api/v1/audit-logs${qs ? `?${qs}` : ""}`, { token });
}