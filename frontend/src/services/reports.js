import request from "./api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export function getReportSummary(token, params = {}) {
  return request(`/api/v1/reports/summary${buildQuery(params)}`, { token });
}

export function getStatusBreakdown(token, params = {}) {
  return request(`/api/v1/reports/status-breakdown${buildQuery(params)}`, { token });
}

export function getReportActivity(token, params = {}) {
  return request(`/api/v1/reports/activity${buildQuery(params)}`, { token });
}

export function getUserReport(token, params = {}) {
  return request(`/api/v1/reports/users${buildQuery(params)}`, { token });
}