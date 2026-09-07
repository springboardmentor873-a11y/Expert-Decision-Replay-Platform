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
 * Fetches all discussions and nested replies for a decision.
 */
export async function getDiscussions(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/discussions`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Posts a new top-level discussion comment on a decision.
 */
export async function createDiscussion(decisionId, content, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/discussions`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ content }),
  });
  return handleResponse(response);
}

/**
 * Posts a reply to an existing discussion comment.
 */
export async function createReply(decisionId, discussionId, content, token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/discussions/${discussionId}/replies`,
    {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ content }),
    }
  );
  return handleResponse(response);
}

/**
 * Updates the content of an existing discussion comment.
 */
export async function updateDiscussion(decisionId, discussionId, content, token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/discussions/${discussionId}`,
    {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ content }),
    }
  );
  return handleResponse(response);
}

/**
 * Deletes a discussion comment.
 */
export async function deleteDiscussion(decisionId, discussionId, token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/discussions/${discussionId}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  );
  return handleResponse(response);
}
