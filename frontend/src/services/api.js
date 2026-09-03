const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Thin wrapper around fetch that talks to the FastAPI backend.
 * Throws an Error with the backend's message on failure, so callers
 * can just try/catch and show err.message to the user.
 */
async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content has no JSON body to parse
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || "Something went wrong. Please try again.";
    throw new Error(typeof message === "string" ? message : "Request failed.");
  }

  return data;
}

export default request;
