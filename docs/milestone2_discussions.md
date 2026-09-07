# Milestone 2: Decision Discussion Module Documentation

**Project Name:** Expert Decision Replay Platform  
**Feature:** Decision Discussion & Threaded Collaboration  
**Status:** Completed  
**Version:** 0.2.3  

---

## 1. Overview & Objectives

The Discussion Module enables team members, reviewers, and domain experts to collaborate directly within the context of an individual decision. It provides:
1. **Threaded Discussions**: Top-level comments and nested reply hierarchies to support structured debates and Q&A.
2. **Strict Identity Enforcement**: Comment authorship is derived securely from the authenticated JWT token (`current_user.id`), never accepted from the frontend request payload.
3. **Role-Based Governance & Permissions**:
   - Only the original author can edit their comment.
   - Comments can be deleted by the author or moderated by an `Administrator`.
   - Access to discussions strictly respects the parent decision's visibility rules (e.g. private draft decisions cannot be viewed or commented on by unauthorized users).
4. **Validation**: Non-empty, non-whitespace content with a 2,000 character maximum limit.
5. **Cascade Integrity**: When a decision or parent comment is deleted, all related comments and child replies are automatically removed from the database with foreign key cascade constraints.

---

## 2. Database Schema & Data Model

### PostgreSQL Table: `discussions`

```sql
CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    decision_id INTEGER NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discussions_decision_id ON discussions(decision_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);
```

### SQLAlchemy Model: `Discussion` (`backend/app/models/discussion.py`)
- `id`: Integer primary key.
- `decision_id`: Foreign key to `decisions.id` (`ondelete="CASCADE"`).
- `user_id`: Foreign key to `users.id` (`ondelete="CASCADE"`).
- `parent_id`: Self-referential foreign key to `discussions.id` (`ondelete="CASCADE"`).
- `content`: Text comment body.
- `created_at` / `updated_at`: UTC timestamps.
- `decision`: Relationship to parent `Decision`.
- `user`: Relationship to author `User`.
- `parent`: Self-referential relationship to parent `Discussion`.
- `replies`: Relationship to child replies with `cascade="all, delete-orphan"`, ordered chronologically.

---

## 3. REST API Specification

All endpoints are scoped under `/decisions/{decision_id}/discussions` and require a valid Bearer JWT in the `Authorization` header.

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `POST` | `/decisions/{decision_id}/discussions` | Post a new top-level comment | Users with access to the decision |
| `GET` | `/decisions/{decision_id}/discussions` | List all top-level comments and nested replies | Users with access to the decision |
| `GET` | `/decisions/{decision_id}/discussions/{id}` | Get comment details | Users with access to the decision |
| `PATCH` | `/decisions/{decision_id}/discussions/{id}` | Update own comment content | Original comment author only |
| `DELETE` | `/decisions/{decision_id}/discussions/{id}` | Delete comment & child replies | Author or Administrator |
| `POST` | `/decisions/{decision_id}/discussions/{id}/replies` | Reply to an existing comment | Users with access to the decision |

### Request & Response Schemas

#### POST /decisions/{decision_id}/discussions
```json
{
  "content": "What was the estimated operational cost for Option B?"
}
```

#### Response (201 Created / 200 OK)
```json
{
  "id": 14,
  "decision_id": 3,
  "user_id": 2,
  "parent_id": null,
  "content": "What was the estimated operational cost for Option B?",
  "created_at": "2026-09-04T11:20:00Z",
  "updated_at": "2026-09-04T11:20:00Z",
  "user": {
    "id": 2,
    "full_name": "Sarah Chen",
    "email": "sarah.chen@enterprise.io",
    "role": "Reviewer"
  },
  "replies": [
    {
      "id": 15,
      "decision_id": 3,
      "user_id": 1,
      "parent_id": 14,
      "content": "Option B requires approximately $12,000/month including cross-region egress.",
      "created_at": "2026-09-04T11:22:30Z",
      "updated_at": "2026-09-04T11:22:30Z",
      "user": {
        "id": 1,
        "full_name": "Alex Mercer",
        "email": "alex.mercer@enterprise.io",
        "role": "Employee"
      },
      "replies": []
    }
  ]
}
```

---

## 4. Frontend UI Implementation

The Discussion UI seamlessly integrates into `DecisionDetails.jsx` following the enterprise blue-and-white SaaS design system:
- **`<DiscussionSection />`**:
  - Displays the total comment count header.
  - Hosts the main comment composer.
  - Lists top-level comments and nested replies.
  - Provides a clean empty state when no discussions exist.
- **`<DiscussionComposer />`**:
  - Textarea with auto-expansion and character counter (e.g., `245 / 2000`).
  - Supports `Ctrl + Enter` (or `Cmd + Enter`) keyboard shortcut for submission.
  - Cancel button for replies and inline edits.
- **`<DiscussionItem />`**:
  - Displays user initials avatar with role-colored styling.
  - Shows author name, role badge, and human-readable timestamp (e.g. "Just now", "10m ago", "2h ago", "Mar 4, 2026").
  - Displays `(edited)` indicator when `updated_at > created_at`.
  - Conditional action buttons:
    - **Reply**: Available to all authorized participants.
    - **Edit**: Visible only to the comment author.
    - **Delete**: Visible to the comment author and Administrators.
  - Thread indentation with soft vertical guide borders for clean visual nesting.
  - Inline editing and inline replying without page reloads.

---

## 5. Verification & Automated Test Coverage

The module is verified via an automated test suite in `tests/test_discussions.py` with 16 test cases:
1. `test_01_create_comment_authenticated`: Verifies authenticated user can post a comment to an accessible decision.
2. `test_02_empty_comment_rejected`: Verifies empty comment content is rejected by Pydantic schema and service layer.
3. `test_03_whitespace_only_comment_rejected`: Verifies whitespace-only comment is rejected with HTTP 400.
4. `test_04_max_length_validation`: Verifies comment exceeding 2000 characters is rejected.
5. `test_05_list_discussions_tree`: Verifies retrieval of hierarchical comments and nested replies.
6. `test_06_create_threaded_reply`: Verifies creation of threaded child replies linked to parent comments.
7. `test_07_invalid_parent_id_rejected`: Verifies 404 Not Found when replying to a non-existent parent comment.
8. `test_08_parent_different_decision_rejected`: Verifies 404 when replying across different decisions.
9. `test_09_author_can_edit_comment`: Verifies comment author can update their comment content.
10. `test_10_non_author_cannot_edit_comment`: Verifies non-author cannot edit another user's comment (403 Forbidden).
11. `test_11_author_can_delete_comment`: Verifies author can delete their comment.
12. `test_12_non_author_non_admin_cannot_delete`: Verifies non-author non-admin cannot delete another user's comment (403 Forbidden).
13. `test_13_admin_can_delete_any_comment`: Verifies Administrator can delete any comment for moderation.
14. `test_14_unauthorized_user_cannot_access_draft_discussions`: Verifies unauthorized user cannot view or post comments on a private draft decision.
15. `test_15_cascade_deletion_on_decision_delete`: Verifies all comments and replies are deleted when a decision is deleted.
16. `test_16_cascade_deletion_on_parent_comment_delete`: Verifies child replies are deleted when parent comment is deleted.
