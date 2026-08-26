# Expert Decision Replay Platform

Milestone 1 foundation for the Expert Decision Replay Platform, including the React workspace UI and FastAPI authentication backend.

## Stack

- React 19 + Vite
- Axios, React Router, Lucide React
- FastAPI + SQLAlchemy
- SQLite for local development
- JWT authentication with native bcrypt password hashing

## Frontend

From the project root:

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

Available checks:

```powershell
npm run lint
npm run build
```

## Backend

From the project root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:JWT_SECRET_KEY = "replace-with-a-long-random-secret"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

The API runs at `http://127.0.0.1:8080`.

- Swagger UI: `http://127.0.0.1:8080/docs`
- Health check: `http://127.0.0.1:8080/health`

The database is created as `backend/replay.db` on startup. The backend seeds standard accounts when the user table is empty:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@replay.local` | `Pass@1234` |
| Manager | `manager@replay.local` | `Pass@1234` |
| Reviewer | `reviewer@replay.local` | `Pass@1234` |
| Employee | `employee@replay.local` | `Pass@1234` |

## Authentication API

Register with `POST /api/auth/register` using `full_name`, `email`, `password`, `role`, and optional `team_id` or `team_name`.

Login with `POST /api/auth/login`. The response contains an `access_token`. Send it as a bearer token to `GET /api/users/me` and other protected endpoints.

The frontend stores the access token locally, fetches the authenticated profile, and uses the returned role for the active workspace context.

## Project Structure

```text
backend/app/
  core/security.py       JWT and bcrypt helpers
  database.py            SQLAlchemy engine and session setup
  models/user.py         User, Team, and Role models
  routes/auth.py         Registration and login endpoints
  routes/users.py        Profile and administrator endpoints
  main.py                FastAPI app, CORS, and seed data
src/
  context/AuthContext.jsx
  pages/Login.jsx
  pages/Register.jsx
  layouts/DashboardShell.jsx
```
