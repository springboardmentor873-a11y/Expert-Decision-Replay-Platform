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
 * Fetches paginated audit logs with optional filters.
 */
export async function getAuditLogs(
  { page = 1, pageSize = 20, action = '', entityType = '', entityId = '', userId = '', startDate = '', endDate = '' } = {},
  token = null
) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (action) query.append('action', action);
  if (entityType) query.append('entity_type', entityType);
  if (entityId) query.append('entity_id', entityId.toString());
  if (userId) query.append('user_id', userId.toString());
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/api/v1/audit-logs?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single audit log entry by ID. Strictly read-only.
 */
export async function getAuditLogById(auditLogId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/audit-logs/${auditLogId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}
