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

/**
 * Fetches pending approvals for review (Reviewer/Manager/Admin).
 */
export async function getPendingApprovals(token = null) {
  const response = await fetch(`${API_BASE_URL}/approvals/pending`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Approves a decision.
 * @param {number|string} decisionId 
 * @param {object} [actionData] { comment: string }
 * @param {string} [token] 
 */
export async function approveDecision(decisionId, actionData = {}, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/approve`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(actionData),
  });
  return handleResponse(response);
}

/**
 * Rejects a decision with a mandatory rejection reason.
 * @param {number|string} decisionId 
 * @param {object} actionData { rejection_reason: string, comment?: string }
 * @param {string} [token] 
 */
export async function rejectDecision(decisionId, actionData, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/reject`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(actionData),
  });
  return handleResponse(response);
}

/**
 * Fetches approval audit history for a decision.
 * @param {number|string} decisionId 
 * @param {string} [token] 
 */
export async function getApprovalHistory(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/approvals`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}
