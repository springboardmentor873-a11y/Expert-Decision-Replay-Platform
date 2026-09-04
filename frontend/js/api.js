/*
 * Shared API helper for the Expert Decision Replay Platform frontend.
 *
 * All frontend pages talk to the real FastAPI backend using fetch().
 * There is no mock/fake data anywhere in this file.
 */

// Change this if your backend runs on a different host/port.
const API_BASE_URL = "http://127.0.0.1:8000";

const TOKEN_KEY = "edrp_access_token";

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

/**
 * Perform a fetch() call against the API, automatically attaching the
 * JWT (if present) and parsing the JSON response.
 *
 * @param {string} path - API path, e.g. "/auth/me"
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} authRequired - attach the Authorization header
 */
async function apiRequest(path, options = {}, authRequired = false) {
  const headers = options.headers ? { ...options.headers } : {};

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (authRequired) {
    const token = getToken();
    if (!token) {
      throw new Error("You must be logged in to perform this action.");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (networkError) {
    throw new Error(
      "Could not reach the backend API. Is FastAPI running at " +
        API_BASE_URL +
        "?"
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
      : detail;
    throw new Error(message);
  }

  return data;
}

function requireLoginOrRedirect() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

function logout() {
  clearToken();
  window.location.href = "login.html";
}
