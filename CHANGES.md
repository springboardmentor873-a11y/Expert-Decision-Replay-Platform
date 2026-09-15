# What was fixed — full audit trail

This document records every change made while turning the repository into
a working, tested, end-to-end application. Every fix below was verified by
actually running the code, not just reading it.

## Security fixes

- **Deleted `app/utils/security.py`** — a duplicate JWT/password
  implementation with a **hardcoded secret key** committed to source. It
  was not wired into `main.py`, so it was never live, but it was a serious
  latent risk (anyone importing it would get a token any attacker could
  forge from the public source). All JWT/password logic now lives in one
  place: `app/core/security.py`, which reads its secret from the
  environment.
- **Deleted `app/utils/jwt.py`, `app/utils/password.py`,
  `app/utils/audit_logger.py`, `app/utils/activity_logger.py`** — dead
  duplicate implementations, unused by any live route.
- **Deleted `app/routers/test_endpoints.py`** — an unauthenticated debug
  router, unused by `main.py`, that exposed internals.
- **Added row-level authorization** (`app/services/authorization.py`).
  Previously any authenticated user could read any decision by ID, no
  matter who created it. Now: Employees see only their own decisions,
  Reviewers see decisions they created or are assigned to review,
  Managers see their department, Administrators see everything. Applied
  consistently across decisions, alternatives, discussions, comments,
  meeting notes and rationale endpoints.
- **Restricted audit log reads** to Manager (own department) and
  Administrator (previously any authenticated user could read the entire
  audit trail).
- **Split role changes from profile updates** (`PATCH /users/{id}/role`
  vs `PUT /users/{id}`) so a user can never grant themselves a higher
  role by editing their own profile.
- **CORS locked to configured origins** — `main.py` had no CORS
  middleware at all; added it, reading from `ALLOWED_ORIGINS` in `.env`
  (never `"*"`).

## Correctness fixes

