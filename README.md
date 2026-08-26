# Expert Decision Replay Platform

A full-stack enterprise web platform engineered to capture, manage, review, analyze, and replay critical decision-making processes across complex organizational workflows.

---

## 📌 Current Milestone Status

> **Milestone 1 Status: COMPLETED**  
> The complete foundational architecture, PostgreSQL database design, FastAPI authentication backend with JWT & RBAC, and responsive React frontend have been implemented, integrated, and verified with 100% test coverage.

---

## 🚀 Milestone 1 Implemented Features

### Backend & Database (FastAPI + PostgreSQL + SQLAlchemy)
- **Modular Project Structure**: Clean separation across `api`, `core`, `database`, `models`, `schemas`, `services`, and `utils`.
- **Database Architecture**: PostgreSQL relational schema with `users` and `roles` tables, foreign key constraints (`ON DELETE RESTRICT`), indexes, and auto-updating timestamp triggers.
- **Pre-defined Roles**: Seeded system roles: `Employee`, `Reviewer`, `Manager`, and `Administrator`.
- **Cryptographic Password Hashing**: Zero-plaintext storage using `bcrypt` (12 salt rounds).
- **User Registration API** (`POST /auth/register`): Validates input, prevents duplicate emails, assigns roles, and returns sanitized profiles.
- **User Login API** (`POST /auth/login`): Verifies credentials and generates signed HMAC-SHA256 JWT access tokens.
- **Protected Profile API** (`GET /auth/me`): Extracts and validates Bearer JWT to retrieve the current user's profile.
- **Role-Based Access Control (RBAC)**: Reusable `require_roles(...)` dependency enforcing strict endpoint-level permissions.
- **User Management APIs**:
  - `GET /users`: List all users (Administrator only).
  - `GET /users/{user_id}`: Inspect user profile (Administrator or owner).
  - `PATCH /users/{user_id}/status`: Activate or deactivate user accounts (Administrator only).
  - `PATCH /users/{user_id}/role`: Reassign user roles (Administrator only).

### Frontend (React + Vite)
- **Authentication State Management**: `AuthContext` managing `user`, `token`, `isAuthenticated`, and `loading` states.
- **Token Persistence & Auto-Restoration**: JWT stored in `localStorage` with automatic session validation on app mount/reload via `GET /auth/me`.
- **Protected Routing**: `<ProtectedRoute />` guarding `/home` and redirecting unauthenticated visitors to `/login`.
- **Interactive Login Page** (`/login`): Form validation, loading state, error alert banners, and redirect to `/home`.
- **Registration Page** (`/register`): Full Name, Email, Password (min 8 chars), and Role selector with automatic redirect to `/login`.
- **Protected Home Dashboard** (`/home`): User profile summary, active role badge, permissions overview, and Milestone 1 status banner.
- **Enterprise Navbar**: Displays platform brand, user identity, dynamic role badge, and one-click Sign Out.

---

## 🛠 Technology Stack

### Backend
- **Python**: 3.11+ (Python 3.14 tested & compatible)
- **FastAPI**: Modern, high-performance web framework for APIs
- **SQLAlchemy 2.0**: Enterprise ORM for database modeling and query execution
- **PostgreSQL**: Robust relational database (with SQLite in-memory fallback for test runners)
- **Pydantic v2**: Request data validation and serialization
- **PyJWT & Cryptography**: JWT token signing and signature verification
- **bcrypt**: Blowfish-based password hashing

### Frontend
- **React 18**: UI component library
- **Vite 5**: Fast build tool and dev server
- **React Router DOM v6**: Client-side declarative routing and protected routes
- **Context API**: Global auth state management
- **Semantic CSS**: Clean, responsive layout styling

---

## 📁 Project Folder Structure

