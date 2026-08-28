# Expert Decision Replay Platform (EDRP)

An enterprise full-stack web application for recording, analyzing, approving, searching, and replaying strategic organizational decisions. EDRP preserves institutional memory by capturing not just **what** decisions were made, but **why** they were made.

---

## ?? Platform Architecture & Features

- **Decision Case Files**: Comprehensive structured dossiers capturing problem statements, context, candidate alternatives, weighted criteria, risk assessments, stakeholders, and retrospective outcomes.
- **Alternative & Decision Matrix Scoring**: Quantitative multi-criteria decision analysis (MCDA) with weighted scoring engine ($\sum (s_i \cdot w_i) / \sum w_i$) and instant matrix recalculations.
- **Multi-Tier Approval Workflows**: State machine governance pipeline (Draft $\rightarrow$ Peer Review $\rightarrow$ Management Sign-Off $\rightarrow$ Approved / Rejected / Changes Requested).
- **Immutable Version History & Visual Diff Engine**: Automatic snapshotting on case file updates with field-by-field difference inspection.
- **Interactive Collaboration**: Threaded discussions with nested comment replies and timestamped Architecture Review Board (ARB) meeting minutes.
- **Document & File Management**: Secure attachments repository supporting benchmarks, specs, and diagrams with metadata validation.
- **Reporting & Data Export**: Direct on-demand generation of comprehensive **PDF Case Files** (ReportLab) and multi-sheet **Excel Workbooks** (openpyxl).
- **Executive Analytics & KPI Dashboards**: Real-time role-tailored dashboards with Recharts visualizations for lifecycle distribution, category breakdowns, and turnaround velocity.
- **Compliance Audit Trail**: Tamper-evident logging of all actor activities, state transitions, client IPs, and payload metadata.

---

## ?? System Roles & Demo Credentials

| Role | Email | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@edrp.org` | `Password123!` | Full governance, RBAC role assignment, user activation, immutable audit trail, platform analytics. |
| **Manager** | `manager@edrp.org` | `Password123!` | Executive sign-off authorization, team decision oversight, department velocity metrics. |
| **Reviewer** | `reviewer@edrp.org` | `Password123!` | Technical & peer architecture verification, review queue approvals, change requests. |
| **Employee** | `employee@edrp.org` | `Password123!` | Decision case authoring, alternative proposal, discussion participation, outcome tracking. |

---

## ?? Quick Start (Docker Compose)

The easiest way to launch the complete full-stack environment:

```bash
docker compose up --build -d
```

- **Frontend Application**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173) in dev)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: `localhost:5432` (`edrp` / `edrp`)

---

## ?? Local Development Setup

### 1. Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+ (Node 20+ recommended)
- **Docker**: For running PostgreSQL (or a local PostgreSQL instance)

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # On Linux/macOS: cp .env.example .env
```

Start the database (from the project root):
```bash
docker compose up -d db
```

Run database migrations and seed demo data:
```bash
cd backend
alembic upgrade head
python -m app.db.seed
```

Start the FastAPI development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at `http://localhost:5173`.

---

## ?? Testing

Run the full automated test suite covering authentication, authorization, decision workflows, evaluation matrices, reports, and analytics:

```bash
cd backend
python -m pytest
```

---

## ?? Project Structure

```
expert-decision-replay-platform/
??? backend/
?   ??? alembic/                  # Database migration scripts
?   ??? app/
?   ?   ??? api/                  # API routes & dependency injection
?   ?   ?   ??? v1/endpoints/     # Auth, Decisions, Approvals, Reports, Audit, etc.
?   ?   ??? core/                 # Config, Security, JWT, Exceptions
?   ?   ??? db/                   # Database session, base models, seed script
?   ?   ??? models/               # SQLAlchemy models (Identity, Decision, Collaboration, Taxonomy)
?   ?   ??? schemas/              # Pydantic validation & response schemas
?   ?   ??? services/             # Business logic (Scoring, Versions, Approvals, Reports, Audit)
?   ??? tests/                    # Pytest integration & unit test suite
?   ??? Dockerfile
?   ??? requirements.txt
??? frontend/
?   ??? src/
?   ?   ??? api/                  # Axios HTTP client with JWT refresh interceptors
?   ?   ??? components/           # SaaS layout, sidebar, status badges
?   ?   ??? context/              # AuthContext & RBAC state
?   ?   ??? pages/                # Login, Register, Dashboard, Decisions, Reviews, Reports, Admin
?   ??? Dockerfile
?   ??? nginx.conf
?   ??? package.json
??? docker-compose.yml
??? README.md
```
