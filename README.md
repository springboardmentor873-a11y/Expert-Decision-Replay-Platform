# 🧠 Expert Decision Replay Platform

> An enterprise decision intelligence platform for capturing, evaluating, approving, and replaying expert decision-making processes with Knowledge Graphs and Outcome Analysis.

![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-100%25%20Passing-success?logo=pytest&logoColor=white)
![Milestone 4](https://img.shields.io/badge/Milestone%204-Completed-brightgreen)

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- Python
- Node.js
- PostgreSQL
- pgAdmin
- Git

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
```

---

## 🔧 Step 2 — Start the Backend

Open a terminal and navigate to the backend:

```bash
cd Backend
```

### Create a Python virtual environment

```bash
python -m venv .venv
```

### Activate the virtual environment

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

### Install backend dependencies

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib bcrypt python-multipart
```

### Start FastAPI

```bash
python -m uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

## 📚 Step 3 — Open API Documentation

FastAPI automatically provides interactive API documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

From Swagger UI, you can view and test the available API endpoints.

---

## 💻 Step 4 — Start the Frontend

Open a new terminal.

Navigate to the frontend:

```bash
cd frontend
```

Install the required packages:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

Open this address in your browser.

---

## 🔐 Step 5 — Login

The frontend provides a login page where users can enter:

- Email
- Password

The login form sends the credentials to the FastAPI backend.

If the credentials are valid, the backend returns a JWT access token.

The token is stored in the browser using:

```text
localStorage
```

---

## 👤 Step 6 — User Information

After successful login, the frontend requests the authenticated user's information using:

```text
GET /me
```

The JWT token is sent with the request:

```text
Authorization: Bearer <token>
```

The dashboard displays information such as:

- User name
- Email
- User ID
- Role ID
- Team ID

---

## 🗄️ Database Structure

The project uses PostgreSQL as the database.

The current database structure contains the following tables:

### Roles

Stores the different roles available in the platform.

Current roles:

- Employee
- Reviewer
- Manager
- Administrator

### Teams

Stores team information.

### Users

Stores user information including:

- User ID
- Name
- Email
- Password hash
- Role ID
- Team ID

### User Profiles

Stores additional information about users, including:

- Phone
- Department
- Designation
- Profile image

---

## 🏗️ Project Structure

```text
Expert-Decision-Replay-Platform/
│
├── Backend/
│   ├── Schemas/
│   │   ├── __init__.py
│   │   ├── team.py
│   │   └── user.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── database.py
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

## 🎯 Milestone 2

Milestone 2 establishes core Decision Management, Alternative Comparison & Trade-off Analysis, Document Management, Discussion Threads with Meeting Notes, Version Tracking, and the Knowledge Repository with an interactive Knowledge Graph and Insights engine.

### Completed

- **Decision Management**:
  - Full CRUD operations for organizational decisions (`/decisions`, `/decisions/{id}`)
  - Lifecycle state machine: `Draft`, `Under Review`, `Approved`, `Rejected`, `Archived`
  - Multi-attribute tracking: Problem statement, Objective, Context, Category, Priority, Owner, Team
  - Multi-step Decision Creation wizard
- **Alternative Analysis Matrix**:
  - Structured alternative modeling (`DecisionAlternative`)
  - Comparative metrics: Pros, Cons, Cost estimate, Feasibility score (1-10), Risk level & Mitigation plan
  - Solution selection mechanism with formal executive decision rationale recording
- **Document Management & File Uploads**:
  - File upload engine with local storage (`uploads/`)
  - Document categorization, tagging, and direct linking to decisions
  - Direct file download and in-browser metadata preview modal
- **Discussion Module & Meeting Minutes**:
  - Threaded discussions and stakeholder comments
  - Formal meeting minutes tracker with attendees logging and decision conclusions
- **Version Tracking & Decision Replay**:
  - Automatic snapshot generation upon every decision modification (`decision_versions`)
  - Full audit trail recording changed fields, timestamps, and contributing author
- **Knowledge Repository & Graph Visualizer**:
  - High-fidelity interface matching DecisionIntel design
  - Summary metric cards (Total Documents, Decision Documents, Teams Contributed, Recently Added)
  - Interactive SVG node-link Knowledge Graph visualizing relationships between Decisions, Alternatives, People, Teams, Documents, and Outcome states
  - Related Insights engine (Similar decisions, Common factors, Recommended reading)
  - Popular topics filter pills and real-time recent activity stream

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

## 📌 Current Status: Phase 3 / Milestone 3 (Completed)

The platform now implements full **Governance, Multi-Stage Approvals, Immutable Audit Logging, Analytics & Multi-Format Reporting, and Dynamic Role Dashboards**:

```text
Draft Decision
  ↓
Submit for Review
  ↓
Stage 1: Peer Technical Review (Reviewer sign-off / feedback / revisions)
  ↓
Stage 2: Executive Sign-off (Manager approval)
  ↓
Approved Decision (Replay Active in Knowledge Graph)
  ↓
Automated Event Notifications & Immutable Audit Trail (Security, Activity, Access, Decision)
  ↓
1-Click Analytics Exports (Excel .xlsx, CSV, Executive PDF)
```

---

## 🌟 Milestone 3 Capabilities

### 1. Multi-Stage Approval State Machine
- **Stage 1 (Peer Reviewer)**: Technical assessment, trade-off verification, and feasibility review.
- **Stage 2 (Engineering Manager)**: Executive sign-off, budget authorization, and organizational alignment.
- **Actions**: Approve Stage, Request Revisions / Changes, Reject Decision, and Escalate Review.
- **SLA Tracking & Escalation**: High-priority decisions automatically flagged or manually escalated for overdue turnaround bottlenecks.
- **Visual Stepper & Action History**: In-depth timeline recording reviewer rationale, comments, and decision audit trails.

### 2. In-App Notification Center
- Real-time polling drawer with unread counter badges.
- Filtering by category (`All`, `Unread`, `Approvals`, `Escalations`).
- Actions for individual mark-as-read and "Mark All as Read".
- Direct deep-links to active approval queues and decision records.

### 3. Immutable Audit & Compliance Engine
- Comprehensive logging across 4 distinct categories:
  - **Activity**: Decision creation, alternative updates, comments, and version rollbacks.
  - **Security**: Login successes, logout events, and authentication failures with client IP & user agent.
  - **Access**: File downloads and confidential document access.
  - **Decision / Governance**: Multi-stage approval submissions, endorsements, rejections, and escalations.
- Full-text search and category filtering with detail inspection modals.

### 4. Reports & Analytics Engine with 1-Click Multi-Format Exports
- **Decision Velocity**: Average turnaround days, pipeline distribution, consensus alignment rate.
- **Team Contribution Matrix**: Departmental decisions, active member participation, and approval volume.
- **Multi-Format Document Export**:
  - **Excel (`.xlsx`)**: Formatted multi-tab workbook using `pandas` and `xlsxwriter`.
  - **CSV (`.csv`)**: Raw tabular audit and decision extracts.
  - **Executive PDF (`.pdf`)**: Polished PDF executive summary generated via `fitz` (PyMuPDF) featuring decision problem statements, trade-offs, evaluated alternatives, and signed approval trails.

### 5. Role-Based Dynamic Dashboards
- **Employee**: My Decisions, In-Draft Tasks, Awaiting Review, Knowledge Preserved.
- **Reviewer**: Stage 1 Review Queue, Peer Feedback dispatched, SLA Escalation Flags, Review Velocity.
- **Manager**: Stage 2 Final Approval Queue, Team Decisions, Departmental Consensus, Turnaround Metrics.
- **Administrator**: User Management, Immutable Audit Event Ledger, Security Alerts, System Operational Health.
- **Role Switcher**: Fast switching between role perspectives directly from the top bar or dashboard banner.

---

## 🎯 Milestone 4: Production Deployment, Hardening & Testing (Completed)

Milestone 4 concludes the development cycle with end-to-end automated testing, bug fixes, containerized Docker orchestration, production documentation, and the final presentation deck.

### 🌟 Milestone 4 Capabilities & Deliverables

#### 1. Multi-Container Production Docker Stack
- **Docker Compose Orchestration**: Single command (`docker compose up -d --build`) provisions the complete ecosystem:
  - `postgres` (PostgreSQL 15 Alpine with persistent volume and healthchecks)
  - `redis` (Redis 7 Alpine in-memory cache)
  - `backend` (FastAPI Python 3.10 ASGI server running non-root container with auto-seeding)
  - `frontend` (Vite React 18 multi-stage build served through high-performance Nginx Alpine reverse proxy)
- **Container Hardening**: Non-root container execution, gzip compression, security headers (`X-Frame-Options`, `X-Content-Type-Options`), persistent volume isolation, and container health probes.
- **Reference**: Detailed in [DEPLOYMENT.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/DEPLOYMENT.md).

#### 2. Comprehensive Automated Testing & Regression Suite
- **Unified Test Runner**: `python run_all_tests.py` executes all test suites sequentially with formatted summary table reporting.
- **Milestone 4 Test Suite** (`test_milestone4.py`):
  - System diagnostics and production health probes (`/health`, `/`).
  - Role-Based Access Control (RBAC) security boundary tests: validates that Employee accounts are blocked (HTTP 403) from approving review stages.
  - Negative authentication testing: bad password rejection (HTTP 401), unauthenticated route rejection (HTTP 401).
  - Full end-to-end decision replay lifecycle: creation, dynamic alternative addition, rationale selection, document upload/byte download, threaded comments, ARB meeting notes, multi-stage approval, SLA escalation, notification delivery, immutable audit logs, multi-format exports (PDF, Excel, CSV), Knowledge Graph connectivity, and dynamic KPI dashboards.
  - 100% test pass rate across all suites.
- **Reference**: Detailed in [TESTING_REPORT.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/TESTING_REPORT.md).

#### 3. Bug Fixes & Production Hardening
- **Database Path Resolution**: Resolved SQLite URL fallback to absolute path relative to project root, allowing tests to run from any working directory without schema drift.
- **Dependency Hygiene**: Pinned missing production dependencies (`pandas`, `openpyxl`, `xlsxwriter`, `PyMuPDF`, `pytest`, `httpx`) in `requirements.txt`.
- **FastAPI Lifespan Migration**: Modernized startup handlers from deprecated `@app.on_event("startup")` to Starlette `lifespan` context manager.
- **Pydantic v2 Migration**: Migrated all schemas across models to `model_config = ConfigDict(from_attributes=True)`.
- **Healthcheck Observability**: Configured `/health` endpoint returning HTTP 200/503 for container orchestration liveness probes.

#### 4. Complete Project Documentation & Defense Deck
- 📚 [DEPLOYMENT.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/DEPLOYMENT.md): Enterprise deployment runbook (Docker, manual, reverse proxy, backups, SSL/TLS).
- 📖 [API_DOCUMENTATION.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/API_DOCUMENTATION.md): Complete OpenAPI reference across all 30+ endpoints.
- 🧪 [TESTING_REPORT.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/TESTING_REPORT.md): Testing matrix, verification results, and security boundary tests.
- 🎓 [FINAL_PRESENTATION.md](file:///c:/Users/alanv/OneDrive/Desktop/expert%20decision%20replay%20platform/Expert-Decision-Replay-Platform/FINAL_PRESENTATION.md): Full slide deck and defense script for project presentation and evaluation.

---

## 👥 Seeded User Accounts (Development / Demo)

| Email | Password | Role | Primary Responsibility |
|---|---|---|---|
| `admin@company.com` | `password123` | Administrator | Overall platform, security logs, and compliance |
| `emp@company.com` | `password123` | Employee | Decision authoring, alternative definition, discussions |
| `reviewer@company.com` | `password123` | Reviewer | Stage 1 technical review and feedback |
| `manager@company.com` | `password123` | Manager | Stage 2 executive approvals and team analytics |

---

## 🧪 Automated Test Verification

### Run the Unified Test Runner (All Milestones)
From the repository root:

```bash
python run_all_tests.py
```

### Run with Pytest
```bash
python -m pytest Backend/test_milestone2.py Backend/test_milestone3.py Backend/test_milestone4.py -v
```

### Run Milestone 4 Individually
```bash
python Backend/test_milestone4.py
```

All 3 suites pass with **100% success rate**.

---

## 🐳 Docker 1-Click Deployment

Launch the complete stack (PostgreSQL, Redis, FastAPI, React/Nginx):

```bash
docker compose up -d --build
```

Access services at:
- **Web Application**: `http://localhost` (or `http://localhost:5173`)
- **Interactive API Docs**: `http://localhost:8000/docs`
- **Healthcheck Probe**: `http://localhost:8000/health`

---

## 📄 License

This project is developed as part of the Expert Decision Replay Platform project.


