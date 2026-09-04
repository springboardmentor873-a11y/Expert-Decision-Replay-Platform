# Expert Decision Replay Platform

## Project Overview

The Expert Decision Replay Platform is an organizational
decision-management system. It is designed to preserve the full
context behind important decisions — the problem statement,
alternatives considered, evaluation criteria, risks, stakeholders,
discussions, approvals, implementation status, and outcomes — so that
employees can review past decisions and avoid repeating past
mistakes.

**This repository contains Milestone 1 only.** Later milestones will
add the full decision-management workflow, approvals, notifications,
reporting, and deployment. See `docs/requirements.md` for details on
what is (and is not) in scope here.

## Problem Statement

Organizations lose track of why past decisions were made because the
reasoning is scattered across emails, chats, and memories rather than
stored centrally. This leads to repeated debates and repeated
mistakes.

## Proposed Solution

A centralized platform where decisions — and the reasoning behind
them — are recorded, searchable, and reviewable by the right people,
with role-based access so the right stakeholders can contribute at
the right stage.

## Milestone 1

This milestone covers exactly seven tasks:

1. **Requirement Analysis** — `docs/requirements.md`
2. **Database Design** — `database/schema.sql`, `docs/database-design.md`
3. **UI Wireframes** — `docs/wireframes/`
4. **FastAPI Setup** — `backend/app/main.py`
5. **Frontend Setup** — `frontend/`
6. **Authentication** — JWT + bcrypt, `backend/app/routers/auth.py`
7. **User Management** — `backend/app/routers/users.py`, `backend/app/routers/teams.py`

Expected outcomes: project initialized, authentication working,
database designed, user roles implemented.

## Technology Stack

- **Backend:** Python, FastAPI
- **Frontend:** HTML, CSS, JavaScript (no framework)
- **Database:** MySQL, accessed via `mysql-connector-python`
- **Authentication:** JWT (`python-jose`) + password hashing (`passlib[bcrypt]`)

**Explicitly NOT used:** React, Angular, Vue, Firebase, MongoDB,
PostgreSQL, SQLAlchemy, or any other ORM.

## Architecture

```
   Browser (HTML/CSS/JS)
          │  fetch() over HTTP, JSON + JWT
          ▼
   FastAPI backend (Python)
          │  parameterized SQL via mysql-connector-python
          ▼
   MySQL database
```

## Folder Structure

```
Expert-Decision-Replay-Platform/
├── backend/
│   ├── app/
│   │   ├── auth/          # password hashing, JWT, route protection
│   │   ├── models/        # raw SQL data-access functions
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── database.py    # MySQL connection helper
│   │   ├── config.py      # environment variable loading
│   │   └── main.py        # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── index.html, login.html, register.html, dashboard.html, users.html
│   ├── css/style.css
│   └── js/ (api.js, auth.js, dashboard.js, users.js)
├── database/
│   └── schema.sql
├── docs/
│   ├── requirements.md
│   ├── database-design.md
│   ├── milestone-1-checklist.md
│   └── wireframes/
├── README.md
└── .gitignore
```

## Database Design

Three tables: **users**, **teams**, **decisions** (Milestone 1
foundation only — full decision workflow arrives later). A user
belongs to at most one team; a team can have many users and an
optional manager; a user can create many decisions. Full details,
including column types and constraints, are in
`docs/database-design.md`.

## Authentication

- **Registration** (`POST /auth/register`): validates input, rejects
  duplicate emails, hashes the password with bcrypt before storing it.
- **Login** (`POST /auth/login-json` for the frontend, or
  `POST /auth/login` for OAuth2-form clients like Swagger): verifies
  the password hash and issues a signed JWT containing the user's ID
  and role.
- **JWT:** signed with a secret from `.env` (never hardcoded),
  includes an expiration time, and is validated on every protected
  request.
