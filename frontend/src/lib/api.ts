export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("edrp_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("edrp_token", token);
  else localStorage.removeItem("edrp_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof URLSearchParams)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.blob();

  if (!res.ok) {
    const message =
      isJson && body && typeof body === "object" && "detail" in body
        ? Array.isArray((body as any).detail)
          ? (body as any).detail.map((d: any) => d.msg).join(", ")
          : String((body as any).detail)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path, { method: "GET" }),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  put: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T,>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
  login: async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.set("username", email);
    params.set("password", password);
    return request<{ access_token: string; token_type: string; user: User }>(
      "/auth/login",
      { method: "POST", body: params }
    );
  },
  downloadBlob: async (path: string): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new ApiError(res.status, `Report generation failed (${res.status})`);
    }
    return res.blob();
  },
};

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "Administrator" | "Manager" | "Reviewer" | "Employee";
  employee_id: string;
  department: string;
  designation: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

export interface Decision {
  id: number;
  title: string;
  problem_statement: string;
  category: string;
  status: string;
  tags: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Alternative {
  id: number;
  decision_id: number;
  name: string;
  description: string;
  pros: string;
  cons: string;
  estimated_cost: number;
  feasibility_score: number;
  risk_level: string;
  is_selected: boolean;
}

export interface Comment {
  id: number;
  decision_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface DiscussionThread {
  id: number;
  decision_id: number;
  user_id: number;
  title: string;
  content: string;
}

export interface ThreadReply {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
}

export interface MeetingNote {
  id: number;
  decision_id: number;
  user_id: number;
  content: string;
}

export interface Rationale {
  id: number;
  decision_id: number;
  user_id: number;
  content: string;
}

export interface Approval {
  id: number;
  decision_id: number;
  reviewer_id: number;
  approval_level: number;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  escalated_from_id: number | null;
}

export interface TimelineEvent {
  type: string;
  timestamp: string;
  actor: string | null;
  summary: string;
  details: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
}

export interface ActivityEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
}

export interface NotificationEntry {
  id: number;
  user_id: number;
  notification_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DocumentEntry {
  id: number;
  decision_id: number;
  uploaded_by: number;
  filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  department: string;
  created_at: string;
  member_count: number;
}

export interface TeamMemberInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
  designation: string;
}

export interface TeamDetail extends TeamSummary {
  members: TeamMemberInfo[];
}

export interface DecisionVersionEntry {
  id: number;
  decision_id: number;
  version_number: number;
  title: string;
  problem_statement: string;
  category: string;
  status: string;
  changed_by: number;
  change_summary: string | null;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: "decision" | "team" | "person" | "document" | "topic" | "state";
  label: string;
  subtitle?: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraphData {
  focal_decision_id: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}
