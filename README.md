# Expert Decision Replay Platform

A workspace for capturing how decisions get made, replaying the reasoning behind
them, and routing them through a manager approval workflow.

- **Frontend** — React 18 + Vite, served in production by nginx
- **Backend** — FastAPI + SQLAlchemy 2 on PostgreSQL 16
- **Auth** — signed bearer tokens (HS256 JWT) and PBKDF2-HMAC-SHA256 passwords

---

## Quick start

```bash
cp .env.example .env
# set JWT_SECRET and BOOTSTRAP_MANAGER_* (see "Required configuration")
docker compose up --build -d
```

| Service | URL |
| --- | --- |
| App | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

---

## Required configuration

Two settings must be provided before the stack is usable.

### `JWT_SECRET`

Identity is a signed token, so this secret is what makes a session trustworthy.
Every user, including administrators, can read anything encrypted with it.

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

With `APP_ENV=production` the API **refuses to start** if `JWT_SECRET` is
missing or shorter than 32 characters. Rotating it invalidates every session,
which is the intended behaviour for a suspected leak.

### `BOOTSTRAP_MANAGER_EMAIL` / `BOOTSTRAP_MANAGER_PASSWORD`

Self-service registration always creates an **employee**. Nobody can grant
themselves manager access by picking an option in a signup form, so a
deployment needs one operator-provisioned manager:

- account does not exist → created as a manager (only when no manager exists yet)
- account exists → promoted to manager

After the first boot, managers promote others through **Teams → member → role**
or `PUT /api/users/{id}/role`.

---

## Roles and permissions

| Capability | Employee | Manager |
| --- | --- | --- |
| Create and edit own decisions | yes | no |
| Submit own decisions for approval | yes | no |
| Comment, upload documents on own decisions | yes | yes |
| See the approval queue | own requests only | whole organization |
| Approve / reject requests | no | yes |
| Complete a decision with an outcome | no | yes |
| Delete a decision | no | yes |
| View `/teams`, promote users | no | yes |
| Analytics and audit log scope | own records | organization-wide |

Non-managers see the approvals screen as **My Requests**, a read-only view of
the submissions they made.

### Authentication

- `POST /api/login` returns a short-lived `access_token`; the browser sends it as
  `Authorization: Bearer <token>`.
- Identity is **never** taken from a query parameter or request body. Passing
  `?user_id=<someone else>` has no effect — the API trusts the token signature
  and re-reads the user on every request, so role changes and deletions apply
  immediately.
- Tokens default to 8 hours (`JWT_TTL_MINUTES`).
- Passwords are stored as PBKDF2-HMAC-SHA256 (390k iterations). Accounts created
  before hashing was introduced are transparently upgraded on first login.

---

## Feature walkthrough

1. Sign in, then **New Decision** with a title, category, problem and reasoning.
2. Add **alternatives** and pros/cons on the decision's Alternatives tab.
3. Add **discussion** entries; tick *Mark as meeting note* for meeting records.
4. **Upload** supporting documents (25 MB default, `MAX_UPLOAD_BYTES`).
5. **Submit for Approval** — the decision moves to *Under Review*.
6. A manager reviews it under **Approvals → Pending** and approves or rejects
   with a reason. The requester sees the outcome under **My Requests**.
7. **Edit**, **complete with an outcome**, and keep the full history for replay.

Managers additionally have **Teams**, **Analytics** (status mix, category
breakdown, resource totals) and **Audit Logs**.

### Knowledge graph

The graph is built client-side from the caller's accessible decisions,
documents, discussions and team members, linking decisions to the people,
teams, documents, topics and workflow status involved. Filter by node type and
zoom or reset the view. No data crosses the access boundary of the signed-in
user.

---

## Tests

The suites run against the live stack, so start it first.

```bash
# API: 151 checks
python tests/api-e2e.py

# Run it through nginx instead of the backend origin
API_BASE=http://localhost:5173/api python tests/api-e2e.py

# Browser: 56 checks (needs Playwright on NODE_PATH)
set NODE_PATH=C:\Users\hp\.agents\skills\playwright\node_modules
node tests/ui-e2e.mjs
```

The API suite covers registration and login, token rejection (forged, missing,
wrong scheme), role promotion and its guards, the full decision lifecycle,
alternatives, reviews, outcomes, discussions, document upload and download,
the approval workflow, notifications, analytics, audit scoping, delete
cascade with audit preservation, SQL-injection attempts, and nginx proxying.

The browser suite walks employee and manager journeys, role-based navigation and
route guards, the approval round trip, uploads, theming, notifications, logout,
deep links, mobile viewport, and fails on any unexpected console error or
non-2xx API response.

---

## Local port conflicts

Native tooling on a development machine can silently shadow the ports Docker
publishes. A host or WSL process bound to `127.0.0.1` wins over the Docker
proxy, so the container looks broken while it is actually healthy:

```powershell
# see who really owns a port
Get-NetTCPConnection -LocalPort 5432 -State Listen |
  Select-Object LocalAddress, OwningProcess
```

**Use `localhost`, not `127.0.0.1`.** Both reach the same container, but
`127.0.0.1` is the address that other local software tends to claim.

If a local PostgreSQL already owns 5432, publish the containerised one
elsewhere:

```env
POSTGRES_PORT=5433
```

Running the API on the host instead of in Docker needs the matching URL, and a
free port of its own:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5433/decision_platform"
uvicorn main:app --reload --port 8001
```

An unreachable database now fails fast with the URL it tried and a hint, rather
than retrying for the whole timeout.

---

## Operational notes

- **Persistence** — `postgres_data` and `uploads_data` are named volumes. Use
  `docker compose down` (not `-v`) to keep them.
- **Schema** — tables are created with `create_all` on startup. This creates
  missing tables but does not migrate existing ones; add Alembic before the
  first column change on a live database.
- **Uploads** — filenames are sanitized and stored under a unique generated
  name, restricted by extension allowlist and size limit. Only authenticated
  users with access to the parent decision can download them.
- **CORS** — not needed in Docker, because nginx proxies `/api` on the same
  origin. Set `CORS_ORIGINS` only for `npm run dev`.
- **Uvicorn** — runs single-process. Scale with
  `docker compose up --scale backend=N` behind a load balancer.

### Before going live

- [ ] `APP_ENV=production`
- [ ] Fresh `JWT_SECRET` (≥ 32 chars) and strong `POSTGRES_PASSWORD`
- [ ] `SEED_DEMO_USERS=false`, `ALLOW_ROLE_ESCALATION_ON_REGISTER=false`
- [ ] `CORS_ORIGINS` narrowed to the real frontend origin
- [ ] TLS terminated in front of nginx; remove the published database port
      (`POSTGRES_PORT`) if the database need not be reachable from outside
- [ ] Rotate any credential that has appeared in `.env` or a commit — including
      unrelated API keys stored there
- [ ] Automated database backups for `postgres_data`