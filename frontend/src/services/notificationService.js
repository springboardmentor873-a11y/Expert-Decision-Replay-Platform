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
 * Fetches paginated notifications for the current authenticated user.
 */
export async function getNotifications({ page = 1, pageSize = 20, unreadOnly = false } = {}, token = null) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    unread_only: unreadOnly ? 'true' : 'false',
  });
  const response = await fetch(`${API_BASE_URL}/notifications?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches the unread notifications count for the badge.
 */
export async function getUnreadCount(token = null) {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Marks a single notification as read.
 */
export async function markAsRead(notificationId, token = null) {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Marks all notifications for the authenticated user as read.
 */
export async function markAllAsRead(token = null) {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single notification by ID.
 */
export async function getNotification(notificationId, token = null) {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}
