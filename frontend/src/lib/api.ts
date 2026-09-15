const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.body && !isFormData && !(options.body instanceof URLSearchParams)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

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
  get:    <T,>(path: string) => request<T>(path, { method: "GET" }),
  post:   <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put:    <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT",  body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch:  <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH",body: data !== undefined ? JSON.stringify(data) : undefined }),
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

  uploadFile: async (decisionId: number, file: File): Promise<Document> => {
    const fd = new FormData();
    fd.append("file", file);
    const token = getToken();
    const res = await fetch(`${API_URL}/decisions/${decisionId}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.detail || `Upload failed (${res.status})`);
    }
    return body as Document;
  },

  downloadBlob: async (path: string): Promise<Blob> => {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, `Download failed (${res.status})`);
    return res.blob();
  },
};

/* ------------------------------------------------------------------ */
/* Type definitions                                                     */
/* ------------------------------------------------------------------ */

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
  created_at: string;
  updated_at: string;
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
}

export interface Document {
  id: number;
  decision_id: number;
  uploaded_by: number;
  filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
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

export interface Team {
  id: number;
  name: string;
  department: string;
  member_count: number;
  created_at: string;
}

export interface TeamMember {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  designation: string;
  joined_at: string;
  active_decisions: Array<{ id: number; title: string; status: string; created_at: string }>;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface MyDiscussion {
  id: number;
  title: string;
  content: string;
  decision_id: number;
  decision_title: string;
  user_id: number;
  author_name: string;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_decisions: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  status_over_time: Array<{ date: string; counts: Record<string, number> }>;
  avg_days_to_approval: number | null;
  top_contributors: Array<{ user_id: number; full_name: string; decisions_created: number }>;
  approval_rate_by_reviewer: Array<{
    reviewer_id: number;
    reviewer_name: string;
    approved: number;
    rejected: number;
    pending: number;
    approval_rate_pct: number;
  }>;
}

export interface UserSettings {
  notify_on_comment: boolean;
  notify_on_approval: boolean;
  notify_on_status_change: boolean;
  digest_frequency: string;
}

export interface DashboardData {
  total_decisions: number;
  draft_decisions: number;
  under_review: number;
  approved_decisions: number;
  rejected_decisions: number;
  archived_decisions: number;
  recent_decisions: Array<{
    id: number;
    title: string;
    status: string;
    category: string;
    created_by: number;
    creator_name: string;
    created_at: string;
  }>;
  recent_activities: Array<{
    id: number;
    user_id: number;
    actor_name: string;
    action: string;
    entity_type: string;
    entity_id: number;
    description: string;
    created_at: string;
  }>;
  recent_discussions: Array<{
    id: number;
    title: string;
    decision_id: number;
    decision_title: string;
    created_at: string;
  }>;
  my_teams: Array<{ id: number; name: string; member_count: number }>;
  unread_count: number;
}

/* ------------------------------------------------------------------ */
/* Utility helpers                                                      */
/* ------------------------------------------------------------------ */

/** Relative time formatter — "2 hours ago", "just now", etc. */
export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minute${Math.floor(diff / 60_000) === 1 ? "" : "s"} ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hour${Math.floor(diff / 3_600_000) === 1 ? "" : "s"} ago`;
  return `${Math.floor(diff / 86_400_000)} day${Math.floor(diff / 86_400_000) === 1 ? "" : "s"} ago`;
}

/** Human-readable file size: "1.2 MB" */
export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
