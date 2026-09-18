# Milestone 3: Enterprise Dashboard Documentation

## 1. Overview
The **Enterprise Dashboard** is the final Milestone 3 feature for the **Expert Decision Replay Platform**. It unifies decisions, competing alternatives, multi-stage approval workflows, threaded discussions, supporting documents, version tracking, audit logs, and reports into a real-time operational command center.

The dashboard respects strict Role-Based Access Control (RBAC), enforces data isolation across roles, reuses existing analytical services for complete data consistency, and provides role-tailored views for **Administrators**, **Managers**, **Reviewers**, and **Employees**.

---

## 2. Dashboard Architecture

```
[ Frontend React + Vite ]
   │
   ├─► dashboardService.js (Authenticated Bearer token)
   │     │
   │     ▼
[ FastAPI REST API ]
   │
   ├─► GET /api/v1/dashboard/summary (dependencies.py: get_current_user)
   │     │
   │     ▼
[ Dashboard Service Layer ] (dashboard_service.py)
   │
   ├─► report_service.get_decision_summary_report (100% Metric Consistency)
   ├─► report_service.get_approval_report (Approval rates & queue)
   ├─► RBAC Decision Scope Filter (Administrator / Manager / Reviewer / Employee)
   ├─► Recent Decisions & Pending Review Queue
   ├─► Scoped Audit Log Stream
   ├─► Scoped Discussion Activity & Supporting Document Metadata
   └─► User Notifications & Turnaround Analytics
         │
         ▼
[ PostgreSQL / SQLite Relational Database Engine ]
```

---

## 3. KPI Definitions

| Metric | Source Calculation | Description |
| :--- | :--- | :--- |
| **Total Decisions** | Count of decisions within user's visible RBAC scope | Number of decisions the user is authorized to view |
| **Pending Review** | `Submitted` + `Under Review` decisions in visible scope | Decisions awaiting evaluation by reviewers or managers |
| **Approved** | Count of decisions in `Approved` status | Decisions successfully signed off through approval workflows |
| **Rejected** | Count of decisions in `Rejected` status | Decisions evaluated and rejected with rationale |
| **Draft** | Count of decisions in `Draft` status | Unsubmitted decisions visible to user (own drafts + admin visibility) |
| **My Decisions** | `Decision.created_by == current_user.id` | Number of decisions authored by the current authenticated user |
| **Recent Activities** | Count of accessible audit log events | Audit trail events permitted under user's role |
| **Unread Notifications** | `Notification.recipient_id == current_user.id AND is_read == False` | Live unread alerts requiring user attention |
| **Approval Rate** | `(approved_count / total_reviews) * 100` | Organization-wide or accessible review approval percentage |
| **Rejection Rate** | `(rejected_count / total_reviews) * 100` | Review rejection percentage |
| **Avg Turnaround** | `Mean(Approval.created_at - Decision.created_at)` in hours | Average hours from decision creation/submission to review resolution |

---

## 4. Role-Based Dashboard Behavior

The dashboard dynamically adjusts its content, metrics, queues, and activity feeds according to the user's role:

### Administrator
- **Decision Visibility**: All decisions across the organization, including draft decisions authored by any user.
- **KPI Scope**: Global organization-wide decision counts, status distributions, and trends.
- **Pending Review Queue**: All decisions awaiting review across all departments.
- **Activity Feed**: Complete system-wide audit trail (user registrations, logins, decision submissions, approvals, document uploads, and discussions).
- **Quick Actions**: `Create Decision`, `View Decisions`, `Pending Approvals`, `Reports & Analytics`, `Audit Logs`, `Notifications`.

### Manager
- **Decision Visibility**: All non-draft decisions (`Submitted`, `Under Review`, `Approved`, `Rejected`) plus own draft decisions.
- **KPI Scope**: Organizational decision metrics excluding other users' private drafts.
- **Pending Review Queue**: Departmental/organizational queue of decisions awaiting review.
- **Activity Feed**: Broad audit log visibility for governance and tracking.
- **Quick Actions**: `Create Decision`, `View Decisions`, `Pending Approvals`, `Reports & Analytics`, `Audit Logs`, `Notifications`.

### Reviewer
- **Decision Visibility**: All non-draft decisions plus own drafts.
- **KPI Scope**: Operational review metrics and workload distributions.
- **Pending Review Queue**: Decisions awaiting review with direct `[Review]` action buttons.
- **Activity Feed**: Activity on accessible decisions and own actions.
- **Quick Actions**: `Pending Approvals`, `View Decisions`, `Reports & Analytics`, `Notifications`.

### Employee
- **Decision Visibility**: Strictly own authored decisions (`Decision.created_by == current_user.id`). Never exposes another employee's private drafts or inaccessible decisions.
- **KPI Scope**: Strictly personal decision counts (own drafts, submitted, approved, rejected).
- **Pending Review Queue**: "My Decisions Awaiting Review" — tracking author's submitted decisions in the approval pipeline.
- **Activity Feed**: Personal audit log entries and events associated with own decisions.
- **Quick Actions**: `Create Decision`, `My Decisions`, `Reports & Analytics`, `Notifications`.

---

## 5. REST API Endpoint

### `GET /api/v1/dashboard/summary`
- **Authentication**: Bearer JWT (`get_current_user` dependency).
- **Response Model**: `DashboardSummaryResponse`

