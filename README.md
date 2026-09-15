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

All 33 tests use an isolated SQLite database (created and destroyed per
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
tests/             # pytest suite (33 tests), isolated SQLite per test
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
