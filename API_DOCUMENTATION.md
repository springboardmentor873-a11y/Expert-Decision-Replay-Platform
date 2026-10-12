# 📖 Complete API Reference Specification
## Expert Decision Replay Platform

The Expert Decision Replay Platform backend exposes a RESTful API built on **FastAPI** with OAuth2/JWT authentication, Pydantic schemas, and SQLAlchemy ORM.

Interactive Swagger UI documentation is accessible at:
```text
http://127.0.0.1:8000/docs
```
Interactive Redoc documentation is accessible at:
```text
http://127.0.0.1:8000/redoc
```

---

## 📑 Summary of Endpoint Groups

| Module | Base Path | Description |
|---|---|---|
| **System & Diagnostics** | `/`, `/health` | Liveness, readiness, and milestone metadata |
| **Authentication & Users** | `/login`, `/me`, `/register`, `/roles` | JWT issuance, role validation, profiles |
| **Teams & Organizations** | `/teams`, `/teams/{id}/members` | Departmental groupings and assignment |
| **Decision Management** | `/decisions`, `/decisions/{id}` | Creation, updating, versioning, status |
| **Alternative Analysis** | `/decisions/{id}/alternatives` | Trade-offs, pros/cons, scoring (1-10) |
| **Discussions & Meetings**| `/decisions/{id}/comments` | Stakeholder comments & formal ARB minutes |
| **Documents & Attachments**| `/documents/upload`, `/download` | PDF/file attachments and metadata storage |
| **Approval Workflow** | `/decisions/{id}/submit-for-approval` | Multi-stage approvals, SLA escalation |
| **In-App Notifications** | `/notifications` | Role-based polling drawer & read receipts |
| **Audit & Compliance** | `/audit/logs`, `/audit/stats` | Immutable ledger across 4 categories |
| **Reports & Exports** | `/reports/*`, `/reports/export/*` | Executive PDF, multi-tab Excel, CSV extracts |
| **Dynamic Dashboards** | `/dashboard/role-metrics` | Role-specific KPIs and summary widgets |
| **Knowledge Repository** | `/knowledge-repository/*` | Interactive SVG Knowledge Graph & Insights |

---

## 1. System & Health Diagnostics

### `GET /`
Returns service status, version, and milestone identifier.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "message": "Expert Decision Replay Platform API is running",
  "version": "1.0.0",
  "status": "online",
  "milestone": "Milestone 4 - Production Deployment, Testing & Enterprise Verification"
}
```

### `GET /health`
Kubernetes and Docker container healthcheck probe.
- **Auth**: None
- **Response**: `200 OK` (Healthy) or `503 Service Unavailable` (DB disconnect)
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-10-11T15:30:00.000000",
  "environment": "production"
}
```

---

## 2. Authentication & User Management

### `POST /login`
Authenticates user credentials and returns a Bearer JWT access token.
- **Body**:
```json
{
  "email": "emp@company.com",
  "password": "password123"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "name": "Employee User",
    "email": "emp@company.com",
    "role_name": "Employee"
  }
}
```

### `GET /me`
Retrieves authenticated user profile and permissions.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "id": 2,
  "name": "Employee User",
  "email": "emp@company.com",
  "role_id": 1,
  "role_name": "Employee",
  "team_id": 1,
  "team_name": "Core Platform Engineering"
}
```

---

## 3. Decision Management & Versioning

### `POST /decisions`
Creates a new organizational decision proposal in `Draft` state.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "Quantum Safe Post-Quantum Cryptography (PQC) Transition",
  "problem_statement": "Evaluate NIST-standardized Kyber/Dilithium algorithms...",
  "objective": "Transition TLS endpoints to hybrid post-quantum cipher suites.",
  "context": "Federal compliance mandates compatibility by 2027.",
  "category": "Security",
  "priority": "Critical",
  "initial_alternatives": [
    {
      "title": "Hybrid X25519 + ML-KEM-768",
      "description": "Dual key exchange offering classical and post-quantum security.",
      "pros": ["Zero classical compromise risk", "NIST recommended"],
      "cons": ["1.2KB handshake size"],
      "cost_estimate": "$4,000 one-time",
      "feasibility_score": 9,
      "risk_level": "Low",
      "mitigation_plan": "Staged canary rollout across microservices."
    }
  ]
}
```
- **Response**: `200 OK`

