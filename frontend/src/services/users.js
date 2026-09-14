import request from "./api";

export function listUsers(token) {
  return request("/api/v1/users", { token });
}