- **Protected endpoints:** `GET /auth/me`, `GET /users`,
  `PATCH /users/{id}/role`, `PATCH /users/{id}/team`, `POST /teams`
  all require a valid `Authorization: Bearer <token>` header.

## User Roles

- **Employee** — standard authenticated user.
- **Reviewer** — standard authenticated user; reviewer-specific
  features arrive in later milestones.
- **Manager** — standard authenticated user; can create teams.
- **Administrator** — can list all users, change any user's role, and
  create teams. Administrator-only endpoints reject any other role
  with `403 Forbidden`.

---

## Installation

### Prerequisites

- Python 3.10+
- MySQL Server 8.0+ (or compatible), installed and running
- A modern web browser
- (Optional but recommended) VS Code

### 1. MySQL Setup

Start your MySQL server, then run the schema script:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `expert_decision_replay` database along with the
`users`, `teams`, and `decisions` tables and their relationships. You
can also open `database/schema.sql` in a MySQL client (Workbench,
DBeaver, etc.) and run it there instead.

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Activate the virtual environment:
#   Windows:      .venv\Scripts\activate
#   macOS/Linux:  source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
```

Edit `backend/.env` and set real values:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your MySQL password>
DB_NAME=expert_decision_replay
JWT_SECRET_KEY=<any long random string>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

The API is now running at `http://127.0.0.1:8000`.

### 3. Frontend Setup

The frontend is plain HTML/CSS/JS, so it just needs to be served as
static files (opening the files directly with `file://` can cause
browser CORS/fetch issues, so use a simple local server instead).

From the `frontend/` folder:

```bash
cd frontend
python -m http.server 5500
```

Then open `http://127.0.0.1:5500/index.html` in your browser.

(If your backend or frontend run on different ports, update
`API_BASE_URL` in `frontend/js/api.js` and `CORS_ORIGINS` in
`backend/.env` accordingly.)

## Running the Application

Startup order:

1. Start MySQL and confirm `schema.sql` has been run.
2. Start the backend: `uvicorn app.main:app --reload` (from `backend/`).
3. Start the frontend: `python -m http.server 5500` (from `frontend/`).
4. Open `http://127.0.0.1:5500/index.html`.

## Testing

Manual test flow:

1. **Registration:** Go to Register, create an account (try role
   `Administrator` for your first account so you can test user
   management). Confirm you see a success message and are redirected
   to Login.
2. **Duplicate email:** Try registering the same email again — it
   should be rejected with a clear error.
3. **Login:** Log in with the account you just created. You should
   land on the Dashboard with your real name/email/role/team shown.
4. **JWT / current user:** Refresh the Dashboard page — it should stay
   logged in (token is stored in `localStorage`) and still show your
   real data pulled from `GET /auth/me`.
5. **User management (Administrator only):** If your account's role is
   `Administrator`, click "Manage Users →", confirm the list of users
   loads, and try changing a role — it should update immediately.
6. **Role protection:** Log in as a non-Administrator and confirm the
   "Manage Users" link is hidden, and that manually visiting
   `users.html` redirects you away.
7. **Logout:** Click Logout and confirm you're returned to the login
   page and can no longer access the Dashboard without logging in
   again.
8. **Database persistence:** Restart the backend and confirm
   previously registered users can still log in (data persists in
   MySQL, not in memory).

## API Documentation

With the backend running, open:

```
http://127.0.0.1:8000/docs
```

for interactive Swagger UI, where every endpoint can be tried
directly (use the "Authorize" button with a token from `/auth/login`).

## Milestone 1 Completion Checklist

- [x] Requirement analysis completed
- [x] Database design completed
- [x] UI wireframes completed
- [x] FastAPI setup completed
- [x] Frontend setup completed
- [x] Authentication completed
- [x] User management completed
- [x] User roles implemented

See `docs/milestone-1-checklist.md` for the detailed audit, including
what was verified and what should be re-verified locally (this
generation environment has no network access or MySQL server, so a
live end-to-end run could not be performed here — see that file for
exact details).
