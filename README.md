<<<<<<< HEAD
# py-1
=======
# Decision Replay Platform — Milestone 1

Milestone 1 delivers a production-quality Authentication, User Management,
Role-Based Access Control, Team Management and Audit Log foundation for the
Decision Replay Platform, built end-to-end (React → FastAPI → PostgreSQL)
with no mocked functionality.

Future milestones extend this foundation with Decisions, Evidence, Reviews,
Approvals and Replay — see "Next milestone" at the bottom.

---

## 1. Project overview

The Decision Replay Platform lets organizations document decisions,
alternatives, approvals, discussions and outcomes, and later reconstruct
("replay") how and why a decision was made from its historical data,
participants, evidence, reviews and audit trail.

Milestone 1 scope: everything needed to securely identify who's using the
system, what they're allowed to do, and which teams they belong to — plus
an audit log that later milestones extend to decision-level events.

## 2. Architecture

```
React (Vite) ──HTTP/JSON──▶ FastAPI ──SQLAlchemy──▶ PostgreSQL
     │                          │
     └── JWT access/refresh ────┘  (stateless auth, role in DB is source of truth)
```

- The frontend never trusts client-side role checks for security — every
  privileged backend endpoint independently re-checks the caller's role via
  `require_roles()`.
- Refresh reloads the user from the database rather than trusting the role
  embedded in the old token, so a role change or deactivation takes effect
  immediately on next refresh.
- Schema is owned by Alembic migrations, not `Base.metadata.create_all()`.

## 3. Technology stack

**Frontend:** React, Vite, React Router, Axios, plain CSS (enterprise theme).
**Backend:** FastAPI, Pydantic, SQLAlchemy, PostgreSQL, Alembic, JWT (python-jose), bcrypt (passlib).
**Infra:** Docker, Docker Compose (Postgres + backend + optional frontend service).
**Testing:** pytest + FastAPI TestClient/httpx.

## 4. Folder structure

```
decision-replay-platform/
├── backend/
│   ├── app/
│   │   ├── routers/        auth.py, users.py, teams.py, audit.py
│   │   ├── models.py       User, Team, team_members, AuditLog
│   │   ├── schemas.py      Pydantic request/response models
│   │   ├── auth.py         hashing, JWT issuance/verification
│   │   ├── dependencies.py get_current_user, require_roles()
│   │   ├── database.py     engine/session
│   │   ├── config.py       env-driven settings
│   │   ├── utils.py        client-IP extraction for audit logging
│   │   └── main.py         app wiring, CORS, /health
│   ├── alembic/             migration environment + versions/
│   ├── scripts/
│   │   ├── seed_admin.py            bootstrap the first Administrator
│   │   └── docker-entrypoint.sh     wait-for-db → migrate → run
│   ├── tests/                test_auth.py, test_users.py, test_teams.py,
│   │                          test_rbac_and_audit.py, test_end_to_end.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/axios.js              base client + 401 refresh-and-retry-once
│   │   ├── services/                 authService, userService, teamService, auditService
│   │   ├── context/AuthContext.jsx   session state
│   │   ├── layouts/AppLayout.jsx     sidebar + topbar shell
│   │   ├── components/               ProtectedRoute, RoleRoute, StatusBadge,
│   │   │                              LoadingState, EmptyState, ErrorState,
│   │   │                              ConfirmDialog, Toast
│   │   ├── pages/                    Login, Register, Dashboard, Profile,
│   │   │                              Users, Teams, Audit
│   │   └── hooks/useToast.js
│   ├── nginx/nginx.conf       SPA routing for the production container
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 5. Environment setup

```bash
cd decision-replay-platform
cp backend/.env.example backend/.env      # change SECRET_KEY and SEED_ADMIN_PASSWORD
cp frontend/.env.example frontend/.env
```

Never commit real `.env` files — `.gitignore` already excludes them.

## 6. Database setup & migrations

The schema is managed entirely by Alembic; `Base.metadata.create_all()` is
never used outside of tests.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

To add a future migration once models change:
```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## 7. Running with Docker (recommended)

```bash
docker compose up --build
```

This starts:
- `db` — PostgreSQL 16, with a healthcheck the backend waits on
- `backend` — waits for Postgres, runs `alembic upgrade head`, then serves the API on `:8000`
- `frontend` (optional) — production nginx build on `:5173`; enable with `--profile full`:
  ```bash
  docker compose --profile full up --build
  ```

Then seed the first administrator (one-off, inside the running container):
```bash
docker compose exec backend python -m scripts.seed_admin
```

## 8. Backend commands (without Docker)

```bash
cd backend
uvicorn app.main:app --reload            # http://localhost:8000
python -m scripts.seed_admin             # bootstrap an Administrator
pytest -v                                # run the full test suite
```

