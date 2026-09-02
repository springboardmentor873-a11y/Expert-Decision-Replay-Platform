# Expert Decision Replay Platform

An enterprise full-stack platform engineered to capture, manage, review, analyze, and replay critical decision-making processes across complex organizational workflows.

---

## 📌 Project Status

> **Milestone 1: COMPLETED** (Foundation, PostgreSQL Database, JWT Authentication, RBAC, User Management)  
> **Milestone 2: COMPLETED** (Decision Capture & Decision Management, Status Workflow, Dashboard, Detail Views)

---

## 🚀 Key Implemented Features

### 1. Decision Capture & Management (Milestone 2)
- **Structured Decision Capture**: Record Decision Title, Problem Statement, Background Context & Constraints, Decision Taken, Reasoning & Trade-offs, Expected Outcomes, and Actual Outcomes.
- **Controlled Lifecycle Status**: `Draft` → `Submitted` → `Under Review` → `Approved` / `Rejected`.
- **Decision Dashboard**: Live filtering by status badge, keyword search bar, and empty/loading states.
- **Decision Detail & Edit Views**: Full structured view with creator information, status badge, timestamps, and contextual actions.
- **Draft Submission**: Transition decisions from `Draft` to `Submitted` for review workflows.
- **Access Guard & Immutability**: Strict ownership check preventing unauthorized edits or deletions; lock core fields once submitted.

### 2. Authentication, RBAC & User Management (Milestone 1)
- **Zero-Plaintext Password Security**: Passwords salted and hashed with `bcrypt` (12 rounds).
- **Stateless JWT Authorization**: Bearer tokens with HMAC-SHA256 signature verification.
- **Enterprise Roles**: `Employee`, `Reviewer`, `Manager`, and `Administrator`.
- **User Management APIs**: Administrative user listing, account activation/deactivation, and role reassignments.
- **Protected React Frontend**: Context API (`AuthContext`), token persistence in `localStorage`, and `<ProtectedRoute />` route guards.

---

## 🛠 Technology Stack

### Backend
- **Python 3.11+ / 3.14**
- **FastAPI**: REST API Framework
- **SQLAlchemy 2.0**: Relational ORM
- **PostgreSQL**: Production relational database (with SQLite in-memory test runner)
- **Pydantic v2**: Request data validation & response serialization
- **PyJWT & bcrypt**: Cryptographic token signing and password hashing

### Frontend
- **React 18 & Vite 5**
- **React Router DOM v6**
- **Context API**: Global state
- **Semantic Modern CSS**: Responsive layouts & interactive styling

---

## 📁 Project Folder Structure

```text
Expert-Decision-Replay-Platform/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # /auth (register, login, me)
│   │   │   │   ├── decisions.py     # /decisions (create, list, get, patch, delete, submit)
│   │   │   │   └── users.py         # /users (list, get, status, role)
│   │   │   └── router.py            # API router aggregator (/api/v1)
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings & CORS
│   │   │   ├── dependencies.py      # get_current_user, require_roles
│   │   │   └── security.py          # bcrypt hash/verify, JWT encode/decode
│   │   ├── database/
│   │   │   └── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db
│   │   ├── models/
│   │   │   ├── decision.py          # Decision model & DecisionStatusEnum
│   │   │   ├── role.py              # Role model & RoleEnum
│   │   │   └── user.py              # User model & relationships
│   │   ├── schemas/
│   │   │   ├── auth.py              # LoginRequest, Token, MessageResponse
│   │   │   ├── decision.py          # DecisionCreateRequest, DecisionUpdateRequest, DecisionResponse
│   │   │   └── user.py              # UserRegisterRequest, UserResponse, UserStatusUpdateRequest, UserRoleUpdateRequest
│   │   ├── services/
│   │   │   ├── decision_service.py  # Decision CRUD, submission & authorization logic
│   │   │   └── user_service.py      # User CRUD, credential verification & role seeding
│   │   └── main.py                  # FastAPI app entrypoint & CORS middleware
│   ├── .env.example
│   └── requirements.txt
│
├── database/
│   ├── schema/
│   │   ├── initial_schema.sql       # PostgreSQL DDL for roles & users
│   │   └── decisions_schema.sql     # PostgreSQL DDL for decisions table
│   └── README.md
│
├── docs/
│   ├── architecture.md              # System architecture & request flow
│   ├── milestone2_decisions.md      # Milestone 2 decision capture & workflow docs
│   ├── requirements.md              # Functional & non-functional requirements
│   └── ui_wireframes.md             # UI wireframes & navigation flow
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DecisionCard.jsx         # Card component for decision listing
│   │   │   ├── DecisionStatusBadge.jsx  # Status badge component
│   │   │   ├── Navbar.jsx               # Top navigation with active links
│   │   │   └── ProtectedRoute.jsx       # Route guard for authenticated views
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global auth state & token persistence
│   │   ├── pages/
│   │   │   ├── CreateDecision.jsx       # Decision creation form
│   │   │   ├── DecisionDetails.jsx      # Decision details view
│   │   │   ├── Decisions.jsx            # Decision dashboard & filter grid
│   │   │   ├── EditDecision.jsx         # Decision update form
│   │   │   ├── Home.jsx                 # Authenticated home landing view
│   │   │   ├── Login.jsx                # Sign in page
│   │   │   └── Register.jsx             # User registration page
│   │   ├── services/
│   │   │   ├── authService.js           # Authentication API client
│   │   │   └── decisionService.js       # Decisions API client
│   │   ├── App.css                      # Modern enterprise styling
│   │   ├── App.jsx                      # React router configuration
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── tests/
│   ├── test_auth_login.py               # Authentication tests
│   ├── test_decisions.py                # Milestone 2 Decision Management test suite
│   ├── test_endpoint.py                 # Route registration tests
│   ├── test_frontend_integration.py     # Frontend API contract tests
│   ├── test_milestone1_e2e.py           # Milestone 1 E2E test suite
│   ├── test_rbac_user_management.py     # RBAC tests
│   └── test_registration.py             # User registration tests
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Quick Start

### 1. Start Backend (FastAPI)
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- **API URL:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`

### 2. Start Frontend (React + Vite)
```powershell
cd frontend
npm run dev
```
- **Web App:** `http://localhost:5173`

---

## 🧪 Testing Instructions

Run all test suites from the root directory:

```bash
# 1. Run Milestone 2 Decision Management Test Suite:
python tests/test_decisions.py

# 2. Run Milestone 1 E2E Test Suite:
python tests/test_milestone1_e2e.py

# 3. Run RBAC and User Management Test Suite:
python tests/test_rbac_user_management.py

# 4. Run Authentication & JWT Test Suite:
python tests/test_auth_login.py

# 5. Run Registration Test Suite:
python tests/test_registration.py

# 6. Verify Frontend Production Build:
cd frontend
npm run build
```

---

## 🔮 Upcoming Features (Future Milestones)

- **Alternative Analysis**: Multi-option scoring matrix and trade-off comparison.
- **Decision Replay**: Interactive temporal timeline reconstructing state, discussions, and evidence at the moment of decision.
- **Discussion Module**: Threaded reviewer annotations, inline comments, and deliberation logs.
- **Approval Workflows**: Configurable multi-stage manager sign-off workflows.
- **Knowledge Repository**: Searchable archive of organizational decisions and lessons learned.
- **Analytics & Reporting**: Metric dashboards, audit logs, and compliance report exports.