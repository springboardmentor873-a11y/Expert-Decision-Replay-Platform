# Backend — Expert Decision Replay Platform

FastAPI backend for Milestones 1, 2 and 3.

## Milestone 3 APIs

- `GET /approvals` — approval queue
- `GET /approvals/reviewers` — reviewer candidates (Manager/Administrator)
- `POST /decisions/{id}/submit` — submit a decision for review
- `POST /decisions/{id}/assign-reviewer` — assign a reviewer
- `POST /approvals/{id}/review` — approve/reject an assigned approval
- `GET /decisions/{id}/approvals` — approval assignments for a decision
- `GET /decisions/{id}/approval-history` — approval history
- `GET /notifications` — current user's notifications
- `PATCH /notifications/{id}/read` — mark notification as read
- `POST /notifications/read-all` — mark all notifications read
- `GET /audit-logs` — Manager/Administrator audit logs
- `GET /dashboard/summary` — role-aware dashboard statistics/activity
- `GET /reports/{kind}` — live report data
- `GET /reports/{kind}/export?format=pdf|excel` — report export

## Start

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger: `http://127.0.0.1:8000/docs`
