export const API_BASE = "http://127.0.0.1:8000";

export function getCurrentUser() {
  const raw = localStorage.getItem("user");

  return raw
    ? JSON.parse(raw)
    : null;
}

export function setCurrentUser(user) {
  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );
}

export function logout() {
  localStorage.removeItem("user");
}