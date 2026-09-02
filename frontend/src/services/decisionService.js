const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
 * Fetches all accessible decisions for the authenticated user with optional status filter.
 * @param {string} token - JWT bearer token
 * @param {string|null} status - Optional status filter (Draft, Submitted, etc.)
 */
export async function getDecisions(token, status = null) {
  const url = new URL(`${API_BASE_URL}/decisions`);
  if (status) {
    url.searchParams.append('status', status);
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Fetches a single decision by its ID.
 * @param {string} token - JWT bearer token
 * @param {number|string} id - Decision ID
 */
export async function getDecision(token, id) {
  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Creates a new decision. The creator is derived automatically from the JWT token.
 * @param {string} token - JWT bearer token
 * @param {Object} decisionData - { title, problem_statement, context, decision_taken, reasoning, expected_outcome, actual_outcome }
 */
export async function createDecision(token, decisionData) {
  const response = await fetch(`${API_BASE_URL}/decisions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(decisionData),
  });
  return handleResponse(response);
}

/**
 * Updates an existing decision.
 * @param {string} token - JWT bearer token
 * @param {number|string} id - Decision ID
 * @param {Object} decisionData - Partial or full decision update fields
 */
export async function updateDecision(token, id, decisionData) {
  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(decisionData),
  });
  return handleResponse(response);
}

/**
 * Submits a draft decision for evaluation/review.
 * @param {string} token - JWT bearer token
 * @param {number|string} id - Decision ID
 */
export async function submitDecision(token, id) {
  const response = await fetch(`${API_BASE_URL}/decisions/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Deletes a decision.
 * @param {string} token - JWT bearer token
 * @param {number|string} id - Decision ID
 */
export async function deleteDecision(token, id) {
  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}