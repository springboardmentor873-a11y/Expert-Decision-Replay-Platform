# Expert Decision Replay Platform

An enterprise platform engineered to capture, preserve, review, replay, and audit the full organizational context behind strategic and operational decisions.

---

## 1. Project Overview

Organizations make critical decisions every day, but the reasoning, trade-offs, evaluated alternatives, discussions, and approval workflows are frequently lost in email threads, meeting rooms, or ephemeral chat messages. When teams revisit past decisions, they only see the final outcome—never *why* the decision was made.

The **Expert Decision Replay Platform** solves this by establishing a permanent, searchable, and auditable system of record for organizational decision-making. It captures the entire lifecycle of a decision:

- **Problem & Context**: Underlying problem statement, background context, constraints, and business drivers.
- **Decision & Rationale**: The chosen course of action, detailed justification, and trade-off analysis.
- **Alternatives Analysis**: Structured comparison of evaluated alternatives, feasibility ratings, risk profiles, and pros/cons.
- **Collaboration**: Threaded discussions, meeting minutes, action items, and stakeholder inputs.
- **Supporting Documentation**: File attachments with path-traversal-protected persistent storage.
- **Version Tracking**: Immutable snapshotting of decisions whenever modified post-creation, with side-by-side diffing.
- **Approval Workflows**: Configurable multi-level approval stages (Peer Review, Manager Evaluation, Executive Sign-off) with SLA tracking and escalation.
- **Notifications & Audit Logging**: Real-time in-app alerts and tamper-resistant immutable audit trails.
- **Teams & Workspaces**: Role-governed team rosters, join requests, and scoped team decision spaces.
- **Knowledge Repository & Graph**: Interactive knowledge graph visualizing relationships among decisions, alternatives, authors, categories, and teams.
- **Reports & Analytics**: Comprehensive KPI dashboards, cycle-time metrics, outcome tracking, and multi-format exports (PDF, Excel, CSV).

---

## 2. Problem Statement

In modern enterprises, decision-making faces critical systemic challenges:

1. **Outcome-Only Storage**: Traditional ERP or project tools store what happened, not why it happened or what other paths were rejected.
2. **Knowledge Atrophy**: When key employees leave, the context behind critical architectural, operational, or vendor choices departs with them.
3. **Fragmented Workflows**: Proposals, stakeholder debates, meeting notes, and executive sign-offs are scattered across disconnected tools.
4. **Impossible Replay**: Post-mortems and compliance reviews struggle to reconstruct historical circumstances, resulting in repeated mistakes and duplicated evaluations.
5. **Lack of Accountability**: Without verifiable audit logs and structured multi-step approvals, governance remains weak.

---

## 3. Proposed Solution

The **Expert Decision Replay Platform** provides a centralized, cohesive solution:

- **Standardized Decision Record**: A structured schema covering problem, context, reasoning, expected outcomes, and actual post-implementation results.
- **Alternative Trade-Off Matrix**: Side-by-side evaluation of viable alternatives before reaching a conclusion.
- **Deterministic Lifecycles**: A disciplined state machine (`Draft` → `Submitted` → `Under Review` → `Approved` / `Rejected` / `Archived`).
- **Institutional Knowledge Graph**: Semantic visualization allowing engineers and leaders to explore interconnected decisions across departments.
- **Enterprise Governance**: Granular Role-Based Access Control (RBAC), multi-stage approval chains, and automated audit logging.

---

## 4. Key Implemented Features

### Authentication & Role-Based Access Control (RBAC)
- Secure user registration and login with bcrypt password hashing (12 rounds).
- Stateless JWT Bearer token authentication with configurable expiration.
- Four distinct enterprise roles: `Employee`, `Reviewer`, `Manager`, and `Administrator`.
- Administrative user management: account activation/deactivation and role reassignment.

### Decision Management & Lifecycle
- Create, view, edit, search, filter, and archive decisions.
- Strict state-machine transitions (`Draft`, `Submitted`, `Under Review`, `Approved`, `Rejected`, `Archived`).
- Ownership protection: Draft decisions can only be edited or submitted by their author (or an Administrator).
- Category and multi-tag taxonomy assignment.

