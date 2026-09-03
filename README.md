# Expert Decision Replay Platform

## Milestone 1 — Database design, backend setup, and login

This covers: user/team database design, FastAPI backend with JWT auth
(register, login, refresh, logout), role-based access control, and a
working login/register page on the frontend.

---

## Quick start

### 1. Backend + database (Docker)

```bash
cp backend/.env.example backend/.env
# edit backend/.env and set a real SECRET_KEY before anything but local dev

docker compose up --build
```

This starts Postgres, Redis (ready for later milestones), and the FastAPI
backend on **http://localhost:8000**. Interactive API docs are at
**http://localhost:8000/docs**.

Run the first migration once Postgres is up:

```bash
docker compose exec backend alembic revision --autogenerate -m "initial tables"
docker compose exec backend alembic upgrade head
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** — you'll land on `/login`. Use "Create an
account" to register (new accounts start as `employee`), then sign in.
A successful login takes you to `/dashboard`.

---

## Running the backend without Docker

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # point DATABASE_URL at a Postgres instance you have running
uvicorn app.main:app --reload
```

## Running the backend test suite

```bash
cd backend
pytest -v
```

10 tests cover registration, duplicate-email handling, login (success/
failure), `/me`, token refresh, logout/revocation, and role-based access
control. These run against an in-memory SQLite database, so no live
Postgres is required to run them.

---

## What's built in this milestone

**Database (`backend/app/models/`)**
- `users` — full name, email, hashed password, role (`employee` /
  `reviewer` / `manager` / `administrator`), active flag, team
- `teams` — lightweight grouping, referenced by `users.team_id`
- `refresh_tokens` — tracks active login sessions by token id (not the
  raw token) so sessions can be revoked individually

**Backend (`backend/app/`)**
- `POST /api/v1/auth/register` — creates an account (always as `employee`
  — role upgrades go through `PATCH /api/v1/users/{id}/role`, admin-only)
- `POST /api/v1/auth/login` — returns an access token (30 min) and
  refresh token (7 days)
- `POST /api/v1/auth/refresh` — exchanges a valid refresh token for a
  new access token
- `POST /api/v1/auth/logout` — revokes a refresh token server-side
- `GET /api/v1/auth/me` — returns the logged-in user
- `GET /api/v1/users` — Manager/Administrator only
- `PATCH /api/v1/users/{id}/role` — Administrator only

**Frontend (`frontend/src/`)**
- `pages/Login`, `pages/Register`, `pages/Dashboard`
- `context/AuthContext` — holds the session, restores it from a stored
  token on page load
- `services/api.js`, `services/auth.js` — talk to the backend
- `routes/AppRoutes.jsx` + `routes/RequireAuth.jsx` — `/dashboard` is
  gated behind a valid session

## Next milestone

Approval workflow — reviewer/manager sign-off, delegation, and SLA
reminders (Stage 4 in the architecture plan).

---

## Milestone 2 — Decisions, alternatives, and attachments

Run the migration to add the new tables:

```bash
docker compose exec backend alembic revision --autogenerate -m "add decisions, alternatives, attachments"
docker compose exec backend alembic upgrade head
```

**What's new**

Database: `decisions`, `decision_versions` (a snapshot saved on every
edit), `decision_alternatives`, `attachments`.

Backend endpoints:
- `POST /api/v1/decisions`, `GET /api/v1/decisions`,
  `GET /api/v1/decisions/{id}`, `PATCH /api/v1/decisions/{id}`,
  `POST /api/v1/decisions/{id}/submit`
- `POST/PATCH/DELETE /api/v1/decisions/{id}/alternatives/...`
- `POST/GET/DELETE /api/v1/decisions/{id}/attachments/...`

Editing rule (enforced and tested): only the decision's creator, a
Manager, or an Administrator can edit it — and only while it's still a
Draft. Submitting for review locks it.

Frontend: `pages/Decisions` (list), `pages/CreateDecision` (form with
inline alternatives), `pages/DecisionDetails` (view, upload/download
files, submit for review), plus a shared `components/Navbar` used
across all logged-in pages. `Dashboard` was updated to use the new
Navbar and link to the Decisions list.

Backend test suite: 26 tests total, including a real file
upload → download byte-for-byte roundtrip.
