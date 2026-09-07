# Milestone 2: Decision Version Tracking Documentation

**Project Name:** Expert Decision Replay Platform  
**Feature:** Decision Version Tracking & Historical Snapshot Comparison  
**Status:** Completed  
**Version:** 0.2.4  

---

## 1. Overview & Purpose

The **Decision Version Tracking** module provides full auditability and historical replay capabilities for the Expert Decision Replay Platform. Whenever a decision is captured, modified, or submitted, an immutable snapshot is preserved in the database.

Key capabilities:
1. **Full State Capture**: Preserves complete historical decision snapshots rather than mere field deltas.
2. **Immutable History**: Historical records cannot be modified or deleted through the application service layer or API.
3. **Sequential Per-Decision Numbering**: Versions are numbered sequentially per decision (`v1, v2, v3, ...`) rather than using a shared global sequence.
4. **Deterministic Change Detection**: Automatically compares preceding and new field values on update; if no field values changed, no duplicate version is created.
5. **Human-Readable Change Summaries**: Generates concise, deterministic summaries (e.g., `"Initial decision created"`, `"Updated: reasoning"`, `"Decision submitted for review"`) without relying on external or AI dependencies.
6. **Field-Level Diffing**: Compares any two arbitrary versions belonging to the decision and returns precise differences for each tracked field.
7. **Strict RBAC & Access Inheritance**: Historical versions inherit the parent decision's visibility rules.
8. **Secure Attribution**: The author of each version (`changed_by`) is strictly derived from the authenticated JWT token (`current_user.id`), preventing client-side spoofing.

---

## 2. Database Schema & Data Model

