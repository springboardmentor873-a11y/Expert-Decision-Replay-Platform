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

export async function getApprovalWorkflows(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/workflows`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function createApprovalWorkflow(decisionId, workflowData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/workflows`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(workflowData),
  });
  return handleResponse(response);
}

export async function getApprovalWorkflowDetails(decisionId, workflowId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/workflows/${workflowId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function takeApprovalStepAction(decisionId, workflowId, stepId, actionData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/workflows/${workflowId}/steps/${stepId}/action`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(actionData),
  });
  return handleResponse(response);
}

export async function escalateApprovalWorkflow(decisionId, workflowId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/decisions/${decisionId}/workflows/${workflowId}/escalate`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  getApprovalWorkflows,
  createApprovalWorkflow,
  getApprovalWorkflowDetails,
  takeApprovalStepAction,
  escalateApprovalWorkflow,
};