### Alternative Comparison Matrix
- Evaluate alternatives per decision with pros, cons, feasibility ratings (1–10), and risk levels (`Low`, `Medium`, `High`, `Critical`).
- Designate the winning alternative (`is_chosen`) and compare attributes across candidates.

### Document Management
- Upload supporting documents (PDF, Word, Excel, PowerPoint, Text, CSV, Images) up to 10 MB.
- Secure disk storage in structured directory hierarchies (`uploads/decisions/{id}/`).
- Path-traversal sanitization and extension whitelisting.

### Threaded Discussions & Meeting Notes
- Hierarchical comments and nested replies per decision.
- Decision authors and reviewers can collaborate directly on the decision record.
- Structured meeting notes capturing dates, attendees, summaries, action items, and key takeaways.

### Decision Version Tracking & Replay
- Automated version snapshot creation whenever a decision's core fields are updated.
- Browse historical versions and inspect side-by-side field diffs between any two versions.

### Approval Workflows & Escalation
- Single-action reviews (`Approve` / `Reject` with review comments).
- Multi-step approval workflows (`approval_workflows` and `approval_steps`) supporting sequential approvals across roles.
- Overdue tracking against due dates with explicit escalation triggers.

### Notifications & In-App Alerts
- Real-time in-app notifications generated for submissions, approvals, rejections, discussion replies, and document uploads.
- Read status tracking, mark single read, mark all read, and unread badge count.

### Audit Logging & Compliance
- Immutable audit records capturing user, action (`CREATE`, `UPDATE`, `SUBMIT`, `APPROVE`, `REJECT`, `DELETE`, etc.), entity type, old/new values, and timestamp.
- Dedicated compliance query APIs with date, action, and user filters.

### Teams & Team Workspaces
- Multi-department team management with assigned Team Leads.
- Employee join requests with Team Lead approval/rejection workflows.
- Dedicated team workspaces showing team-scoped decisions, active members, and shared documents.

### Knowledge Repository & Knowledge Graph
- Centralized knowledge catalog with multi-dimensional filtering (category, status, team, tags, search).
- Interactive SVG/D3 knowledge graph visualizing nodes (Decisions, Users, Teams, Categories) and connecting edges.
- High-level repository insights (top categories, most active contributors, approval velocity).

### Global Search
- Fast cross-entity search endpoint (`/api/v1/search?q=...`) searching decisions and teams concurrently.

### Executive Dashboard & Reporting
- Real-time KPI summary cards (Total Decisions, Pending Approvals, Approval Rate, Active Teams).
- Decision status distribution, monthly trend analytics, and recent activity feeds.
- Comprehensive report generators with export capability to **PDF**, **Excel (.xlsx)**, and **CSV**.

### Profile & Settings
- User self-service profile inspection and name updates.
- Secure password change flow requiring old password verification.
- Read-only email enforcement to maintain identity integrity.

---

## 5. Enterprise Roles & RBAC Matrix

| Role | Permissions & Scope |
|---|---|
| **Employee** | Create and edit own draft decisions; add alternatives, documents, and meeting notes to own drafts; participate in discussions; view approved/public decisions; submit join requests for teams; view own team workspace. |
| **Reviewer** | All Employee capabilities plus: review decisions submitted for evaluation; approve or reject assigned decisions; view pending reviews queue; participate in decision discussions across assigned scopes. |
| **Manager** | All Reviewer capabilities plus: manage owned teams; approve/reject team join requests; participate in multi-step managerial approvals; view team-wide analytics and audit reports. |
| **Administrator** | Global organization-wide access: manage all users (activate, deactivate, reassign roles); manage all teams and categories; override any approval step; inspect system-wide immutable audit logs; archive/restore any decision. |

---

## 6. System Architecture

```
                                  USER BROWSER
                                       │
                                       ▼
                     React 18 Single Page Application
                           (Vite 5 / React Router)
                                       │
                                       │ HTTP / JSON / JWT
                                       ▼
                          FastAPI REST API Server
                         (Uvicorn ASGI Application)
                                       │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
                     ▼                                   ▼
          Business Services Layer              Persistent Storage
      (Auth, Decisions, Approvals,             (Document Uploads)
       Audit, Teams, Knowledge, etc.)                    │
                     │                         /app/uploads/decisions/{id}
                     ▼
             SQLAlchemy 2.0 ORM
                     │
                     ▼
            PostgreSQL Database
```

