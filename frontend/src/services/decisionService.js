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
 * Fetches all accessible decisions for the authenticated user with optional status filter.
 * Accepts either: getDecisions(status) OR getDecisions(token, status)
 */
export async function getDecisions(statusOrToken = null, maybeStatus = null) {
  let status = null;
  let token = null;

  if (typeof statusOrToken === 'string' && statusOrToken.startsWith('ey')) {
    token = statusOrToken;
    status = maybeStatus;
  } else {
    status = statusOrToken;
  }

  const url = new URL(`${API_BASE_URL}/decisions`);
  if (status && status !== 'ALL') {
    url.searchParams.append('status', status);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single decision by its ID.
 * Accepts either: getDecision(id) OR getDecision(token, id)
 */
export async function getDecision(idOrToken, maybeId = null) {
  let id = idOrToken;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = maybeId;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Creates a new decision. The creator is derived automatically from the JWT token.
 * Accepts either: createDecision(decisionData) OR createDecision(token, decisionData)
 */
export async function createDecision(dataOrToken, maybeData = null) {
  let decisionData = dataOrToken;
  let token = null;

  if (typeof dataOrToken === 'string' && dataOrToken.startsWith('ey')) {
    token = dataOrToken;
    decisionData = maybeData;
  }

  const response = await fetch(`${API_BASE_URL}/decisions`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(decisionData),
  });
  return handleResponse(response);
}

/**
 * Updates an existing decision.
 * Accepts either: updateDecision(id, decisionData) OR updateDecision(token, id, decisionData)
 */
export async function updateDecision(idOrToken, idOrData, maybeData = null) {
  let id;
  let decisionData;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = idOrData;
    decisionData = maybeData;
  } else {
    id = idOrToken;
    decisionData = idOrData;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(decisionData),
  });
  return handleResponse(response);
}

/**
 * Submits a draft decision for evaluation/review.
 * Accepts either: submitDecision(id) OR submitDecision(token, id)
 */
export async function submitDecision(idOrToken, maybeId = null) {
  let id = idOrToken;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = maybeId;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}/submit`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Deletes a decision.
 * Accepts either: deleteDecision(id) OR deleteDecision(token, id)
 */
export async function deleteDecision(idOrToken, maybeId = null) {
  let id = idOrToken;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = maybeId;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${resolveToken(token)}`,
    },
  });
  return handleResponse(response);
}