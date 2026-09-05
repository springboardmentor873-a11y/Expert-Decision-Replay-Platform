# Expert Decision Replay Platform — Milestone 1

Milestone 1 scope: FastAPI + React project setup, authentication, and
user/team management with role-based access (Employee, Reviewer, Manager,
Administrator), matching the required project structure.

## Structure

```
edrp/
├── Backend/
│   ├── Schemas/        (Pydantic request/response models)
│   ├── database/       (SQLAlchemy engine + session)
│   ├── models/         (Role, Team, User, UserProfile)
│   ├── security/       (password hashing, JWT, auth dependencies)
│   ├── main.py          (FastAPI app + all routes)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx        (login/register screen + routing to dashboard)
│   │   ├── dashboard.jsx  (post-login dashboard: Profile, Teams, Admin)
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
└── docs/
    ├── database-design.md
    └── wireframes.md
```

This has been tested end-to-end in a sandbox — every endpoint below was hit
with real requests and confirmed working, including role-based 403
blocking.

## Prerequisites

Python 3.10+, Node.js + npm, PostgreSQL, git.

If PostgreSQL isn't installed yet:

```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

Then inside the `psql` prompt:

```sql
ALTER USER postgres PASSWORD 'yourpassword';
CREATE DATABASE edrp;
\q
```

## Backend setup

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL to your real Postgres password, e.g.
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/edrp

uvicorn main:app --reload
```

Visit http://127.0.0.1:8000 — you should see:
`{"message": "Expert Decision Replay Platform API is running"}`

Interactive API docs: http://127.0.0.1:8000/docs

The four roles (`employee`, `reviewer`, `manager`, `administrator`) are
seeded into the `roles` table automatically the first time the server
starts — no manual setup needed.

## Frontend setup

In a **second terminal**, leave the backend running and do:

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173. Register an account, then log in.

## Known gotcha

If you ever see `"password cannot be longer than 72 bytes"` on
registration — that's a `passlib`/`bcrypt` version compatibility bug, not
an actual password-length issue. `requirements.txt` pins `bcrypt==4.0.1`
to avoid it; don't let `pip` upgrade it.

## API endpoints (all defined directly in `main.py`)

| Method | Path | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| GET | `/me` | Any logged-in user |
| PUT | `/me` | Any logged-in user (name) |
| PUT | `/me/profile` | Any logged-in user (phone, department, designation, image) |
| GET | `/users` | Administrator only |
| PUT | `/users/{id}/role` | Administrator only |
| POST | `/teams` | Administrator, Manager |
| GET | `/teams` | Any logged-in user |
| PUT | `/teams/assign/{user_id}` | Administrator, Manager |

## Milestone 1 checklist

- [x] FastAPI project setup
- [x] React project setup
- [x] Authentication (register, login, JWT)
- [x] Role-based access control (normalized `roles` table, 4 roles)
- [x] User profile (view/edit name + extended details)
- [x] Admin: list users, change roles
- [x] Team management (create, list, assign users)
- [x] Database design doc (ERD) — see `docs/database-design.md`
- [x] UI wireframes — see `docs/wireframes.md`

Milestone 1 is complete.