### Technology Stack

- **Backend**: Python 3.11+ / 3.14, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, PyJWT, bcrypt, psycopg2-binary.
- **Frontend**: React 18, Vite 5, React Router DOM v7, Lucide Icons, semantic modern CSS.
- **Database**: PostgreSQL 15 (production/containerized), SQLite (isolated unit testing).
- **Web Server / Reverse Proxy**: Nginx Alpine (production frontend container).
- **Orchestration**: Docker Compose v3.8.

---

## 7. Database Architecture

The platform operates on 19 relational entities:

| Table Name | Primary Responsibility |
|---|---|
| `roles` | System roles (`Employee`, `Reviewer`, `Manager`, `Administrator`). |
| `users` | User credentials, password hashes, status, and role references. |
| `categories` | Organizational classification for decisions. |
| `tags` & `decision_tags` | Many-to-many folksonomy tagging for decisions. |
| `decisions` | Core decision records (problem, context, decision, reasoning, status). |
| `decision_versions` | Immutable version snapshots capturing history and diffs. |
| `alternatives` | Evaluated alternative choices, feasibility scores, and risk ratings. |
| `discussions` | Threaded discussion comments and hierarchical replies. |
| `documents` | Attached document metadata, MIME types, and file storage paths. |
| `meeting_notes` | Synchronous meeting minutes, attendees, and action items. |
| `approvals` | Single-step reviewer decisions, comments, and decision timestamps. |
| `approval_workflows` | Multi-step sequential approval orchestrations. |
| `approval_steps` | Individual approval stages with assigned roles, due dates, and escalation state. |
| `notifications` | In-app user alerts, read states, and target entity references. |
| `audit_logs` | Immutable audit records capturing actors, actions, and old/new payloads. |
| `teams` | Organizational teams and assigned Team Leads. |
| `team_members` | Team membership associations and team-specific roles. |
| `team_join_requests` | Workflow records for employees requesting team membership. |

---

## 8. API Architecture Overview

All endpoints are organized modularly under `/api/v1/` (with direct root aliases for core resources):

- **`/api/v1/auth`**: User registration, login, profile inspection (`/me`).
- **`/api/v1/users`**: User management, roster lookup, status updates, role reassignments, password changes.
- **`/api/v1/decisions`**: Decision CRUD, submission, archiving, restoration, and child resource endpoints.
- **`/api/v1/approvals`**: Pending reviews queue, review history, approve/reject submissions.
- **`/api/v1/notifications`**: User alert inbox, unread counts, mark-read operations.
- **`/api/v1/audit-logs`**: Compliance audit records and audit report exports.
- **`/api/v1/teams`**: Team CRUD, membership, join request lifecycle, team workspaces.
- **`/api/v1/search`**: Global search across decisions and teams.
- **`/api/v1/reports`**: Analytic aggregations, timelines, and multi-format file exports (`/reports/export`).
- **`/api/v1/dashboard`**: Executive KPIs and summary metrics (`/dashboard/summary`, `/dashboard/kpis`).
- **`/api/v1/knowledge-repository`**: Repository index, graph topology (`/graph`), and strategic insights.

Interactive Swagger documentation is available locally at: `http://127.0.0.1:8000/docs`.

---

## 9. Security Controls

- **Cryptographic Password Protection**: All passwords hashed using `bcrypt` (12 rounds) with unique salts; zero plaintext passwords stored.
- **Token Security**: Stateless JWTs signed via HMAC-SHA256 (`HS256`) with strict signature validation on protected routes.
- **Role-Based Access Control**: Route-level dependency injection (`require_roles`) guarding unauthorized endpoints.
- **Object-Level Authorization**: Ownership validation ensuring employees cannot edit, submit, or delete decisions created by others.
- **File Upload Protection**: Extension whitelisting, file size limits (10 MB), stored filename UUID randomization, and path traversal sanitization.
- **Audit Immutability**: Dedicated append-only audit trail logging user actions with prior and modified state capture.
- **Input Sanitization**: Pydantic v2 schemas validating request types, strings, email syntax, and enum constraints.

---

## 10. Verification & Test Metrics

The platform has undergone comprehensive testing across all milestones:

