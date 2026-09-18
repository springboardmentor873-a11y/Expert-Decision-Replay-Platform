# Milestone 3: Immutable Centralized Audit Logging System

## 1. Overview
The Audit Logging System provides an enterprise-grade, append-only record of all critical user actions and entity lifecycle events across the **Expert Decision Replay Platform**.

Every audit log entry captures:
- **WHO**: User ID, full name, and email of the actor who performed the action.
- **WHAT**: Exact event identifier drawn from `AuditActionEnum`.
- **WHICH**: Affected target entity name (`entity_type`) and its primary identifier (`entity_id`).
- **WHEN**: Precise UTC timestamp (`created_at`) when the event occurred.
- **DETAILS**: Contextual event details (`details`), human-readable descriptions (`description`), client IP address (`ip_address`), and User-Agent (`user_agent`).

---

## 2. Core Immutability & Security Architecture
- **Append-Only Immutability**:
  - The PostgreSQL database schema includes a trigger (`trg_audit_logs_immutable`) preventing `UPDATE` and `DELETE` operations on `audit_logs`.
  - The API router exposes **only read-only** endpoints (`GET /api/v1/audit-logs` and `GET /api/v1/audit-logs/{id}`). No POST, PUT, PATCH, or DELETE routes exist.
- **Strict Role-Based Access Control (RBAC)**:
  - Viewing audit logs is strictly restricted to `Administrator` and `Manager` roles.
  - Non-privileged roles (`Employee` and `Reviewer`) receive `HTTP 403 Forbidden`.
  - Unauthenticated requests receive `HTTP 401 Unauthorized`.
- **Sensitive Data Scrubbing**:
  - A centralized sanitizer recursively scrubs passwords, hashes, tokens, refresh tokens, secrets, cookies, and binary file payloads from audit details before persistence.

---

## 3. Supported Lifecycle Events (`AuditActionEnum`)

| Action Name | Target Entity | Trigger Condition |
| :--- | :--- | :--- |
| `DECISION_CREATED` | Decision | Initial creation of a decision |
| `DECISION_UPDATED` | Decision | Meaningful field changes (title, problem, context, reasoning, outcomes) |
| `DECISION_SUBMITTED` | Decision | Transition of decision from Draft to Submitted |
| `DECISION_DELETED` | Decision | Permanent deletion of a decision |
| `DECISION_APPROVED` | Decision | Reviewer/Manager approving a decision |
| `DECISION_REJECTED` | Decision | Reviewer/Manager rejecting a decision with mandatory reason |
| `ALTERNATIVE_CREATED` | Alternative | Adding an alternative option to a decision |
| `ALTERNATIVE_UPDATED` | Alternative | Editing an existing alternative option |
| `ALTERNATIVE_DELETED` | Alternative | Removing an alternative option |
| `DOCUMENT_UPLOADED` | Document | Uploading and attaching a document to a decision |
| `DOCUMENT_DELETED` | Document | Deleting a document attachment |
| `DISCUSSION_CREATED` | Discussion | Posting a new root comment on a decision |
| `DISCUSSION_REPLY_CREATED`| Discussion | Posting a reply to an existing comment |
| `DISCUSSION_UPDATED` | Discussion | Editing comment text |
| `DISCUSSION_DELETED` | Discussion | Deleting a comment |
| `VERSION_CREATED` | Decision | Automated sequential snapshot creation |
| `USER_REGISTERED` | User | New user account self-registration or provisioning |
| `USER_LOGIN` | User | Successful user authentication |
| `USER_LOGOUT` | User | User session termination |
| `NOTIFICATION_CREATED` | Notification | In-app notification creation for a recipient |
| `NOTIFICATION_READ` | Notification | Marking a single or all notifications as read |

---

## 4. API Endpoints

### 1. List Audit Logs
- **Route**: `GET /api/v1/audit-logs` (or `/audit-logs`)
- **Permissions**: `Administrator`, `Manager`
- **Query Parameters**:
  - `page` (int, default: 1): Page number
  - `page_size` (int, default: 20, max: 100): Records per page
  - `action` (string, optional): Filter by `AuditActionEnum`
  - `entity_type` (string, optional): Filter by target entity
  - `entity_id` (int, optional): Filter by target ID
  - `user_id` (int, optional): Filter by acting user ID
  - `start_date` (datetime, optional): Filter events after timestamp
  - `end_date` (datetime, optional): Filter events before timestamp
- **Response**: Paginated JSON object with items, total, page, page_size, and total pages.

### 2. Get Audit Log Details
- **Route**: `GET /api/v1/audit-logs/{audit_log_id}` (or `/audit-logs/{audit_log_id}`)
- **Permissions**: `Administrator`, `Manager`
- **Response**: Full audit entry object including parsed JSON details, client IP, and User-Agent.

---

## 5. Frontend Integration
- **Navigation**: "Audit Logs" sidebar item dynamically shown only to users with role `manager` or `administrator`.
- **Page**: `AuditLogs.jsx` at `/audit-logs` with:
  - Summary metrics: Total Events, Decisions, Approvals, Users & Auth.
  - Filter bar: Action dropdown, Entity Type dropdown, User ID input, Date range pickers, and Clear button.
  - Audit logs table: Color-coded action badges, user info, target badges, timestamps, description, and "View Details" button.
  - Details Modal: `AuditLogDetailsModal.jsx` displaying complete audit entry metadata, client IP, User-Agent, and formatted JSON details payload.

---

## 6. Verification & Test Suite
- **Dedicated Test Suite**: `tests/test_audit_logs.py` (35 test cases passing, 100% success rate).
- **Regression Suite**: All 128 tests passing across all platform modules (`tests/test_audit_logs.py`, `tests/test_notifications.py`, `tests/test_approvals.py`, `tests/test_version_tracking.py`, `tests/test_discussions.py`, `tests/test_documents.py`, `tests/test_alternatives.py`, `tests/test_decisions.py`, `tests/test_auth_login.py`, `tests/test_registration.py`).
- **Production Bundle**: `npm run build` compiled cleanly in 13.05s with 0 errors.
