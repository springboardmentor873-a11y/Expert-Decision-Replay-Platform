# Expert Decision Replay Platform

Track how decisions get made: the alternatives considered, the discussion,
the rationale, who approved it, and a full chronological replay of how it
all unfolded. FastAPI + PostgreSQL backend, React + Vite + TypeScript
frontend.

This repository was audited and repaired end-to-end. See
[`CHANGES.md`](./CHANGES.md) for exactly what was fixed and why.

---

## Prerequisites

Install these first:

- **Python 3.11+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/
- **PostgreSQL 14+** — https://www.postgresql.org/download/windows/
- **Git** (optional, only if you want version control) — https://git-scm.com/

Verify each one in PowerShell:

```powershell
python --version
node --version
psql --version
```

---

## 1. Create the PostgreSQL database

Open **pgAdmin** or run `psql` and create an empty database:

```powershell
psql -U postgres
```

Then, at the `psql` prompt:

```sql
CREATE DATABASE decision_replay;
\q
```

Remember the password you set for the `postgres` user — you'll need it in
the next step.

---

## 2. Backend setup (PowerShell)

From the project root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy the environment template and edit it:

```powershell
copy .env.example .env
notepad .env
```

Fill in `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/decision_replay
JWT_SECRET_KEY=<paste a generated secret here>
```

Generate a real secret with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Paste the output as `JWT_SECRET_KEY` in `.env`.

### Run the migration

```powershell
alembic upgrade head
```

This creates every table (`users`, `decisions`, `alternatives`, `comments`,
`discussion_threads`, `thread_replies`, `meeting_notes`,
`decision_rationales`, `activities`, `audit_logs`, `decision_versions`,
`approvals`, `teams`, `team_members`) from a single, clean migration.

### Seed demo data

```powershell
python seed_data.py
```

