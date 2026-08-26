# Expert Decision Replay Platform

## Overview

This project provides a FastAPI backend, PostgreSQL data layer, and React/Vite frontend for a decision replay platform. Milestone 1 focuses on authentication and user management.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT
- Frontend: React, Vite
- Auth: bcrypt password hashing and JWT bearer tokens

## Requirements

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally
- Git

## Clone and Setup

```bash
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
```

## PostgreSQL Setup

1. Start PostgreSQL locally.
2. Create a database named `expert_decision_replay`.
3. Copy the example environment file and adjust values:

```bash
copy .env.example .env
```

Example environment values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expert_decision_replay
JWT_SECRET_KEY=change-me-to-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Backend Setup

```bash
cd Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API will run at:

- http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The React app runs at:

- http://localhost:5173

## Authentication Flow

- Register users via `POST /api/auth/register`
- Log in via `POST /api/auth/login`
- Store the JWT in `localStorage`
- Call `GET /me` with `Authorization: Bearer <token>`
- View the dashboard after successful authentication
- Log out by removing the token from localStorage

## Default Roles

The backend seeds these roles automatically:

- Employee
- Reviewer
- Manager
- Administrator

A default team named `General` is also created if needed.

## API Summary

- `GET /`
- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /me`

## Notes

- Passwords are never stored in plain text.
- Duplicate emails are rejected.
- JWTs are validated before access to protected routes.
- The frontend must be run with Vite, not Live Server.

│   │
│   ├── models/
│   │   ├── _init_.py
│   │   ├── role.py
│   │   ├── team.py
│   │   └── user.py
│   │
│   ├── security/
│   │   ├── _init_.py
│   │   ├── auth.py
│   │   ├── jwt.py
│   │   └── password.py
│   │
│   └── main.py
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── dashboard.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🔑 Authentication Flow

The current authentication flow works as follows:

```text
User
  │
  ▼
React Login Page
  │
  │ Email + Password
  ▼
FastAPI Backend
  │
  ▼
Verify Credentials
  │
  ▼
Generate JWT Token
  │
  ▼
React Frontend
  │
  ▼
Store Token in localStorage
  │
  ▼
Request /me
  │
  ▼
Display User Dashboard
```

---

## 🎯 Milestone 1

Milestone 1 focuses on establishing the basic authentication and user-management foundation of the platform.

### Completed

- Project repository setup
- Backend setup using FastAPI
- React frontend setup using Vite
- PostgreSQL database structure
- User model
- Role model
- Team model
- Password handling
- JWT authentication
- Login API
- Protected `/me` endpoint
- Frontend login page
- Frontend dashboard
- User information display
- Logout functionality
- GitHub repository setup

---

## 🛠️ Technologies Used

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy

### Database

- PostgreSQL
- pgAdmin

### Authentication

- JWT
- Password hashing

### Version Control

- Git
- GitHub

---

## 📌 Current Status

The first milestone of the Expert Decision Replay Platform has been completed.

The application currently supports:

```text
Login
  ↓
JWT Authentication
  ↓
Authenticated User
  ↓
User Information
  ↓
Dashboard
  ↓
Logout
```

Further milestones will extend the platform with the core expert decision capture, review, and replay functionality.

---

## 👥 Project Roles

The platform currently defines four user roles:

| Role | Purpose |
|------|---------|
| Employee | Regular platform user |
| Reviewer | Reviews submitted decisions |
| Manager | Manages teams and reviews |
| Administrator | Manages the overall platform |

---

## 📄 License

This project is developed as part of the Expert Decision Replay Platform project.
