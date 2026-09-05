# Milestone 1 + 2 Merge Notes

This project merges your real **Milestone 1** backend/frontend (Auth, Roles,
Teams, UserProfile) with the **Milestone 2** feature set (Decisions,
Alternatives, Discussion, Files, Version tracking) that was previously built
as a disconnected standalone rebuild. Everything now lives in one codebase.

## What changed in the backend (`Backend/`)

- Kept your real Milestone 1 `models/`, `Schemas/`, `security/`, `database/`
  exactly as they were (Role table, Team, UserProfile all intact).
- Added `models/decision.py`, `alternative.py`, `comment.py`, `attachment.py`,
  `version.py` and matching `Schemas/` — same fields/logic as the old
  standalone `edrp/` backend, just re-pointed at this project's
  `database.database` / `models` / `Schemas` import paths instead of `app.*`.
- Added `routers/decisions.py`, `alternatives.py`, `comments.py`,
  `attachments.py`, `versions.py`, registered in `main.py`.
- **`security/auth.py`**: `get_current_user` now returns the full `User` ORM
  object (with `.role` loaded) instead of a `{email, role}` dict — the new
  routers need `.id` on the current user, and this was the cleanest way to
  support both the old and new routes without duplicating auth logic.
  `main.py`'s `/me`, `/me` (PUT), and `/me/profile` were updated for this.
- Role checks in the new routers use your existing lowercase role names
  (`employee`/`reviewer`/`manager`/`administrator`) via `user.role.name` —
  the old standalone backend used `"Employee"/"Reviewer"/...` which would
  never have matched your actual Role table.
- Routes have **no `/api/v1` prefix** — kept consistent with your existing
  `/login`, `/register`, `/teams`, `/users` routes.
- Added `tests/` (pytest) covering both milestones together — registration,
  login, admin/team management, decision CRUD, alternative scoring,
  comment threads, attachment upload, version snapshots, and permission
  checks across employee/manager/admin roles.

## What changed in the frontend (`frontend/`)

- Used Milestone 2's frontend (React Router, sidebar layout, nicer styling)
  as the base, since it's more built out than the old single-page M1 UI.
- Re-added the missing pieces from Milestone 1: **Profile**, **Teams**, and
  **Admin** pages, styled to match the rest of the app, wired to the same
  endpoints your old `dashboard.jsx` used.
- Updated `api.js` to call the un-prefixed routes this backend actually
  exposes (`/decisions`, `/teams`, `/me`, etc. — not `/api/v1/...`).
- Updated `AuthContext.jsx` and `Register.jsx` to match Milestone 1's auth
  shape: registration takes a lowercase `role_name`, and role is decoded
  from the JWT (as your original `dashboard.jsx` did) since `/me` returns
  `role_id`, not a role string.
- Fixed a few leftover capitalized role checks (`"Administrator"` etc.) in
  `DecisionDetail.jsx` that would never have matched your lowercase roles.

## What I could NOT verify here

This sandbox has no network access, so I couldn't `pip install` or
`npm install` to actually run the test suite or build the frontend. I did:

- Syntax-check every Python file (`py_compile`) — all pass.
- Carefully trace every import, model relationship, and role-string
  comparison by hand across both backend and frontend.

**Before you submit, please run locally:**

```bash
cd Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, SECRET_KEY
pytest -v
uvicorn main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

If `pytest` turns up anything (it shouldn't, based on the manual trace, but
I want to be upfront that I haven't executed it), paste me the failure and
I'll fix it immediately.
