const DEFAULT_API_BASE =
  import.meta.env?.VITE_API_BASE_URL?.trim() || "/api";

/**
 * Base URL for every backend call.
 *
 * In Docker the nginx image serves the built SPA and reverse-proxies `/api`
 * to the FastAPI container, so the relative default needs no CORS handling.
 * For `npm run dev` set VITE_API_BASE_URL to the backend origin instead.
 */
export const API_BASE = DEFAULT_API_BASE.replace(/\/+$/, "");

const TOKEN_STORAGE_KEY = "access_token";

export function getCurrentUser() {
  const raw = localStorage.getItem("user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
}

export function setSession(user, accessToken) {
  localStorage.setItem("user", JSON.stringify(user));

  if (accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  }
}

export function setCurrentUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** Builds `${API_BASE}${path}` with optional query parameters. */
export function apiUrl(path, params) {
  const query = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      query.set(key, String(value));
    }
  }

  const suffix = query.toString() ? `?${query}` : "";

  return `${API_BASE}${path}${suffix}`;
}

/** Adds the bearer token to API requests. */
export function authHeaders(headers = {}) {
  const token = getAccessToken();

  if (!token) return headers;

  return { ...headers, Authorization: `Bearer ${token}` };
}

/**
  * Thin fetch wrapper that always resolves to parsed JSON and turns non-2xx
  * responses into an Error carrying the backend's `detail` message.
  */
export async function apiFetch(path, { params, ...options } = {}) {
  const response = await fetch(apiUrl(path, params), {
    ...options,
    headers: authHeaders(options.headers),
  });

  const text = await response.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && data.detail
        ? data.detail
        : typeof data === "string" && data
          ? data
          : `Request failed with status ${response.status}`;

    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * The page components call `fetch` directly for a handful of endpoints, so the
 * bearer token is attached once here rather than at every call site. Missing it
 * on any endpoint is not silent: the API answers 401 and the UI test suite
 * fails on unexpected 401 responses.
 */
export function installAuthInterceptor() {
  if (typeof window === "undefined") return;
  if (window.__edrpAuthPatched) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : "";

    const isApiCall = url.startsWith(API_BASE) || url.includes("/api/");

    if (!isApiCall) return nativeFetch(input, init);

    const headers = authHeaders(
      init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init.headers,
    );

    return nativeFetch(input, { ...init, headers });
  };

  window.__edrpAuthPatched = true;
}