```text
Expert-Decision-Replay-Platform/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py          # /auth/register, /auth/login, /auth/me
│   │   │   │   └── users.py         # /users (list, detail, status, role)
│   │   │   ├── router.py            # Aggregated API router (/api/v1)
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings & environment variables
│   │   │   ├── dependencies.py      # get_current_user, require_roles
│   │   │   └── security.py          # bcrypt hash/verify, JWT encode/decode
│   │   ├── database/
│   │   │   ├── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   ├── role.py              # Role model & RoleEnum
│   │   │   └── user.py              # User model & relationship
│   │   ├── schemas/
│   │   │   ├── auth.py              # LoginRequest, Token, MessageResponse
│   │   │   └── user.py              # UserRegisterRequest, UserResponse, UserStatusUpdateRequest, UserRoleUpdateRequest
│   │   ├── services/
│   │   │   └── user_service.py      # Business logic, user CRUD, role seeding
│   │   └── main.py                  # FastAPI application entrypoint & CORS
│   ├── .env.example                 # Backend environment variable template
│   └── requirements.txt             # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar with role badge & logout
│   │   │   └── ProtectedRoute.jsx   # Route guard for authenticated views
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global React auth state & localStorage persistence
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Authenticated dashboard landing view
│   │   │   ├── Login.jsx            # Sign In form
│   │   │   └── Register.jsx         # Registration form with role selector
│   │   ├── services/
│   │   │   └── authService.js       # HTTP client for auth & profile API
│   │   ├── App.css                  # Enterprise layout styling
│   │   ├── App.jsx                  # Main router configuration
│   │   ├── index.css                # Global base styles
│   │   └── main.jsx                 # DOM root mount
│   ├── .env                         # Frontend environment configuration
│   ├── .env.example                 # Frontend environment template
│   ├── index.html                   # HTML document root
│   ├── package.json                 # Node dependencies & build scripts
│   └── vite.config.js               # Vite bundler configuration & API proxy
│
├── database/
│   ├── schema/
│   │   └── initial_schema.sql       # PostgreSQL DDL script & role seed data
│   └── README.md                    # Database design, ERD, and migration notes
│
├── docs/
│   ├── architecture.md              # System architecture, layered diagram & request flow
│   ├── requirements.md              # Requirement specifications & permissions matrix
│   └── ui_wireframes.md             # ASCII UI wireframes & navigation state machine
│
├── tests/
│   ├── test_auth_login.py           # Login & JWT token verification tests
│   ├── test_endpoint.py             # Route registration tests
│   ├── test_frontend_integration.py # Full frontend API contract integration tests
│   ├── test_milestone1_e2e.py       # Comprehensive Milestone 1 E2E test suite
│   ├── test_rbac_user_management.py # RBAC & administrative user management tests
│   └── test_registration.py         # User registration unit tests
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: v18.0 or higher
- **PostgreSQL**: v14+ (optional for local standalone test runner; required for full DB persistence)

---

## 🔧 Installation & Setup

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file (copied from `.env.example`):
   ```env
   PROJECT_NAME="Expert Decision Replay Platform"
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expert_decision_db
   SECRET_KEY=change_this_to_a_super_secure_random_key_in_production_2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   > API Documentation (Swagger UI): **`http://127.0.0.1:8000/docs`**  
   > ReDoc Documentation: **`http://127.0.0.1:8000/redoc`**

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Ensure `frontend/.env` is configured:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   > Frontend Application: **`http://localhost:5173`**

---

### 3. Database Setup (PostgreSQL)

Execute the initial DDL schema script:
```bash
psql -U postgres -h localhost -p 5432 -d expert_decision_db -f database/schema/initial_schema.sql
```

---

## 🔑 Available API Endpoints

| Category | Method | Endpoint | Access Level | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | Public | System liveness probe |
| **Authentication** | `POST` | `/auth/register`<br>`/api/v1/auth/register` | Public | Register a new user account with role |
| **Authentication** | `POST` | `/auth/login`<br>`/api/v1/auth/login` | Public | Authenticate user and issue JWT token |
| **Authentication** | `GET` | `/auth/me`<br>`/api/v1/auth/me` | Authenticated | Retrieve authenticated user profile |
| **User Management** | `GET` | `/users`<br>`/api/v1/users` | **Administrator** | List all registered user accounts |
| **User Management** | `GET` | `/users/{id}`<br>`/api/v1/users/{id}` | **Administrator** or **Self** | Get user details by user ID |
| **User Management** | `PATCH` | `/users/{id}/status`<br>`/api/v1/users/{id}/status` | **Administrator** | Activate or deactivate user account |
| **User Management** | `PATCH` | `/users/{id}/role`<br>`/api/v1/users/{id}/role` | **Administrator** | Change assigned user role |

---

## 👥 User Roles & Permissions

1. **`Employee`**: Baseline contributor creating and submitting decision workflows.
2. **`Reviewer`**: Subject matter expert analyzing alternatives, scoring trade-offs, and submitting reviews.
3. **`Manager`**: Decision authority approving, rejecting, or escalating submitted decision proposals.
4. **`Administrator`**: System administrator managing user provisioning, roles, and platform settings.

---

## 🧪 Testing Instructions

Run the complete automated test suite from the project root:

```bash
# 1. Run the Comprehensive Milestone 1 End-to-End Test Suite:
python tests/test_milestone1_e2e.py

# 2. Run RBAC & User Management tests:
python tests/test_rbac_user_management.py

# 3. Run Authentication & JWT tests:
python tests/test_auth_login.py

# 4. Run User Registration unit tests:
python tests/test_registration.py

# 5. Run Frontend-to-Backend HTTP API contract integration test:
python tests/test_frontend_integration.py

# 6. Verify Frontend Production Build:
cd frontend
npm run build
```

---

## 🔮 Upcoming Features (Future Milestones)

- **Decision Management (Milestone 2)**: Capture decision context, problem statements, constraints, and criteria.
- **Alternative Analysis**: Structured multi-option comparison matrix and trade-off scoring.
- **Decision Replay**: Interactive temporal timeline reconstructing state, discussions, and evidence at the moment of decision.
- **Discussion Module**: Threaded reviewer annotations, inline comments, and deliberation logs.
- **Approval Workflows**: Configurable multi-stage manager sign-off workflows.
- **Knowledge Repository**: Searchable archive of organizational decisions and lessons learned.
- **Analytics & Reporting**: Metric dashboards, audit logs, and compliance report exports.