### `GET /decisions/{id}`
Fetches complete decision dossier including alternatives, documents, comments, and version history.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 4. Alternative Analysis & Trade-Off Matrix

### `POST /decisions/{id}/alternatives`
Appends a candidate alternative option to an existing decision proposal.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "Option 2: Standalone Hardware Security Module (HSM) Refresh",
  "description": "Procure FIPS 140-3 Level 4 hardware appliances.",
  "pros": ["Tamper-evident physical enclosure"],
  "cons": ["$85,000 procurement lead time"],
  "cost_estimate": "$85,000 CAPEX",
  "feasibility_score": 6,
  "risk_level": "Medium",
  "mitigation_plan": "Multi-vendor tender process."
}
```
- **Response**: `200 OK`

### `POST /decisions/{id}/select-alternative`
Selects the winning alternative and officially records the executive rationale.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "selected_alternative_id": 15,
  "decision_rationale": "Option 1 provides optimal trade-off between implementation speed, low financial overhead, and cryptographic assurance."
}
```
- **Response**: `200 OK`

---

## 5. Multi-Tier Approval Workflow

### `POST /decisions/{id}/submit-for-approval`
Submits decision proposal for multi-tier governance review.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "action": "Submitted",
  "comments": "Formal submission for Stage 1 Peer Technical Review."
}
```
- **Response**: `200 OK` (`stage`: 1, `status`: "Under Review")

### `POST /decisions/{id}/approve-stage`
Approves the current review stage. RBAC verified (Reviewer for Stage 1, Manager for Stage 2).
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "action": "Approved",
  "comments": "Technical verification completed. Recommended for executive signoff."
}
```
- **Response**: `200 OK` (`stage`: 2 or `status`: "Approved")

### `POST /decisions/{id}/escalate`
Triggers immediate SLA escalation for overdue or critical priority decisions.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "escalation_reason": "Executive board meeting deadline on Friday."
}
```
- **Response**: `200 OK` (`is_escalated`: true)

---

## 6. Reports & Multi-Format Exports

### `GET /reports/export/excel?report_type=decisions`
Generates a formatted multi-sheet Excel spreadsheet (`.xlsx`) via pandas and xlsxwriter.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### `GET /reports/export/csv?report_type=decisions`
Extracts raw tabular decision and audit records as RFC 4180 CSV.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (`Content-Type: text/csv`)

### `GET /reports/export/pdf?decision_id={id}`
Generates an executive-formatted Decision Replay dossier PDF via PyMuPDF (`fitz`).
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (`Content-Type: application/pdf`)

---

## 7. Knowledge Repository & Graph

### `GET /knowledge-repository/graph?decision_id={id}`
Returns node-link topological graph mapping Decisions, Alternatives, People, Teams, and Documents.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "nodes": [
    {"id": "dec_24", "label": "PQC Transition", "group": "decision"},
    {"id": "alt_15", "label": "Hybrid X25519", "group": "alternative"},
    {"id": "user_2", "label": "Employee User", "group": "author"}
  ],
  "links": [
    {"source": "dec_24", "target": "alt_15", "relation": "evaluates"},
    {"source": "user_2", "target": "dec_24", "relation": "authored"}
  ]
}
```

### `GET /knowledge-repository/insights?decision_id={id}`
Retrieves semantic recommendations, similar decisions, and common success factors.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "similar_decisions": [...],
  "common_factors": [...],
  "recommended_reading": [...]
}
```