### PostgreSQL Table: `decision_versions` (`database/schema/decision_versions_schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS decision_versions (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    context TEXT NOT NULL,
    decision_taken TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    expected_outcome TEXT,
    actual_outcome TEXT,
    status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT NOT NULL,
    CONSTRAINT fk_decision_versions_decision FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE,
    CONSTRAINT fk_decision_versions_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_decision_versions_decision_version UNIQUE (decision_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_decision_versions_decision_id ON decision_versions(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_versions_version_number ON decision_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_decision_versions_changed_by ON decision_versions(changed_by);
CREATE INDEX IF NOT EXISTS idx_decision_versions_created_at ON decision_versions(created_at);
```

### SQLAlchemy Model: `DecisionVersion` (`backend/app/models/decision_version.py`)
- `id`: Integer primary key, autoincrement
- `decision_id`: Foreign key to `decisions.id` (`ondelete="CASCADE"`)
- `version_number`: Integer, unique per `decision_id`
- `title`, `problem_statement`, `context`, `decision_taken`, `reasoning`: Snapshots of core decision fields
- `expected_outcome`, `actual_outcome`: Nullable outcome fields
- `status`: Lifecycle status snapshot
- `changed_by`: Foreign key to `users.id` (`ondelete="RESTRICT"`)
- `created_at`: UTC timestamp of snapshot creation
- `change_summary`: Deterministic summary of modifications
- Relationships:
  - `decision`: Many-to-one relationship to `Decision`
  - `changer`: Many-to-one relationship to `User`

---

## 3. Version Lifecycle & Automation

### 3.1 Initial Version Creation
When a new decision is created via `POST /decisions`:
1. The new `Decision` record is added to the database session.
2. `db.flush()` guarantees the `decision.id` primary key.
3. `create_initial_version` creates `version_number = 1` with:
   - Complete snapshot of all supplied decision attributes.
   - `changed_by = current_user.id`.
   - `change_summary = "Initial decision created"`.
4. The transaction commits both the decision and Version 1 atomically.

### 3.2 Updates & Edit Detection
When a decision is updated via `PATCH /decisions/{id}`:
1. The service records a dictionary of existing values for all tracked fields:
   `['title', 'problem_statement', 'context', 'decision_taken', 'reasoning', 'expected_outcome', 'actual_outcome', 'status']`.
2. The requested updates are applied to the `Decision` model instance.
3. `generate_change_summary` compares old values and new values.
4. If no meaningful differences exist (e.g. user re-submitted identical text), **no new version is created**.
5. If changes are detected:
   - Next sequential version number is computed (`max(version_number) + 1`).
   - A new `DecisionVersion` record is added with the complete updated snapshot.
   - `changed_by = current_user.id`.
   - `change_summary = "Updated: <field1>, <field2>"`.
   - The decision update and version snapshot are committed in a single atomic transaction.

### 3.3 Submission Flow
When a draft decision is submitted via `POST /decisions/{id}/submit`:
1. Decision transitions to `status = 'Submitted'`.
2. A new version snapshot is created with `change_summary = "Decision submitted for review"`.
3. Both status change and snapshot creation are committed together.

---

## 4. REST API Specification

All endpoints require standard Bearer JWT authentication and are mounted under `/decisions/{decision_id}/versions`:

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `GET` | `/decisions/{decision_id}/versions` | List all historical versions (newest first) | Users with access to view decision |
| `GET` | `/decisions/{decision_id}/versions/{version_id}` | Retrieve details of a specific version snapshot | Users with access to view decision |
| `GET` | `/decisions/{decision_id}/versions/{version_a}/compare/{version_b}` | Compare two versions of a decision | Users with access to view decision |

### Comparison Response Schema
```json
{
  "decision_id": 42,
  "version_a": 1,
  "version_b": 2,
  "changes": [
    {
      "field": "reasoning",
      "old_value": "AWS offers managed PostgreSQL and Elastic Kubernetes Service",
      "new_value": "AWS offers managed Aurora PostgreSQL and multi-AZ support"
    }
  ]
}
```

---

## 5. Frontend UI Implementation

Integrated directly into `DecisionDetails.jsx`:
1. **`<VersionHistory />`**:
   - Displays timeline cards for all recorded versions.
   - Live version count badge.
   - `CURRENT` badge for the active version.
   - Quick action `[Compare Latest]` button.
   - Loading, empty, and error/retry states.
2. **`<VersionHistoryItem />`**:
   - Displays version number, change summary, user attribution, and formatted timestamp.
   - `[View]` button to open the read-only snapshot modal.
   - `[Compare]` button to open the version comparison modal.
3. **`<VersionViewModal />`**:
   - Read-only historical snapshot displaying the complete state of the decision at that point in time.
   - Distinctive "Read-Only Historical Snapshot" shield banner.
   - No Edit or Delete actions available.
4. **`<VersionCompareModal />`**:
   - Interactive version selector dropdowns (Version A vs Version B).
   - Side-by-side diff columns highlighting previous and new values with color coding (red-tinted for old, green-tinted for new).
   - Clean "No differences detected" state when comparing identical versions.

---

## 6. Verification & Automated Test Coverage

The test suite in `tests/test_version_tracking.py` covers 20 dedicated test cases:
- `test_01_create_decision_creates_version_1`: Automatic creation of Version 1.
- `test_02_version_1_contains_complete_data`: Integrity of initial snapshot data.
- `test_03_version_1_has_correct_changed_by`: Author attribution from JWT context.
- `test_04_editing_decision_creates_version_2`: Snapshot creation on field update.
- `test_05_version_2_contains_complete_updated_snapshot`: Preservation of unchanged fields in new version.
- `test_06_multiple_edits_create_sequential_versions`: Strict incrementing version numbers.
- `test_07_version_numbering_is_per_decision`: Scoping of version counters per decision.
- `test_08_saving_without_changes_does_not_create_new_version`: No-op update suppression.
- `test_09_change_summary_identifies_changed_fields`: Deterministic change summaries.
- `test_10_submit_creates_version`: Version snapshot on decision submission.
- `test_11_version_history_ordered_desc`: Ordering newest first.
- `test_12_individual_version_retrieval`: Retrieval by version number and ID.
- `test_13_compare_versions_single_change`: Diffing with single modified field.
- `test_14_compare_versions_multiple_changes`: Diffing with multiple modified fields.
- `test_15_compare_versions_different_decisions_rejected`: Cross-decision comparison prevention.
- `test_16_historical_versions_are_immutable`: Verification that no edit services exist.
- `test_17_historical_versions_cannot_be_deleted`: Verification that no delete endpoints exist.
- `test_18_unauthorized_users_cannot_view_versions`: RBAC enforcement on private drafts (HTTP 403).
- `test_19_changed_by_cannot_be_spoofed`: Security verification of attribution.
- `test_20_cascade_deletion_on_decision_delete`: Automatic cascade deletion when a decision is deleted.
