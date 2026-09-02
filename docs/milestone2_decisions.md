# Milestone 2: Decision Capture & Decision Management Documentation

**Project Name:** Expert Decision Replay Platform  
**Milestone:** Milestone 2 - Decision Capture and Decision Management  
**Status:** Completed  
**Version:** 0.2.0  

---

## 1. Overview & Objectives

Milestone 2 establishes the first core business capability of the Expert Decision Replay Platform: **Decision Capture and Decision Management**.

This milestone allows authenticated enterprise users across all roles (`Employee`, `Reviewer`, `Manager`, `Administrator`) to:
1. Document expert decisions with structured rationale (Problem Statement, Background Context & Constraints, Decision Taken, Reasoning & Trade-offs, Expected Outcomes, and Actual Outcomes).
2. Manage decisions through a controlled status lifecycle (`Draft` → `Submitted` → `Under Review` → `Approved` / `Rejected`).
3. View and filter accessible decisions with keyword search.
4. Restrict modification and deletion based on decision status and ownership.
5. Enforce strict authentication and role-based access control.

---

## 2. Decision Data Model

### Table: `decisions`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique decision identifier |
| `title` | `VARCHAR(255)` | `NOT NULL`, Indexed | Concise title of the decision |
| `problem_statement` | `TEXT` | `NOT NULL` | The core challenge or problem being solved |
| `context` | `TEXT` | `NOT NULL` | Technical, business, and environmental constraints |
| `decision_taken` | `TEXT` | `NOT NULL` | The concrete chosen path or action |
| `reasoning` | `TEXT` | `NOT NULL` | Justification, trade-off analysis, and alternatives rejected |
| `expected_outcome` | `TEXT` | Nullable | Anticipated metrics, benchmarks, or success criteria |
| `actual_outcome` | `TEXT` | Nullable | Observed post-implementation results |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `'Draft'`, Indexed | Decision lifecycle status |
| `created_by` | `INTEGER` | `NOT NULL`, FK `users.id` (`ON DELETE RESTRICT`), Indexed | Creator user ID derived from JWT token |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Initial creation timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, Default `CURRENT_TIMESTAMP` | Last updated timestamp |

---

## 3. Decision Status Lifecycle

```text
    +-------------------------------------------------------------+
    |                                                             |
    |   [ Draft ]  (Created by user; editable and deletable)      |
    |       |                                                     |
    |       v (POST /decisions/{id}/submit)                       |
    |   [ Submitted ]  (Locked for initial review)                |
    |       |                                                     |
    |       v (Future Review Module)                              |
    |   [ Under Review ] (Reviewers analyzing alternatives)       |
    |       |                                                     |
    |       +--------------------+-------------------+            |
    |                            |                   |            |
    |                            v                   v            |
    |                      [ Approved ]        [ Rejected ]       |
    |                                                             |
    +-------------------------------------------------------------+
```

---

## 4. API Endpoints

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/decisions`<br>`/api/v1/decisions` | Authenticated | Create a new decision (starts in `Draft`) |
| `GET` | `/decisions`<br>`/api/v1/decisions` | Authenticated | List accessible decisions (supports `?status=...`) |
| `GET` | `/decisions/{id}`<br>`/api/v1/decisions/{id}` | Authenticated | Retrieve a single decision by ID |
| `PATCH` | `/decisions/{id}`<br>`/api/v1/decisions/{id}` | Owner or Admin | Update decision fields |
| `POST` | `/decisions/{id}/submit`<br>`/api/v1/decisions/{id}/submit` | Owner or Admin | Submit draft decision for evaluation |
| `DELETE` | `/decisions/{id}`<br>`/api/v1/decisions/{id}` | Owner (Draft only) or Admin | Delete decision |

---

## 5. Security & Access Control Rules

1. **Creator Derivation**: `created_by` is never accepted in request bodies; it is strictly resolved from the authenticated JWT token `sub` claim.
2. **Access Isolation**: Standard Employees can only view, edit, and delete their own draft decisions.
3. **Immutability of Submitted Decisions**: Standard users cannot modify core text fields (`title`, `problem_statement`, `context`, `decision_taken`, `reasoning`) once a decision has been submitted.
4. **Administrative Governance**: Administrators have system-wide visibility to inspect, override status, and manage all decisions.