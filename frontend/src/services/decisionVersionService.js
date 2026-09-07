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
 * Fetches all historical versions for a decision ordered by version_number DESC.
 */
export async function getVersions(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/versions`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single historical version snapshot by version number or ID.
 */
export async function getVersion(decisionId, versionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/versions/${versionId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Compares two versions of a decision and returns field-level differences.
 */
export async function compareVersions(decisionId, versionA, versionB, token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/versions/${versionA}/compare/${versionB}`,
    {
      method: 'GET',
      headers: getHeaders(token),
    }
  );
  return handleResponse(response);
}
