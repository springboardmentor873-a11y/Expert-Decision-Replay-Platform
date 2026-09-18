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

export async function getCategories(token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function getCategoryById(categoryId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories/${categoryId}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export async function createCategory(categoryData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(categoryData),
  });
  return handleResponse(response);
}

export async function updateCategory(categoryId, categoryData, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories/${categoryId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(categoryData),
  });
  return handleResponse(response);
}

export async function deleteCategory(categoryId, token = null) {
  const response = await fetch(`${API_BASE_URL}/api/v1/categories/${categoryId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(response);
}

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
