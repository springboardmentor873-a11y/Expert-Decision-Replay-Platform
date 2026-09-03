import request from "./api";

export function login(email, password) {
  return request("/api/v1/auth/login", { method: "POST", body: { email, password } });
}

export function register(fullName, email, password) {
  return request("/api/v1/auth/register", {
    method: "POST",
    body: { full_name: fullName, email, password },
  });
}

export function getCurrentUser(token) {
  return request("/api/v1/auth/me", { token });
}

export function logout(refreshToken) {
  return request("/api/v1/auth/logout", { method: "POST", body: { refresh_token: refreshToken } });
}