## 9. Frontend commands

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build       # production build → dist/
```

## 10. API documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Liveness + DB check: `GET /health` (also aliased at `GET /api/health`)

### Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public (valid refresh token) |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/users/me` | Authenticated |
| PUT | `/api/users/me` | Authenticated |
| GET | `/api/users` | Manager, Administrator |
| GET | `/api/users/{id}` | Manager, Administrator |
| PATCH | `/api/users/{id}/role` | Administrator |
| PATCH | `/api/users/{id}/deactivate` | Administrator |
| PATCH | `/api/users/{id}/activate` | Administrator |
| POST | `/api/teams` | Manager, Administrator |
| GET | `/api/teams` | Authenticated |
| GET | `/api/teams/{id}` | Authenticated |
| POST | `/api/teams/{id}/members` | Manager, Administrator |
| DELETE | `/api/teams/{id}/members/{user_id}` | Manager, Administrator |
| GET | `/api/audit` | Administrator |
| GET | `/health`, `/api/health` | Public |

## 11. Authentication

JWT access tokens (default 60 min) and refresh tokens (default 7 days), each
carrying `sub` (user id), `role`, `type` (`access`/`refresh`) and `exp`.
`/api/auth/refresh` always reloads the user from the database, so a role
change or deactivation takes effect the next time the client refreshes —
never trust the role embedded in an old token. Passwords are hashed with
bcrypt via passlib; hashes are never returned by any endpoint.

## 12. Roles and permissions

| Capability | Employee | Reviewer | Manager | Administrator |
|---|---|---|---|---|
| View/edit own profile | ✅ | ✅ | ✅ | ✅ |
| View any team | ✅ | ✅ | ✅ | ✅ |
| List/view other users | ❌ | ❌ | ✅ | ✅ |
| Create teams / manage membership | ❌ | ❌ | ✅ | ✅ |
| Change a user's role | ❌ | ❌ | ❌ | ✅ |
| Activate/deactivate a user | ❌ | ❌ | ❌ | ✅ |
| View the audit log | ❌ | ❌ | ❌ | ✅ |

The frontend hides nav items and controls a user's role can't use, but this
is a UX convenience only — every action above is independently enforced on
the backend by `require_roles()`.

## 13. Testing

```bash
cd backend
pytest -v
```

- `test_auth.py` — registration (incl. duplicate/short-password rejection,
  email normalization), login (incl. wrong password, inactive account),
  refresh (incl. wrong token type, role-change respected), logout.
- `test_users.py` — profile read/update (and that role/is_active can't be
  self-escalated), admin listing/filtering, role changes, activation/
  deactivation, self-deactivation guard, 404s.
- `test_teams.py` — creation (incl. duplicate name), listing, membership
  add/remove (incl. duplicate add and removing a non-member safely),
  inactive-user guard.
- `test_rbac_and_audit.py` — every role against admin-only endpoints,
  audit log access and content.
- `test_end_to_end.py` — the full acceptance-criteria journey in one run
  (register → duplicate rejected → login → 403 on admin route → promote →
  team lifecycle → deactivate → blocked login → audit verification).

All tests run against an isolated in-memory SQLite database via FastAPI
dependency overrides — they never touch a real Postgres instance.

## 14. Security notes

- Passwords hashed with bcrypt (never logged, never returned by the API).
- CORS origins come from `ALLOWED_ORIGINS` (comma-separated) — never a
  wildcard with credentials.
- JWT `SECRET_KEY` must be overridden in `backend/.env` before any real use.
- Every mutating/privileged endpoint re-validates the role server-side.
- `UserUpdate` deliberately excludes `role`/`is_active`/password fields, so
  self-service profile edits can never escalate privilege.
- An Administrator cannot deactivate their own account (prevents accidental
  admin lockout).
- Security-sensitive events (registration, login, logout, role changes,
  deactivation/activation, team creation/membership changes) are recorded
  in `audit_logs` with actor, action, details, IP address and timestamp.

## 15. Known limitations (Milestone 1 scope)

- JWTs are stateless — logout records an audit event but does not revoke
  the token before its natural expiry (acceptable for Milestone 1; a
  token-blocklist can be added later without changing the API contract).
- No physical deletion of users/teams — administrators deactivate rather
  than delete, per the spec.
- Audit log pagination is offset/limit based (fine at this data volume);
  cursor-based pagination can be introduced later if needed.
- Decision/Evidence/Review/Approval/Replay entities don't exist yet —
  intentionally out of scope for Milestone 1.

## 16. Next milestone

The schema and API are structured so the following extend cleanly without
touching Milestone 1 code:

- **Decisions**: a new `decisions` table (creator, team, status, rationale,
  timestamps) with its own router, following the same
  `schemas.py`/`routers/`/`require_roles()` pattern.
- **Evidence**: attachments/links tied to a decision via foreign key.
- **Reviews** and **Approvals**: each their own table referencing a
  decision and a `User` (reviewer/approver), with status/comments/timestamp
  — mirroring the `Team`/`team_members` relationship pattern already in place.
- **Audit & Compliance**: `AuditLog.action` already accepts arbitrary
  action strings, so decision-level events (`decision_created`,
  `review_completed`, `approval_granted`, etc.) plug directly into the
  existing table and `/api/audit` endpoint — no schema change required.
- **Replay**: a read-only endpoint that joins Decision → Evidence →
  Participants → Reviews → Approvals → AuditLog by decision id to
  reconstruct the full history, once those tables exist.
>>>>>>> bba8c04 (Initial project setup)