This is safe to run more than once — it skips any user that already
exists. It creates 8 demo accounts (see [Demo credentials](#demo-credentials)
below).

### Start the backend

```powershell
uvicorn app.main:app --reload
```

Check it's alive:

- http://localhost:8000/ → `{"name": "...", "status": "running"}`
- http://localhost:8000/health → `{"status": "ok", "database": "connected"}`
- http://localhost:8000/docs → interactive Swagger UI

---

## 3. Frontend setup (PowerShell)

Open a **second** PowerShell window (leave the backend running in the first):

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The frontend talks to the backend via `VITE_API_URL` in `frontend/.env`
(defaults to `http://localhost:8000`) — there are no hard-coded URLs
anywhere in the frontend code.

---

## 4. Run the automated tests

```powershell
.\venv\Scripts\Activate.ps1
pytest tests/ -v
```

All 55 tests use an isolated SQLite database (created and destroyed per
test) — they never touch your real `decision_replay` Postgres database.

---

## Demo credentials

| Role | Email | Password | Department |
|---|---|---|---|
| Administrator | admin@example.com | Admin@123 | IT |
| Manager | dhanya.manager@example.com | Manager@123 | IT |
| Manager | suresh.manager@example.com | Manager@123 | CAC |
| Reviewer | ramya.reviewer@example.com | Reviewer@123 | CAC |
| Reviewer | kavitha.reviewer@example.com | Reviewer@123 | IT |
| Employee | arjun.employee@example.com | Employee@123 | IT |
| Employee | priya.employee@example.com | Employee@123 | CAC |
| Employee | ravi.employee@example.com | Employee@123 | IT |

### Try the notification flow (Milestone 3)
1. Sign in as **Arjun** (Employee) → create a decision.
2. Sign in as **Dhanya** (Manager) → open the decision → **Approvals** tab →
   assign **Kavitha** as reviewer.
3. Sign in as **Kavitha** (Reviewer) → click the bell icon in the top bar —
   you'll see an unread "A decision needs your review" notification.
4. Approve the decision from the Approvals tab.
5. Sign back in as **Arjun** → the bell shows an unread
   "Your decision was approved" notification.

Try this walkthrough:
1. Sign in as **Arjun** (Employee) → create a decision → add an alternative,
   discussion thread, comment, meeting note and rationale.
2. Sign in as **Dhanya** (Manager, same IT department as Arjun) → open the
   decision → **Approvals** tab → assign **Kavitha** as reviewer.
3. Sign in as **Kavitha** (Reviewer) → open the decision → **Approve** it.
4. Back as Arjun or Dhanya → open the **Replay** tab to see the full
   chronological timeline, and the **Reports** page to download an Excel
   or PDF export.

---

## Milestone 3 — Approvals, Notifications, Audit Logging, Reports, Dashboard

All five Milestone 3 tasks are implemented and tested:

| Task | Status | Where |
|---|---|---|
| Approval workflows | ✅ Complete | `POST/GET/PATCH /approvals`, syncs `Decision.status`, enforces reviewer assignment, blocks double-approval |
| Notifications | ✅ Complete (new) | `app/models/notification.py`, `app/routers/notifications.py`, bell icon in the frontend top bar |
| Audit logging | ✅ Complete | `app/services/audit_service.py`, `GET /audit-logs` (Manager/Administrator only) |
| Reports | ✅ Complete | `app/routers/reports.py` — Excel + PDF for decisions, approvals, teams, audit |
| Dashboard | ✅ Complete | `GET /dashboard/employee\|manager\|admin`, real DB-driven metrics, `frontend/src/pages/Dashboard.tsx` |

**Outcomes verified:**
- **Approval system completed** — a decision can be submitted, assigned to
  a reviewer, and approved/rejected, with the decision's status updating
  automatically and both parties notified in real time.
- **Reports generated** — Excel and PDF exports for decisions, approvals,
  teams and the audit trail all produce real files from live data.
- **Dashboards functional** — role-specific dashboards (Employee, Manager,
  Administrator) show real counts and recent activity, no hardcoded numbers.

### Notifications — what triggers one

| Event | Notified user | Type |
|---|---|---|
| A reviewer is assigned to a decision | The reviewer | `APPROVAL_REQUESTED` |
| A decision is approved | The decision's creator | `DECISION_APPROVED` |
| A decision is rejected | The decision's creator | `DECISION_REJECTED` |
| Someone comments on your decision | The decision's creator | `COMMENT_ADDED` |
| Someone starts a discussion on your decision | The decision's creator | `DISCUSSION_STARTED` |

Notification endpoints:
- `GET /notifications` — list (newest first), `?unread_only=true` to filter.
- `GET /notifications/unread-count` — for the bell badge.
- `PATCH /notifications/{id}/read` — mark one as read.
- `PATCH /notifications/read-all` — mark everything read.
- `DELETE /notifications/{id}` — remove a notification.

All notification endpoints are scoped to the logged-in user only — you can
never read or modify another user's notifications (enforced server-side,
covered by `tests/test_notifications.py`).

---

## Milestones 1–3 completion: Documents, Teams, Escalation

A full audit against the project specification closed the remaining gaps
in Milestones 1–3. See `CHANGES.md` for the complete before/after table.
The short version — these are now real, tested features:

- **Documents** — attach files to any decision (Decision Detail →
  Documents tab, or the global **Documents** page). Drag-and-drop or
  browse; PDF/Word/Excel/PowerPoint/images/text up to 20MB.