| Test Area | Metric / Result | Status |
|---|---|---|
| **Backend Unit & Integration Suite** | `unittest discover -s tests -p "test_*.py"`: **244 / 244 Passed** | ✅ PASS (100%) |
| **CORS Middleware Suite** | `tests/test_cors.py`: Preflight & Origin checks passed | ✅ PASS (100%) |
| **Phase 4.2 Fix Verification** | `verify_phase42_fixes.py`: **11 / 11 Checks Passed** | ✅ PASS (100%) |
| **Frontend Production Build** | `npm run build`: **0 Errors, 0 Warnings** (Clean bundle) | ✅ PASS (100%) |

---

## 11. Docker Containerization & Deployment

The platform includes a complete, production-grade Docker setup:

- **`backend/Dockerfile`**: Python 3.11 slim image, dependency caching, health check probe, and Uvicorn runtime.
- **`frontend/Dockerfile`**: Multi-stage build (Node 20 builder -> Nginx Alpine runtime) with SPA fallback routing.
- **`docker-compose.yml`**: Orchestrates `postgres` (PostgreSQL 15), `backend`, and `frontend` across `expert_decision_network`.
- **Persistent Storage**: Named volumes `expert_decision_postgres_data` and `expert_decision_uploads_data`.

> [!NOTE]
> **Docker Validation Note**: Docker configuration files, multi-stage builds, and Compose definitions have been authored and verified for syntax. However, Docker Desktop was not installed on the development host during the final verification pass; therefore, live container runtime spin-up was not executed directly in Docker on this machine. Local development was 100% validated.

---

## 12. Local Development Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL 15+ running locally (or SQLite for automated test execution)

### 1. Backend Startup
```powershell
# Navigate to backend directory
cd backend

# Run Uvicorn server using project virtual environment
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Health Check: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Frontend Startup
```powershell
# Navigate to frontend directory
cd frontend

# Launch Vite development server
npm run dev
```
- Web Application: `http://localhost:5173/`

### 3. Run Backend Test Suite
```powershell
# From project root
.\backend\venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
```

---

## 13. Project Directory Structure

```text
Expert-Decision-Replay-Platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/            # Route controllers (auth, decisions, teams, etc.)
│   │   │   └── router.py          # Aggregator mounting /api/v1
│   │   ├── core/                  # Security, JWT, config, dependencies
│   │   ├── database/              # Engine, session, schema sync
│   │   ├── models/                # 19 SQLAlchemy relational models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── services/              # Business logic layer
│   │   └── main.py                # FastAPI application entrypoint
│   ├── uploads/                   # Persistent document attachments
│   ├── Dockerfile                 # Backend container definition
│   ├── .dockerignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI widgets, Sidebar, Header
│   │   ├── context/               # AuthContext & state providers
│   │   ├── pages/                 # Full-page views (Dashboard, Decisions, etc.)
│   │   ├── services/              # API communication layer
│   │   ├── App.jsx                # SPA routing configuration
│   │   └── main.jsx
│   ├── nginx.conf                 # Production Nginx SPA configuration
│   ├── Dockerfile                 # Multi-stage frontend container
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.js
│
├── docs/                          # Architecture, API, database & deployment docs
├── tests/                         # Unit, integration, and security test suite
├── docker-compose.yml             # Multi-service container orchestration
└── README.md
```

---

## 14. Milestone Progress Summary

| Milestone | Scope | Status |
|---|---|---|
| **Milestone 1** | Foundation, PostgreSQL Database, JWT Authentication, RBAC, User Management | **COMPLETE** |
| **Milestone 2** | Decision Capture, Alternatives, Discussions, Documents, Versions, Detail Views | **COMPLETE** |
| **Milestone 3** | Approvals, Multi-Step Workflows, Notifications, Audit Logging, Teams, Knowledge Repo, Reports | **COMPLETE** |
| **Milestone 4 — Phase 4.1** | Full System Testing & Comprehensive Quality Audit | **COMPLETE** |
| **Milestone 4 — Phase 4.2** | System Bug Fixing & Verification (5 Bugs Resolved, 11/11 Checks Passed) | **COMPLETE** |
| **Milestone 4 — Phase 4.3** | Docker Containerization (Configured & Documented; Runtime Pending Docker Desktop) | **PASS WITH ISSUES** |
| **Milestone 4 — Phase 4.4** | Final Comprehensive Project Documentation | **COMPLETE** |