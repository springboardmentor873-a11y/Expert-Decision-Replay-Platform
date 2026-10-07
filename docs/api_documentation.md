# Expert Decision Replay Platform — API Reference Manual

Base Path: `/api/v1` (with core convenience aliases mounted on root `/`)  
Interactive Swagger UI: `http://127.0.0.1:8000/docs`  
OpenAPI JSON: `http://127.0.0.1:8000/api/v1/openapi.json`

---

## 1. Authentication (`/auth`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | Register new user account | None | Public | `201`, `400`, `409` |
| `POST` | `/auth/login` | Authenticate credentials & issue JWT | None | Public | `200`, `401` |
| `GET` | `/auth/me` | Fetch active authenticated user profile | Bearer | Any | `200`, `401` |

### `POST /auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "full_name": "Jane Doe",
    "role": "Employee"
  }
  ```
- **Response `201`**: `{ "id": 1, "email": "user@example.com", "full_name": "Jane Doe", "role": { "id": 1, "name": "Employee" }, "is_active": true }`
- **Errors**: `400` Validation Error (short password, bad email), `409` Conflict (email already registered).

### `POST /auth/login`
- **Request Body**: `{ "email": "user@example.com", "password": "StrongPassword123!" }`
- **Response `200`**: `{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }`
- **Errors**: `401` Incorrect email or password / Account inactive.

---

## 2. User Management (`/users`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/users/me/profile` | View detailed self profile | Bearer | Any | `200`, `401` |
| `PATCH` | `/users/me/profile` | Update self profile details (name) | Bearer | Any | `200`, `400` |
| `POST` | `/users/me/change-password` | Change self password | Bearer | Any | `200`, `400`, `401` |
| `GET` | `/users/roster` | List user roster for assignment pickers | Bearer | Any | `200` |
| `GET` | `/users` | List all users (admin paginated) | Bearer | Admin | `200`, `403` |
| `GET` | `/users/{id}` | Get user by ID | Bearer | Admin/Self | `200`, `403`, `404` |
| `PATCH` | `/users/{id}/status` | Activate/deactivate user | Bearer | Admin | `200`, `403`, `404` |
| `PATCH` | `/users/{id}/role` | Reassign user role | Bearer | Admin | `200`, `403`, `404` |

---

## 3. Decision Management (`/decisions`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/decisions` | List & filter decisions (status, category, search) | Bearer | Any | `200` |
| `POST` | `/decisions` | Create new draft decision | Bearer | Any | `201`, `400` |
| `GET` | `/decisions/{id}` | Get full decision details | Bearer | Any | `200`, `403`, `404` |
| `PATCH` | `/decisions/{id}` | Update decision (owner if draft, or Admin) | Bearer | Owner/Admin | `200`, `400`, `403`, `404` |
| `DELETE` | `/decisions/{id}` | Delete draft decision | Bearer | Owner/Admin | `204`, `400`, `403`, `404` |
| `POST` | `/decisions/{id}/submit` | Submit draft decision for review | Bearer | Owner/Admin | `200`, `400`, `403`, `404` |
| `POST` | `/decisions/{id}/archive` | Archive decision | Bearer | Owner/Admin | `200`, `403`, `404` |
| `POST` | `/decisions/{id}/restore` | Restore archived decision | Bearer | Admin | `200`, `403`, `404` |

### Decision Lifecycle Rules
- Editing is only allowed in `Draft` state (except Reviewers/Managers updating review notes).
- Deletion is only allowed in `Draft` state.
- Submitting advances decision status from `Draft` to `Submitted`.

---

## 4. Alternatives (`/decisions/{id}/alternatives`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/decisions/{id}/alternatives` | List alternatives for decision | Bearer | Any | `200`, `404` |
| `POST` | `/decisions/{id}/alternatives` | Add alternative to decision | Bearer | Owner/Admin | `201`, `400`, `403` |
| `GET` | `/decisions/{id}/alternatives/{alt_id}` | Get alternative details | Bearer | Any | `200`, `404` |
| `PATCH` | `/decisions/{id}/alternatives/{alt_id}` | Update alternative | Bearer | Owner/Admin | `200`, `403`, `404` |
| `DELETE` | `/decisions/{id}/alternatives/{alt_id}` | Delete alternative | Bearer | Owner/Admin | `204`, `403`, `404` |

---

## 5. Decision Versions (`/decisions/{id}/versions`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/decisions/{id}/versions` | List version history for decision | Bearer | Any | `200`, `404` |
| `GET` | `/decisions/{id}/versions/{num}` | Get specific historical snapshot | Bearer | Any | `200`, `404` |
| `GET` | `/decisions/{id}/versions/{vA}/compare/{vB}` | Compare diff between two versions | Bearer | Any | `200`, `404` |

---

## 6. Document Attachments (`/decisions/{id}/documents`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/decisions/{id}/documents` | List documents attached to decision | Bearer | Any | `200`, `404` |
| `POST` | `/decisions/{id}/documents` | Upload document (`multipart/form-data`) | Bearer | Owner/Admin | `201`, `400`, `413` |
| `GET` | `/decisions/{id}/documents/{doc_id}/download` | Stream/download file attachment | Bearer | Any | `200`, `404` |
| `DELETE` | `/decisions/{id}/documents/{doc_id}` | Delete document attachment | Bearer | Uploader/Admin | `204`, `403`, `404` |

---