```json
{
  "kpis": {
    "total_decisions": 12,
    "pending_review": 3,
    "approved": 6,
    "rejected": 1,
    "draft": 2,
    "my_decisions": 4,
    "recent_activity_count": 28,
    "unread_notifications_count": 2
  },
  "status_distribution": [
    { "status": "Draft", "count": 2, "percentage": 16.67, "color": "#94a3b8" },
    { "status": "Submitted", "count": 2, "percentage": 16.67, "color": "#3b82f6" },
    { "status": "Under Review", "count": 1, "percentage": 8.33, "color": "#f59e0b" },
    { "status": "Approved", "count": 6, "percentage": 50.0, "color": "#10b981" },
    { "status": "Rejected", "count": 1, "percentage": 8.33, "color": "#ef4444" }
  ],
  "decision_trend": [
    { "date": "2026-09-10", "count": 2 },
    { "date": "2026-09-12", "count": 4 },
    { "date": "2026-09-15", "count": 6 }
  ],
  "approval_summary": {
    "total_reviews": 7,
    "approved_count": 6,
    "rejected_count": 1,
    "pending_approvals": 3,
    "approval_rate": 85.71,
    "rejection_rate": 14.29,
    "average_turnaround_hours": 3.6
  },
  "recent_decisions": [
    {
      "id": 12,
      "title": "Adopt Event-Driven Microservices Architecture",
      "status": "Approved",
      "created_by": 1,
      "creator_name": "Alice Employee",
      "created_at": "2026-09-15T10:00:00Z",
      "updated_at": "2026-09-15T14:30:00Z"
    }
  ],
  "pending_items": [],
  "recent_activity": [],
  "recent_discussions": [],
  "recent_documents": [],
  "notifications": [],
  "user_role": "Employee"
}
```

---

## 6. Frontend Component Architecture

- **Page**: `frontend/src/pages/Dashboard.jsx`
- **Client Service**: `frontend/src/services/dashboardService.js`
- **Routing**: Registered at `/dashboard` and `/home` in `frontend/src/App.jsx`.
- **Navigation Link**: Main menu item in `frontend/src/components/Sidebar.jsx`.

### Key UI Features
1. **Interactive Greeting Banner**: Personalized welcome with role badge, current localized date, and manual metric refresh action.
2. **Role-Adaptive Quick Actions**: Action bar surfacing permissible shortcuts (+ Create, Review, Reports, Audit).
3. **Responsive KPI Grid**: 6 cards highlighting status totals, personal author metrics, and unread notification indicators.
4. **SVG Donut Distribution Chart**: Pure inline vector donut chart calculating proportional circumference strokes without external library overhead.
5. **Decision Creation Histogram**: CSS-driven bar chart rendering decision creation counts across real database timestamps.
6. **Approval Performance Card**: Progress bar with approval/rejection distribution and calculated turnaround speed.
7. **Role-Aware Pending Queue**: Tailored review queue with action buttons (`[Review]` for Reviewers/Managers; `[View]` for Employees).
8. **Recent Collaboration & Feeds**:
   - Recent activity stream with color-coded action tags and decision associations.
   - Recent discussion cards with author attribution and quotes.
   - Recent supporting document attachments with sanitized metadata (no server paths).
   - Clean Team Insights placeholder for future team structure features.

---

## 7. Reports Integration & Consistency
The dashboard service reuses the exact SQL aggregation methods from `report_service.py`:
- `report_service.get_decision_summary_report`
- `report_service.get_approval_report`
- `report_service.get_accessible_decision_ids_query`

This architectural pattern guarantees that:
- Dashboard Total Decisions == Reports Total Decisions
- Dashboard Approved/Rejected counts == Reports Approved/Rejected counts
- Dashboard Approval Rate (%) == Reports Approval Rate (%)
- Status percentages and time trends are 100% identical.

---

## 8. Security & Privacy Safeguards
1. **Zero Secret Leakage**: No password hashes, JWT tokens, secrets, or server filesystem paths (`file_path` or `storage_path`) are ever returned by the dashboard API.
2. **Server-Side Authorization**: RBAC scoping is strictly enforced at the database query level via subqueries and role checks. Frontend route guards are not relied upon for security.
3. **Data Boundary Enforcement**: Employees cannot manipulate query arguments to discover or view decisions, discussions, documents, or audit logs belonging to another user's draft decisions.

---

## 9. Test Verification Results

### Dedicated Dashboard Test Suite (`tests/test_dashboard.py`)
- **Total Tests**: 25
- **Passed**: 25 (100%)
- **Runtime**: 2.977s

### Full Platform Regression Suite
- **Total Tests**: 179
- **Passed**: 179 (100%)
- **Covered Modules**:
  - Authentication & JWT
  - Registration & Role Validation
  - Role-Based Access Control (RBAC) & User Management
  - Decisions Management & Lifecycle
  - Alternative Comparison Matrix
  - Document Management & Uploads
  - Discussions & Replies
  - Decision Version Tracking & Replay Snapshots
  - Approval Workflows & Multi-stage Review
  - Real-time Notifications & Notification Center
  - Immutable Audit Logging System
  - Reports & Analytics Engine
  - Enterprise Dashboard

### Frontend Production Build
- **Tool**: Vite 5.4.21
- **Modules Transformed**: 1896
- **Result**: `✓ built in 14.22s` with 0 warnings and 0 errors.
