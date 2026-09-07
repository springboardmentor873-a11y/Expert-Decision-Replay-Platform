const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function resolveToken(candidate) {
  if (typeof candidate === 'string' && candidate.startsWith('ey')) {
    return candidate;
  }
  return localStorage.getItem('token') || '';
}

function getAuthHeaders(token) {
  const headers = {};
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
 * Fetches all attached documents for a decision.
 */
export async function getDocuments(decisionId, token = null) {
  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/documents`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
  });
  return handleResponse(response);
}

/**
 * Uploads a document attachment to a decision using multipart/form-data.
 */
export async function uploadDocument(decisionId, file, token = null) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/decisions/${decisionId}/documents`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
    },
    body: formData,
  });
  return handleResponse(response);
}

/**
 * Downloads a document attachment and triggers browser save dialog.
 */
export async function downloadDocument(decisionId, documentId, filename = 'download', token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/documents/${documentId}/download`,
    {
      method: 'GET',
      headers: {
        ...getAuthHeaders(token),
      },
    }
  );

  if (!response.ok) {
    let errorDetail = 'Failed to download file';
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') errorDetail = data.detail;
    } catch {
      errorDetail = `Download failed with status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Deletes a document attachment from a decision.
 */
export async function deleteDocument(decisionId, documentId, token = null) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${decisionId}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(token),
      },
    }
  );
  return handleResponse(response);
}
