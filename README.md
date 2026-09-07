# 🧠 Expert Decision Replay Platform

> A comprehensive enterprise platform for capturing, managing, reviewing, and replaying expert decision-making processes with automated version history, trade-off analysis, threaded discussions, and file attachments.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite)
![PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-336791?logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT%20Tokens-black?logo=jsonwebtokens)
![RBAC](https://img.shields.io/badge/Security-RBAC%20Enabled-green)
![Milestone 2](https://img.shields.io/badge/Milestone%202-Complete-success)

---

## 🚀 Key Platform Features

### 🔐 Milestone 1: Authentication & Role-Based Access Control (RBAC)
- **JWT Bearer Token Authentication**: Secure token-based user authentication.
- **Granular RBAC System**: Distinct capabilities for **ADMINISTRATOR**, **MANAGER**, **REVIEWER**, and **EMPLOYEE**.
- **User & Team Management**: Multi-team organizational structures and role assignments.

### 🏛️ Milestone 2: Core Decision Engine, Versioning & Collaboration
- **Decision Lifecycle Management**: Create, update, and manage decisions across states (*Draft*, *Under Review*, *Approved*, *Rejected*, *Archived*).
- **Automated Version History Snapshots**: Every modification creates an immutable snapshot version (v1, v2, v3...) tracking author, timestamp, and change summary.
- **Alternatives Analysis & Side-by-Side Comparison Matrix**: Compare alternative solutions with pros/cons lists, feasibility scores (1-10), estimated costs, and automated metrics (lowest cost, highest feasibility, total cost).
- **Threaded Discussion Engine**: Hierarchical comment threads supporting **General Comments**, **Meeting Notes**, and **Rationale Tags**.
- **Document & Attachment Manager**: Upload, store, and download supporting specifications and decision artifacts.

---

## 🏛️ System Architecture & Roles

### User Roles (RBAC Matrix)
- **ADMINISTRATOR**: Full control over user accounts, role reassignments, system configuration, and governance.
- **MANAGER**: Team oversight, decision creation/approval, alternative analysis, and comment moderation.
- **REVIEWER**: Technical alternative analysis, feasibility score checks, and rationale reviews.
- **EMPLOYEE**: Standard member creating decisions, contributing alternatives, and engaging in discussions.

---

## 📁 Directory Structure

```text
Decision-replay-plotform/
├── backend/
│   ├── alembic/                  # Database migration scripts
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py             # Application settings & JWT configuration
│   │   ├── database.py           # SQLAlchemy engine & session maker
│   │   ├── models.py             # User, Team, Decision, Version, Alternative, Comment & Attachment ORM models
│   │   ├── schemas.py            # Pydantic validation & response schemas
│   │   ├── auth.py               # Password hashing, JWT utils, RBAC guards
│   │   ├── routers/
│   │   │   ├── auth.py           # /auth/register, /auth/login, /auth/me
│   │   │   ├── users.py          # /users CRUD & role management
│   │   │   ├── teams.py          # /teams CRUD
│   │   │   ├── decisions.py      # Decision lifecycle & version snapshots
│   │   │   ├── alternatives.py   # Alternatives CRUD & comparison matrix
│   │   │   ├── discussions.py   # Threaded comments & rationale tags
│   │   │   └── attachments.py   # File upload & download endpoints
│   │   └── services/             # Business logic layer
│   │       ├── decision_service.py
│   │       ├── alternative_service.py
│   │       ├── discussion_service.py
│   │       └── file_service.py
│   ├── tests/
│   │   ├── conftest.py           # Pytest fixtures & isolated test client setup
│   │   └── test_milestone2.py   # End-to-end Milestone 2 test suites
│   ├── uploads/                  # Local storage directory for file attachments
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP clients & service modules
│   │   ├── components/           # Reusable UI elements (Navbar, Badges, ProtectedRoute)
│   │   ├── context/              # AuthContext & global state
│   │   ├── pages/                # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DecisionsPage.jsx
│   │   │   ├── DecisionDetailPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   └── AdminUsersPage.jsx
│   │   ├── App.jsx               # React Router layout & guarded routes
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind CSS styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── Milestone2_Presentation.html # Interactive HTML presentation deck for Milestone 2
├── test_output.py               # Terminal verification script
└── README.md
```

---

## 🚀 Step-by-Step Setup Instructions

### 1. Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. Interactive API Documentation:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser:
   - **Frontend URL**: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Pre-Seeded Demo Accounts (Instant 1-Click Testing)

When the backend starts up for the first time, it automatically creates sample teams and four pre-configured test users:

| Role | Email | Password | Pre-assigned Team |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@decisionreplay.com` | `Admin@123` | Executive Governance & Risk |
| **Manager** | `manager@decisionreplay.com` | `Manager@123` | Platform Architecture & Engineering |
| **Reviewer** | `reviewer@decisionreplay.com` | `Reviewer@123` | Product Strategy & UX |
| **Employee** | `employee@decisionreplay.com` | `Employee@123` | Platform Architecture & Engineering |

---

## 🛡️ Complete Backend API Endpoints

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register a new user account
- `POST /api/v1/auth/login` - Authenticate credentials and receive JWT access token
- `GET /api/v1/auth/me` - Retrieve current user profile

### 👥 Users & Roles (`/api/v1/users`)
- `GET /api/v1/users` - List all users (*Search, filter by role/team*)
- `GET /api/v1/users/{id}` - Fetch user details
- `PUT /api/v1/users/{id}` - Update user profile
- `PUT /api/v1/users/{id}/role` - Reassign user role (*Admin only*)
- `PUT /api/v1/users/{id}/status` - Activate / Deactivate user account (*Admin only*)

### 🏢 Teams Management (`/api/v1/teams`)
- `GET /api/v1/teams` - List organizational teams
- `POST /api/v1/teams` - Create a team (*Manager / Admin only*)
- `GET /api/v1/teams/{id}` - Fetch team details

### 🧠 Decisions Engine & Versioning (`/api/v1/decisions`)
- `POST /api/v1/decisions` - Create new decision & auto-initialize Version 1
- `GET /api/v1/decisions` - List decisions (*Filter by status, category, search*)
- `GET /api/v1/decisions/{id}` - Comprehensive decision detail view (*Versions, alternatives, comments, attachments*)
- `PUT /api/v1/decisions/{id}` - Update decision details & auto-generate new version snapshot
- `GET /api/v1/decisions/{id}/versions` - Get full version snapshot history

### 📊 Alternatives Analysis (`/api/v1/decisions/{id}/alternatives`)
- `POST /api/v1/decisions/{id}/alternatives` - Add alternative option & record version update
- `GET /api/v1/decisions/{id}/alternatives` - List alternatives for a decision
- `GET /api/v1/decisions/{id}/alternatives/compare` - Get side-by-side comparison matrix with metrics
- `PUT /api/v1/decisions/{id}/alternatives/{alt_id}` - Update alternative option
- `DELETE /api/v1/decisions/{id}/alternatives/{alt_id}` - Delete alternative option

### 💬 Threaded Discussions (`/api/v1/decisions/{id}/comments`)
- `POST /api/v1/decisions/{id}/comments` - Create comment/reply with type (*general_comment*, *meeting_note*, *rationale*)
- `GET /api/v1/decisions/{id}/comments` - Get hierarchical comment trees with replies
- `DELETE /api/v1/decisions/{id}/comments/{comment_id}` - Delete comment

### 📎 Document Attachments (`/api/v1/decisions/{id}/attachments`)
- `POST /api/v1/decisions/{id}/attachments` - Upload supporting document (multipart/form-data)
- `GET /api/v1/decisions/{id}/attachments` - List attachments for a decision
- `GET /api/v1/decisions/{id}/attachments/{att_id}/download` - Download attached file

---

## 🧪 Testing & Verification

### Automated Pytest Suite
Run the full backend test suite covering decision creation, versioning, comparison matrices, comments, and file uploads:
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_milestone2.py
```

### Verification Script
Run the interactive terminal verification script to validate live endpoints against a running server:
```bash
python test_output.py
```