- **`seed_data.py` was broken.** It used `password_hash=` and `phone=`
  keyword arguments while the `User` model defines `password` and
  `phone_number` — every insert would have raised `TypeError` immediately.
  It also imported the insecure duplicate `hash_password`. Rewrote it to
  use the correct field names, the real security module, and made it
  properly idempotent (verified: second run reports "0 inserted, 8
  skipped").
- **Alembic migration history was unusable.** 34 migration files existed
  with multiple independent starting points ("multiple heads") — the
  master requirement `alembic upgrade head` would fail outright on a
  fresh database. Replaced with a single authoritative migration,
  `0001_initial_schema.py`, generated to match the final models exactly.
  **Verified**: ran `alembic upgrade head` against a real database in
  this session — it applies cleanly with zero errors.
- **`requirements.txt` was a ~300-package environment dump** (UTF-16
  encoded, containing Django, Flask, Celery, Azure SDKs, Google Cloud
  libraries — nothing to do with this FastAPI project). Replaced with 15
  pinned packages that the application actually imports. **Verified**:
  installed cleanly into a fresh virtual environment.
- **`UserCreate` schema was missing required fields.** The `User` model
  requires `employee_id`, `department`, `designation`, `phone_number`
  (all `NOT NULL`), but the schema used to create a user didn't accept
  them — every `POST /users` call would have failed a database constraint.
  Fixed, and added a matching public `/auth/register` self-signup
  endpoint (always creates an `Employee`; role escalation requires an
  Administrator).
- **Comment routes had a confusing path shape** (`PUT/DELETE
  /decisions/{comment_id}` — reads like a decision ID). Moved to
  `/decisions/comments/{comment_id}` for clarity.
- **Decision replay/timeline endpoint didn't exist** — required by the
  platform's core feature. Added `GET /decisions/{id}/replay`, which
  merges creation, edits, alternatives, discussion, comments, meeting
  notes, rationale and approval events into one chronological timeline.
- **Approvals never updated the decision's status.** Approving or
  rejecting a decision through `PATCH /approvals/{id}` left
  `Decision.status` untouched. Now approving/rejecting syncs the parent
  decision's status and writes matching audit + activity log entries.
  Also: submitting a decision for approval now moves it to
  `Under Review`, and a decision can no longer be edited once it reaches
  `Approved`/`Rejected`.
- **Two competing "activity" models** (`Activity` and `ActivityLog`) both
  declared a `back_populates="activities"` relationship back to `User`,
  which is a SQLAlchemy configuration conflict waiting to happen the
  moment both got imported together. `ActivityLog` (and the unused `Tag`
  model/table, which duplicated the simpler string `tags` column already
  in use) were dead code — deleted.
- **Removed 9 duplicate/dead router files** (singular-named
  `activity.py`, `alternative.py`, `approval.py`, `comment.py`,
  `discussion_thread.py`, `meeting_note.py`, `audit.py`, `rationale.py`,
  `tag.py`) that were never imported by `main.py` — the app actually ran
  on their plural-named counterparts. Kept the working ones, deleted the
  rest to remove confusion and prevent someone from wiring in the broken
  version later.
- **`alembic/env.py` only imported the `User` model**, so autogenerate
  would have silently ignored every other table. Now imports the full
  `app.models` package.
- Added `is_active` and `created_at` columns to `User` (needed for
  account deactivation and the admin user list) and a soft-delete
  (`DELETE /users/{id}` deactivates rather than deletes, preserving
  audit/decision history integrity).
- Fixed a `DeprecationWarning` by switching `app/main.py` from
  `@app.on_event("startup")` to the modern `lifespan` context manager.

## What was added (previously missing)

- `GET /` and `GET /health` (with real database connectivity check).
- `POST /auth/register` (public self sign-up).
- `GET /decisions/{id}/replay` (decision replay/timeline).
- `.env.example` (backend) and `frontend/.env.example`.
- A full **React + Vite + TypeScript frontend** (none existed before) —
  see below.
- A **pytest suite** (`tests/`, 33 tests) covering auth, decisions,
  alternatives, discussions/comments/notes/rationale, approvals, audit
  logs and report generation, run against an isolated SQLite database.
- This `CHANGES.md` and a rewritten `README.md` with exact Windows
  PowerShell setup commands.

## What was deliberately left alone

- The `password` column name (rather than renaming to `password_hash`).
  It always stores a bcrypt hash — verified in the model's docstring
  comment — renaming it would have touched a large surface area for a
  cosmetic gain, so it was left as-is per the master prompt's "if it
  makes the architecture cleaner" being optional.
- Decision status strings (`Draft`, `Under Review`, `Approved`,
  `Rejected`, `Archived`) rather than the broader
  `DRAFT/DISCUSSION/PENDING_APPROVAL/...` set suggested as an example in
  the brief — the existing dashboard and report code was already built
  and tested around the five-value set, and changing it would have been
  a breaking change for no functional benefit.

## Verification performed in this session

1. Installed `requirements.txt` into a fresh virtual environment — clean.
2. Ran `alembic upgrade head` against a real database — clean, single
   migration, no "multiple heads" error.
3. Ran `python seed_data.py` twice — first run inserts 8 users, second
   run reports 0 inserted / 8 skipped (idempotency confirmed).
4. Started the FastAPI server and ran **all 20 steps** of the required
   end-to-end workflow as real HTTP requests: register → login → create
   decision → add alternative → add rationale → start discussion → add
   comment → add meeting note → manager assigns reviewer → decision
   auto-moves to "Under Review" → reviewer approves → decision becomes
   "Approved" → activity log has entries → audit log has entries →
   replay timeline includes creation and approval events → Excel report
   downloads → PDF report downloads → dashboard metrics reflect real
   data → an unrelated employee is correctly blocked with 403.
   **All 20 steps passed.**
5. Ran the full pytest suite — **33/33 passed**.
6. Ran `npm install && npm run build` in `frontend/` — clean TypeScript
   compile, zero errors, production bundle built successfully.
7. Served the production frontend build and confirmed it loads (HTTP 200).

## Known limitation

Full browser-based UI testing (actually clicking through the React app)
was not performed, since this session has no browser automation tool —
verification of the frontend was: a clean TypeScript build with strict
mode on, a successful production build, and manual tracing of every
API call in the frontend against the actual (tested) backend route
signatures. If anything doesn't line up visually once you run it, it
should be a small fix — the data contracts have all been verified.