## 7. Discussions (`/discussions` & `/decisions/{id}/discussions`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/discussions` | List all accessible discussions across platform | Bearer | Any | `200` |
| `GET` | `/decisions/{id}/discussions` | List discussions for a decision | Bearer | Any | `200`, `404` |
| `POST` | `/decisions/{id}/discussions` | Post top-level comment | Bearer | Any | `201`, `400` |
| `POST` | `/decisions/{id}/discussions/{d_id}/replies` | Post reply to discussion comment | Bearer | Any | `201`, `400`, `404` |
| `PATCH` | `/decisions/{id}/discussions/{d_id}` | Update comment content | Bearer | Author | `200`, `403`, `404` |
| `DELETE` | `/decisions/{id}/discussions/{d_id}` | Delete comment or reply | Bearer | Author/Admin | `204`, `403`, `404` |

---

## 8. Approvals & Workflows (`/approvals` & `/decisions/{id}/approval-flow`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/approvals/pending` | List pending decisions awaiting review | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/approvals/history` | List review history by current user | Bearer | Reviewer+ | `200`, `403` |
| `POST` | `/approvals/decisions/{id}/review` | Submit review decision (`Approved`/`Rejected`) | Bearer | Reviewer+ | `200`, `400`, `403` |
| `GET` | `/decisions/{id}/approval-flow` | Get multi-step approval workflow progress | Bearer | Any | `200`, `404` |
| `POST` | `/decisions/{id}/approval-flow/steps/{s_id}/act` | Execute step action (approve/reject) | Bearer | Assigned/Admin | `200`, `400`, `403` |
| `POST` | `/decisions/{id}/approval-flow/steps/{s_id}/escalate` | Escalate overdue step to next tier | Bearer | Manager/Admin | `200`, `400`, `403` |
| `POST` | `/decisions/{id}/approval-flow/check-overdue` | Trigger background overdue SLA sweep | Bearer | Manager/Admin | `200`, `403` |

---

## 9. Notifications (`/notifications`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/notifications` | List user notifications (paginated) | Bearer | Any | `200` |
| `GET` | `/notifications/unread-count` | Get total unread count for badge | Bearer | Any | `200` |
| `PATCH` | `/notifications/{id}/read` | Mark single notification as read | Bearer | Owner | `200`, `404` |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | Bearer | Any | `200` |
| `DELETE` | `/notifications/{id}` | Delete notification | Bearer | Owner | `204`, `404` |

---

## 10. Audit Logs (`/audit-logs`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/audit-logs` | Query audit trail (filters: user, action, entity) | Bearer | Manager/Admin | `200`, `403` |
| `GET` | `/audit-logs/export` | Export audit trail as CSV | Bearer | Manager/Admin | `200`, `403` |

---

## 11. Teams & Workspaces (`/teams`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/teams` | List all teams | Bearer | Any | `200` |
| `POST` | `/teams` | Create new team | Bearer | Manager/Admin | `201`, `403` |
| `GET` | `/teams/my` | Get teams the user belongs to | Bearer | Any | `200` |
| `GET` | `/teams/{id}` | Get team details | Bearer | Any | `200`, `404` |
| `GET` | `/teams/{id}/workspace` | Get team workspace (scoped decisions & docs) | Bearer | Any | `200`, `404` |
| `POST` | `/teams/{id}/members` | Add member to team | Bearer | Lead/Admin | `201`, `403` |
| `DELETE` | `/teams/{id}/members/{u_id}` | Remove member from team | Bearer | Lead/Admin | `204`, `403` |
| `POST` | `/teams/{id}/join-request` | Submit request to join team | Bearer | Any | `201`, `400` |
| `GET` | `/teams/join-requests` | List join requests for lead/admin | Bearer | Lead/Admin | `200`, `403` |
| `POST` | `/teams/join-requests/{r_id}/approve` | Approve join request | Bearer | Lead/Admin | `200`, `403` |
| `POST` | `/teams/join-requests/{r_id}/reject` | Reject join request | Bearer | Lead/Admin | `200`, `403` |

---

## 12. Knowledge Repository & Graph (`/knowledge-repository`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/knowledge-repository` | Filterable decision catalog | Bearer | Any | `200` |
| `GET` | `/knowledge-repository/graph` | Graph topology (nodes & edges) | Bearer | Any | `200` |
| `GET` | `/knowledge-repository/insights` | Aggregate knowledge base insights | Bearer | Any | `200` |

---

## 13. Reports & Analytics (`/reports`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/reports/decisions/summary` | Summary decision status aggregations | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/reports/approvals` | Approval cycle time & metrics | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/reports/outcomes` | Expected vs actual outcome tracking | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/reports/alternatives` | Alternative risk & feasibility distributions | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/reports/activity` | Activity volume timeline | Bearer | Reviewer+ | `200`, `403` |
| `GET` | `/reports/export` | Export reports (`?format=csv\|excel\|pdf`) | Bearer | Reviewer+ | `200`, `400`, `403` |

---

## 14. Dashboard & Global Search (`/dashboard` & `/search`)

| Method | Path | Purpose | Auth | Role | Status Codes |
|---|---|---|---|---|---|
| `GET` | `/dashboard/summary` | Dashboard KPI metrics and charts | Bearer | Any | `200` |
| `GET` | `/dashboard/kpis` | KPI summary alias (backwards compatible) | Bearer | Any | `200` |
| `GET` | `/search?q={query}` | Global search across decisions & teams | Bearer | Any | `200` |
