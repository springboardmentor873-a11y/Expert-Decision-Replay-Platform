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
 * Fetches all accessible decisions for the authenticated user with optional filters:
 * Accepts: getDecisions(filters) OR getDecisions(status, search) OR getDecisions(token, status, search)
 */
export async function getDecisions(arg1 = null, arg2 = null, arg3 = null) {
  let status = null;
  let search = null;
  let categoryId = null;
  let teamId = null;
  let tagId = null;
  let token = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    // Passed an options object: { status, search, categoryId, teamId, tagId, token }
    status = arg1.status;
    search = arg1.search;
    categoryId = arg1.categoryId || arg1.category_id;
    teamId = arg1.teamId || arg1.team_id;
    tagId = arg1.tagId || arg1.tag_id;
    token = arg1.token;
  } else if (typeof arg1 === 'string' && arg1.startsWith('ey')) {
    token = arg1;
    status = arg2;
    search = arg3;
  } else {
    status = arg1;
    search = arg2;
  }

  const url = new URL(`${API_BASE_URL}/decisions`);
  if (status && status !== 'ALL') {
    url.searchParams.append('status', status);
  }
  if (search && typeof search === 'string' && search.trim()) {
    url.searchParams.append('search', search.trim());
  }
  if (categoryId) {
    url.searchParams.append('category_id', categoryId.toString());
  }
  if (teamId) {
    url.searchParams.append('team_id', teamId.toString());
  }
  if (tagId) {
    url.searchParams.append('tag_id', tagId.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Searches decisions across title, problem, context, and status.
 */
export async function searchDecisions(query, limit = 8, token = null) {
  const url = new URL(`${API_BASE_URL}/decisions`);
  if (query && typeof query === 'string' && query.trim()) {
    url.searchParams.append('search', query.trim());
  }
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single decision by its ID.
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
 * Archives a decision.
 */
export async function archiveDecision(idOrToken, maybeId = null) {
  let id = idOrToken;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = maybeId;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}/archive`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Unarchives an archived decision back to Draft status.
 */
export async function unarchiveDecision(idOrToken, maybeId = null) {
  let id = idOrToken;
  let token = null;

  if (typeof idOrToken === 'string' && idOrToken.startsWith('ey')) {
    token = idOrToken;
    id = maybeId;
  }

  const response = await fetch(`${API_BASE_URL}/decisions/${id}/unarchive`, {
    method: 'POST',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Deletes a decision.
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

export default {
  getDecisions,
  searchDecisions,
  getDecision,
  createDecision,
  updateDecision,
  submitDecision,
  archiveDecision,
  unarchiveDecision,
  deleteDecision,
};
