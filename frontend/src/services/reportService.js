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

/**
 * 1. Decision Summary Report
 */
export async function getDecisionSummaryReport(
  { startDate = '', endDate = '', status = '', createdBy = '', decisionId = '', title = '' } = {},
  token = null
) {
  const query = new URLSearchParams();
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (status) query.append('status', status);
  if (createdBy) query.append('created_by', createdBy.toString());
  if (decisionId) query.append('decision_id', decisionId.toString());
  if (title) query.append('title', title);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/decisions/summary?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 2. Approval Report
 */
export async function getApprovalReport(
  { page = 1, pageSize = 20, startDate = '', endDate = '', action = '', reviewerId = '', decisionId = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);
  if (action) query.append('action', action);
  if (reviewerId) query.append('reviewer_id', reviewerId.toString());
  if (decisionId) query.append('decision_id', decisionId.toString());

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/approvals?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 3. Decision Outcome Report
 */
export async function getOutcomeReport(
  { page = 1, pageSize = 20, outcomeStatus = '', status = '', createdBy = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (outcomeStatus) query.append('outcome_status', outcomeStatus);
  if (status) query.append('status', status);
  if (createdBy) query.append('created_by', createdBy.toString());
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/outcomes?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 4. Alternative Report
 */
export async function getAlternativeReport(
  { page = 1, pageSize = 20, decisionId = '', isSelected = '', feasibility = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (decisionId) query.append('decision_id', decisionId.toString());
  if (isSelected !== '' && isSelected !== null && isSelected !== undefined) {
    query.append('is_selected', isSelected.toString());
  }
  if (feasibility) query.append('feasibility', feasibility);
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/alternatives?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 5. Activity Report
 */
export async function getActivityReport(
  { page = 1, pageSize = 20, action = '', userId = '', decisionId = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (action) query.append('action', action);
  if (userId) query.append('user_id', userId.toString());
  if (decisionId) query.append('decision_id', decisionId.toString());
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/activity?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 6. Decision Timeline Report
 */
export async function getDecisionTimeline(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/decisions/${decisionId}/timeline`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 7. Team Report
 */
export async function getTeamReport(
  { teamId = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams();
  if (teamId) query.append('team_id', teamId.toString());
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/team?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * 8. Audit Report
 */
export async function getAuditReport(
  { page = 1, pageSize = 20, action = '', userId = '', decisionId = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (action) query.append('action', action);
  if (userId) query.append('user_id', userId.toString());
  if (decisionId) query.append('decision_id', decisionId.toString());
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/audit?${query.toString()}`, {
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Multi-Format Report Download (CSV, XLSX, PDF)
 */
export async function downloadReport({ reportType, format = 'csv', filters = {} } = {}, token = null) {
  const query = new URLSearchParams({ report_type: reportType, format });
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val.toString());
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/export?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${resolveToken(token)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Report export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = (format === 'excel' || format === 'xlsx') ? 'xlsx' : (format === 'pdf' ? 'pdf' : 'csv');
  a.download = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Direct CSV File Download (legacy alias)
 */
export async function downloadReportCsv(reportType, filters = {}, token = null) {
  return downloadReport({ reportType, format: 'csv', filters }, token);
}

export default {
  getDecisionSummaryReport,
  getApprovalReport,
  getOutcomeReport,
  getAlternativeReport,
  getActivityReport,
  getDecisionTimeline,
  getTeamReport,
  getAuditReport,
  downloadReport,
  downloadReportCsv,
};
