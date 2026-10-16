# Expert Decision Replay Platform (EDRP) — Complete Platform (Milestones 1 – 4)

Centralized web application for documenting organizational decisions, evaluating alternatives with quantitative trade-off scoring, conducting threaded discussions, and tracking full audit histories with real-time updates and exportable PDF/CSV reports.

---

## Complete Feature Matrix across Milestones

- **Milestone 1 — Foundation:** User registration, JWT auth, Role-Based Access Control (`Employee`, `Reviewer`, `Manager`, `Administrator`), and team management.
- **Milestone 2 — Decisions & History:** Decision lifecycle management, alternative scoring & auto-recommendations, threaded discussion, file attachments, and immutable version snapshots.
- **Milestone 3 — Analytics & Graph Visualizer:** Executive dashboard analytics, multi-stage approval workflow engine, system-wide audit logging, and dynamic graph visualization.
- **Milestone 4 — Search, Exports, Real-Time & Docker:**
  - 🔍 **Advanced Search & Multi-Criterion Filtering:** Full-text search across titles, problem statements, rationale, and options (`/decisions/search`), live debounced search header with dropdown results.
  - 📄 **PDF & CSV Report Generator:** ReportLab-powered PDF exports for individual decisions (`/reports/decisions/{id}/export/pdf`) and executive summaries (`/reports/decisions/export/pdf`).
  - ⚡ **Real-Time WebSockets:** Live WebSocket notification channel (`/notifications/ws`) with real-time UI toast popups and badge counters.
  - 🐳 **Dockerization & Production Stack:** `Dockerfile` for Backend and Frontend, plus `docker-compose.yml` for unified deployment with PostgreSQL.

---

## Project Architecture & Structure

```
edrp-milestone4/
├── Backend/
│   ├── main.py
│   ├── models/           (User, Role, Team, Decision, Alternative, Comment, Attachment, Version, ApprovalStep, Notification, AuditLog)
│   ├── routers/          (decisions, alternatives, comments, attachments, versions, approvals, notifications, reports, audit_log, dashboard)
│   ├── security/         (auth, jwt, audit, websocket_manager)
│   ├── Schemas/          (Pydantic request/response schemas)
│   ├── tests/            (44 Pytest unit & integration tests covering Milestones 1-4)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   (Header with live search & WS, Sidebar, StatusBadge, Modals, Tabs)
│   │   ├── pages/        (Dashboard, DecisionsList, DecisionDetail, Repository, Reports, AuditLogs, Teams, Admin, Notifications, Profile)
│   │   ├── api.js
│   │   └── AuthContext.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Running the Application

### Option A: Local Development

1. **Backend:**
   ```bash
   cd Backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pytest -v tests/                  # Run full automated test suite (44/44 passing)
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev                       # Runs on http://localhost:5173
   ```

### Option B: Unified Docker Compose

Run the entire application stack (PostgreSQL, FastAPI Backend, Nginx Frontend) with one command:

```bash
docker-compose up --build
```

- **Frontend Application:** http://localhost:5173
- **FastAPI API Documentation:** http://localhost:8000/docs
