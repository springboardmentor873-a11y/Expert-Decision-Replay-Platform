import request from "./api";

export function listNotifications(token, { limit = 20, offset = 0 } = {}) {
  return request(`/api/v1/notifications?limit=${limit}&offset=${offset}`, { token });
}

export function getUnreadCount(token) {
  return request("/api/v1/notifications/unread-count", { token });
}

export function markNotificationRead(notificationId, token) {
  return request(`/api/v1/notifications/${notificationId}/read`, {
    method: "PATCH",
    token,
  });
}

export function markAllNotificationsRead(token) {
  return request("/api/v1/notifications/read-all", { method: "POST", token });
}