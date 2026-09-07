const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getAuthHeaders(explicitToken) {
  const token = explicitToken || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
 * Fetches all alternatives for a given decision.
 * @param {number|string} decisionId
 * @param {string|null} [explicitToken]
 */
export async function getAlternatives(decisionId, explicitToken = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/alternatives`, {
    method: 'GET',
    headers: getAuthHeaders(explicitToken),
  });
  return handleResponse(response);
}

/**
 * Fetches a single alternative by its ID.
 * @param {number|string} decisionId
 * @param {number|string} alternativeId
 * @param {string|null} [explicitToken]
 */
export async function getAlternative(decisionId, alternativeId, explicitToken = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/alternatives/${alternativeId}`, {
    method: 'GET',
    headers: getAuthHeaders(explicitToken),
  });
  return handleResponse(response);
}

/**
 * Creates a new alternative evaluation for a decision.
 * @param {number|string} decisionId
 * @param {Object} alternativeData - { name, description, pros, cons, cost, feasibility, risk_assessment, is_selected }
 * @param {string|null} [explicitToken]
 */
export async function createAlternative(decisionId, alternativeData, explicitToken = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/alternatives`, {
    method: 'POST',
    headers: getAuthHeaders(explicitToken),
    body: JSON.stringify(alternativeData),
  });
  return handleResponse(response);
}

/**
 * Updates an existing alternative.
 * @param {number|string} decisionId
 * @param {number|string} alternativeId
 * @param {Object} alternativeData - partial or full update fields
 * @param {string|null} [explicitToken]
 */
export async function updateAlternative(decisionId, alternativeId, alternativeData, explicitToken = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/alternatives/${alternativeId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(explicitToken),
    body: JSON.stringify(alternativeData),
  });
  return handleResponse(response);
}

/**
 * Deletes an alternative.
 * @param {number|string} decisionId
 * @param {number|string} alternativeId
 * @param {string|null} [explicitToken]
 */
export async function deleteAlternative(decisionId, alternativeId, explicitToken = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/alternatives/${alternativeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(explicitToken),
  });
  return handleResponse(response);
}