- **Teams** — the sidebar's **Teams** page: create a team, add/remove
  members, browse by department (Manager/Administrator manage; everyone
  else can view their own department's teams).
- **Version History** — a new tab on Decision Detail listing every saved
  edit, with a two-version diff view.
- **Alternative comparison** — on the Alternatives tab, click **Compare**,
  tick two or more options, and see them side by side. Click **"Mark as
  selected"** on the option that was chosen.
- **Approval escalation** — on the Approvals tab, a Manager or
  Administrator can click **"Escalate to another reviewer"** on any
  still-pending approval to reassign it.
- **Multi-level approvals** — requesting a level-2 approval now requires
  level 1 to already be Approved.
- **Dashboard redesign** — stat cards with icons, a live donut chart of
  decisions by status, a recent-decisions table, recent activity, and a
  teams summary — all driven by real data.

### Try it
1. Sign in as **Arjun** (Employee) → create a decision → open the
   **Documents** tab → drag in a file.
2. Add two alternatives on the **Alternatives** tab → click **Compare** →
   tick both → see the side-by-side table → click **"Mark as selected"**
   on your preferred one.
3. Sign in as **Dhanya** (Manager) → **Teams** → create a team → add
   Arjun as a member.
4. On Arjun's decision → **Approvals** tab → assign **Kavitha** as
   reviewer.
5. Still as Dhanya → click **"Escalate to another reviewer"** on that
   pending approval → reassign it (note: escalating across departments
   requires an Administrator, since a Manager can only see reviewers in
   their own department).
6. Sign in as the new reviewer → **Approve** it → check the **Replay**
   tab to see the document upload and approval both in the timeline.

---

## Knowledge Graph

The sidebar's **Knowledge Graph** page visualizes how a decision connects
to its team, the people involved (and their role — creator, reviewer,
commenter, etc.), attached documents, topic tags, and its current status
— all built from real data, not a mockup.

Pick a decision from the **Focal decision** dropdown at the top to see
its graph. Hover any node to highlight just its own connections and dim
the rest. The visual design (dark card-based canvas, curved labeled
connectors, brass-glow focal node) is original to this project — see
`CHANGES.md` for the full design rationale if you're curious why it looks
the way it does.

---

## How authorization works

Every role is enforced **server-side** (never trust the frontend):

- **Employee** — sees and edits only decisions they created.
- **Reviewer** — sees decisions they created, plus any decision they've
  been assigned to review.
- **Manager** — sees every decision created by someone in their own
  department; can assign reviewers.
- **Administrator** — sees everything; manages user accounts and roles.

Decisions move `Draft → Under Review → Approved/Rejected` — the
`Approved`/`Rejected` states can **only** be reached through the approval
workflow (`POST /approvals`, `PATCH /approvals/{id}`), never by directly
editing a decision's status. This is enforced by the API, not just hidden
in the UI.

---

## Project layout

```
app/
  core/           # settings, JWT, password hashing, RBAC dependency
  db/              # SQLAlchemy engine/session/declarative base
  models/          # one SQLAlchemy model per table
  schemas/         # Pydantic request/response models
  routers/         # one FastAPI router per resource
  services/        # audit logging, activity logging, authorization,
                    # report generation (Excel/PDF)
  main.py          # app factory, CORS, health check, router wiring
alembic/
  versions/0001_initial_schema.py   # single authoritative migration
frontend/
  src/
    lib/           # typed API client + auth context
    components/    # AppLayout, ProtectedRoute, StatusBadge
    pages/         # one file per page/route
tests/             # pytest suite (55 tests), isolated SQLite per test
seed_data.py        # idempotent demo data loader
```

---

## Troubleshooting

**`alembic upgrade head` fails with a connection error**
Check `DATABASE_URL` in `.env` — confirm the password, and that
`decision_replay` exists (`psql -U postgres -l`).

**Login returns 401 for a seeded user**
Re-run `python seed_data.py` — it will tell you which users already exist
rather than erroring out.

**Frontend shows "Failed to fetch"**
Confirm the backend is running on port 8000, and that
`frontend/.env` has `VITE_API_URL=http://localhost:8000`. Also check the
backend's `ALLOWED_ORIGINS` in its own `.env` includes
`http://localhost:5173`.

**Port already in use**
```powershell
uvicorn app.main:app --reload --port 8001
```
and update `frontend/.env` to match.
