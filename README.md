# DecisionVault

> **Decision intelligence platform for capturing, comparing, discussing, and preserving organizational decisions.**

DecisionVault provides a centralized workspace for documenting decisions, evaluating alternatives, managing supporting files, and preserving the reasoning behind outcomes.

## Features

- **Decision Management** — Create, edit, view, and track decisions with status management.
- **Alternative Analysis** — Compare options using pros, cons, cost, feasibility, and risk.
- **Document Management** — Upload and open supporting files directly from a decision.
- **Discussion Module** — Add comments, meeting notes, rationales, threads, replies, and attachments.
- **Authentication** — JWT-based login with role-aware access.
- **Persistent Storage** — PostgreSQL database with Prisma ORM and local file storage.

## Tech Stack

**Frontend:** React  
**Backend:** Node.js, Express  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Authentication:** JWT, bcrypt  
**Storage:** Local filesystem  
**Tools:** Docker, Postman, Git/GitHub

## Project Structure

```text
DecisionVault/
├── frontend/        # React application
├── backend/         # Express API
│   ├── src/
│   ├── prisma/
│   └── uploads/
└── README.md
```

## Getting Started

### 1. Start PostgreSQL

The project uses PostgreSQL through Docker.

### 2. Backend

```bash
cd backend
npm install
npm run backend
```

The API runs on:

```text
http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server.

## Current Milestone

**Milestone 2 — Completed**

Includes decision management, alternative comparison, file uploads, document management, discussion features, and related collaboration functionality.

---

**DecisionVault — Decisions, preserved.**
