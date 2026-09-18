# Milestone 3 — Approval Workflows Documentation

## 1. Overview

**Milestone 3 — Approval Workflows** introduces a multi-tier governance, review, and authorization engine to the Expert Decision Replay Platform. It allows organizations to enforce structured accountability for key operational, strategic, and architecture decisions.

### Lifecycle Transition Model
```
+-----------------------------------------------------------------------------------------------------+
|                                      DECISION LIFECYCLE                                             |
|                                                                                                     |
|  [ Draft ]  --------( Submit for Review )-------->  [ Submitted / Under Review ]                   |
|                                                              |                                      |
|                                     +------------------------+-----------------------+              |
|                                     |                                                |              |
|                             ( Approve )                                          ( Reject )         |
|                                     |                                                |              |
|                                     v                                                v              |
|                               [ Approved ]                                     [ Rejected ]         |
|                          (Finalized / Executable)                   (Requires Justification / Reason)
+-----------------------------------------------------------------------------------------------------+
```

---

## 2. Key Capabilities & Rules

1. **Role-Based Review Authority**:
   - Only users with roles **`Reviewer`**, **`Manager`**, or **`Administrator`** are permitted to review decisions or access the pending review inbox.
   - **`Employee`** users cannot view the pending approval queue or review decisions (HTTP 403 Forbidden).

2. **Self-Review Prohibition**:
   - The creator / author of a decision (`created_by`) is strictly prohibited from approving or rejecting their own decision (HTTP 403 Forbidden).
   - This ensures separation of duties and dual-control compliance.

3. **Status Validation**:
   - Only decisions with status `Submitted` or `Under Review` can be approved or rejected.
   - Decisions in `Draft`, `Approved`, or `Rejected` states cannot be reviewed (HTTP 400 Bad Request).

4. **Mandatory Rejection Justification**:
   - Any rejection action strictly requires a non-empty `rejection_reason` (maximum 2,000 characters).

5. **Dual Audit & Version Tracking Snapshots**:
   - Every approval and rejection action creates an immutable `Approval` audit record capturing:
     - `decision_id`
     - `reviewer_id`
     - `action` (`APPROVED` or `REJECTED`)
     - `previous_status`
     - `new_status`
     - `rejection_reason`
     - `comment`
     - `created_at` (UTC)
   - Every approval and rejection action automatically creates a Version snapshot in the **Version Tracking** module with change summary `"Decision approved"` or `"Decision rejected"`.

---

## 3. Database Schema

### Table: `approvals`
```sql
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_decision_id ON approvals(decision_id);
CREATE INDEX IF NOT EXISTS idx_approvals_reviewer_id ON approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);
```

---

## 4. API Endpoints

| Method | Endpoint | Description | Allowed Roles |
|---|---|---|---|
| `GET` | `/api/v1/approvals/pending` | List all decisions awaiting review (`Submitted` or `Under Review`) | Reviewer, Manager, Admin |
| `POST` | `/api/v1/decisions/{id}/approve` | Approve a submitted decision | Reviewer, Manager, Admin (non-creator) |
| `POST` | `/api/v1/decisions/{id}/reject` | Reject a submitted decision with reason | Reviewer, Manager, Admin (non-creator) |
| `GET` | `/api/v1/decisions/{id}/approvals` | Retrieve audit history of approval/rejection events | Decision viewers |

---

## 5. Frontend User Interface

1. **`ApprovalActions.jsx`**:
   - Modern enterprise banner displayed at the top of reviewable decisions.
   - Visible to authorized reviewers (`Reviewer`, `Manager`, `Administrator`) when the viewer is not the decision author.
   - Interactive modals for both **Approve** (confirmation + optional comment) and **Reject** (mandatory rejection reason + optional comment).

2. **`ApprovalHistory.jsx`**:
   - Chronological audit trail card on the Decision Details page.
   - Displays reviewer details, timestamps, previous vs new statuses, and rejection reasons.

3. **`PendingApprovals.jsx` (`/approvals/pending`)**:
   - Dedicated workflow management queue displaying cards for all pending decisions requiring sign-off.
   - Includes quick-action navigation directly to the review workspace.

4. **Navigation Integration (`Sidebar.jsx`)**:
   - Dynamically adds the **"Pending Approvals"** menu link in the sidebar for `Reviewer`, `Manager`, and `Administrator` roles.

---

## 6. Test Suite & Verification Results

All unit and integration test suites executed successfully:
- **`tests/test_approvals.py`**: 17 tests passed (100%).
- **Full Project Regression (`108 tests`)**:
  - `test_approvals.py` (17 tests)
  - `test_version_tracking.py` (14 tests)
  - `test_discussions.py` (12 tests)
  - `test_documents.py` (15 tests)
  - `test_alternatives.py` (10 tests)
  - `test_decisions.py` (10 tests)
  - `test_auth_login.py` (12 tests)
  - `test_registration.py` (10 tests)
  - `test_milestone1_e2e.py` (8 tests)
- **Frontend Build (`npm run build`)**: 0 errors, production bundle compiled cleanly in 9.60s.
