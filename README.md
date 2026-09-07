# 🧠 Expert Decision Replay Platform

> **Completed Milestone 1 & Milestone 2**: A unified enterprise platform for capturing, managing, reviewing, and replaying expert decision-making processes with role-based authentication, automated version history, trade-off comparison matrices, threaded discussions, and file attachments.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite)
![PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-336791?logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT%20Tokens-black?logo=jsonwebtokens)
![RBAC](https://img.shields.io/badge/Security-RBAC%20Enabled-green)
![Milestone 1 & 2](https://img.shields.io/badge/Milestone%201%20%26%202-Completed-success)

---

## 🌐 Quick Application & UI Navigation Links

When running the application locally, access the interactive user interfaces and backend documentation via the following links:

| Module / Screen | URL Link | Description | Access Rights |
| :--- | :--- | :--- | :--- |
| 🔑 **User Sign In** | [`http://localhost:5173/login`](http://localhost:5173/login) | Public login portal with 1-click test fill buttons | All Users / Public |
| 📝 **User Registration** | [`http://localhost:5173/register`](http://localhost:5173/register) | Account registration with team & role selection | All Users / Public |
| 📊 **User Dashboard** | [`http://localhost:5173/dashboard`](http://localhost:5173/dashboard) | Central dashboard displaying active decisions & metrics | Authenticated Users |
| 🧠 **Decisions Directory** | [`http://localhost:5173/decisions`](http://localhost:5173/decisions) | Decision tracker with state & category filtering | Authenticated Users |
| 🔍 **Decision Detail View** | [`http://localhost:5173/decisions/1`](http://localhost:5173/decisions/1) | Version history, alternatives matrix, discussions & attachments | Authenticated Users |
| 🏢 **Teams Workspace** | [`http://localhost:5173/teams`](http://localhost:5173/teams) | Organizational team directory and member allocations | Authenticated Users |
| 🛡️ **User & Role Admin** | [`http://localhost:5173/admin/users`](http://localhost:5173/admin/users) | RBAC management panel & account activation | Administrator Only |
| 📖 **Swagger API Docs** | [`http://localhost:8000/docs`](http://localhost:8000/docs) | Interactive FastAPI OpenAPI documentation & test runner | All Developers |
| 📚 **ReDoc API Docs** | [`http://localhost:8000/redoc`](http://localhost:8000/redoc) | Clean formatted API reference documentation | All Developers |

---

## 🚀 Completed Milestones Overview

```text
===================================================================================================
                       EXPERT DECISION REPLAY PLATFORM ARCHITECTURE
===================================================================================================
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MILESTONE 1: AUTHENTICATION & RBAC GOVERNANCE                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • JWT Bearer Authentication (Passlib & PyJWT)                                                  │
│  • Role-Based Access Control: ADMINISTRATOR, MANAGER, REVIEWER, EMPLOYEE                       │
│  • User Management, Account Activation, & Multi-Team Organizational Structuring                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MILESTONE 2: CORE DECISION ENGINE, VERSIONING & COLLABORATION                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Decision Lifecycle Management (Draft, Under Review, Approved, Rejected, Archived)            │
│  • Automated Version Snapshotting (v1 -> v2 -> v3 immutable change audit trail)                 │
│  • Side-by-Side Alternatives Comparison Matrix (Pros/Cons, Feasibility, Cost & Metrics)         │
│  • Threaded Discussion Engine (General Comments, Meeting Notes, Rationale Tags)                │
│  • File Attachment & Artifact Management (Upload, Validate, Download)                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
===================================================================================================
```

---

## 🔑 Pre-Seeded Demo Accounts (Instant 1-Click Testing)

The database automatically seeds four pre-configured test users covering every role:

| Role | Email | Password | Pre-assigned Team |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@decisionreplay.com` | `Admin@123` | Executive Governance & Risk |
| **Manager** | `manager@decisionreplay.com` | `Manager@123` | Platform Architecture & Engineering |
| **Reviewer** | `reviewer@decisionreplay.com` | `Reviewer@123` | Product Strategy & UX |
| **Employee** | `employee@decisionreplay.com` | `Employee@123` | Platform Architecture & Engineering |

*(The frontend login screen includes 1-click auto-fill buttons for these accounts.)*

---

## 🚀 Step-by-Step Execution Guide

### 1. Backend Launch (FastAPI Server)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Launch (React + Vite Client)

```bash
cd frontend
npm install
npm run dev
```

Open your browser at [`http://localhost:5173`](http://localhost:5173).

---

## 🛡️ Complete API Endpoints (Milestone 1 & 2)

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Authenticate and receive JWT access token
- `GET /api/v1/auth/me` - Get profile of logged-in user

### 👥 User & Role Administration (`/api/v1/users`)
- `GET /api/v1/users` - List all users (*Search & filter*)
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update profile
- `PUT /api/v1/users/{id}/role` - Assign role (*Admin only*)
- `PUT /api/v1/users/{id}/status` - Activate / Deactivate account (*Admin only*)

### 🏢 Teams Management (`/api/v1/teams`)
- `GET /api/v1/teams` - List organizational teams
- `POST /api/v1/teams` - Create team (*Manager / Admin only*)

### 🧠 Decisions Engine & Versioning (`/api/v1/decisions`)
- `POST /api/v1/decisions` - Create decision & initialize Version 1
- `GET /api/v1/decisions` - List decisions (*Filter by status & category*)
- `GET /api/v1/decisions/{id}` - Decision detail view with versions, alternatives, comments & attachments
- `PUT /api/v1/decisions/{id}` - Update decision & auto-create new version snapshot
- `GET /api/v1/decisions/{id}/versions` - Get version snapshot history

### 📊 Alternatives & Comparison Matrix (`/api/v1/decisions/{id}/alternatives`)
- `POST /api/v1/decisions/{id}/alternatives` - Add alternative option
- `GET /api/v1/decisions/{id}/alternatives` - List alternatives
- `GET /api/v1/decisions/{id}/alternatives/compare` - Get comparison matrix & metrics
- `PUT /api/v1/decisions/{id}/alternatives/{alt_id}` - Update alternative option
- `DELETE /api/v1/decisions/{id}/alternatives/{alt_id}` - Delete alternative option

### 💬 Threaded Discussions (`/api/v1/decisions/{id}/comments`)
- `POST /api/v1/decisions/{id}/comments` - Add comment/reply (*general_comment*, *meeting_note*, *rationale*)
- `GET /api/v1/decisions/{id}/comments` - Get hierarchical comment tree
- `DELETE /api/v1/decisions/{id}/comments/{comment_id}` - Delete comment

### 📎 Document Attachments (`/api/v1/decisions/{id}/attachments`)
- `POST /api/v1/decisions/{id}/attachments` - Upload supporting document
- `GET /api/v1/decisions/{id}/attachments` - List attachments
- `GET /api/v1/decisions/{id}/attachments/{att_id}/download` - Download attached file

---

## 🧪 Testing & Verification

### Automated Pytest Suite
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_milestone2.py
```

### Verification Script
```bash
python test_output.py
```
