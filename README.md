
# DecisionVault

DecisionVault is a decision management and knowledge repository application designed to help teams document, review, approve, and learn from important decisions.

## Current Status

🚧 **Under Development**

The project is currently in the early development stage, with the initial frontend and backend foundations completed.

---

## Frontend

The React frontend currently includes:

- [x] React application setup
- [x] Login page
- [x] Registration page
- [ ] Connect authentication forms to backend API
- [ ] Authentication state management
- [ ] Protected routes
- [ ] Dashboard
- [ ] Decision management UI

---

## Backend

The backend is being developed using Node.js and Express.

Currently implemented:

- [x] Node.js setup
- [x] Express server
- [x] Express middleware
- [x] Express routing
- [x] Controllers
- [x] PostgreSQL database
- [x] Docker PostgreSQL container
- [x] Prisma ORM
- [x] Initial database migration
- [x] User model
- [x] Prisma → PostgreSQL connection
- [ ] Authentication API
- [ ] Password hashing
- [ ] JWT authentication
- [ ] Role-based authorization
- [ ] User management API

---

## Tech Stack

### Frontend

- React
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- JavaScript
- Prisma ORM

### Database

- PostgreSQL

### Infrastructure

- Docker
- Docker Desktop

---

## Architecture

The current application architecture is:

```text
                    DecisionVault
                         │
              ┌──────────┴──────────┐
              │                     │
           Frontend              Backend
           React               Node + Express
              │                     │
              │ HTTP API            │
              └──────────┬──────────┘
                         │
                     Controllers
                         │
                      Prisma
                         │
                    PostgreSQL
                         │
                       Docker
````

The intended backend request flow is:

```text
Client
  │
  │ HTTP Request
  ▼
Express Middleware
  │
  ▼
Route
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Prisma
  │
  ▼
PostgreSQL
  │
  ▼
Response
```

---

## Backend Structure

```text
backend/
│
├── prisma/
│   ├── migrations/
│   │   └── ...
│   └── schema.prisma
│
├── src/
│   │
│   ├── config/
│   │
│   ├── controllers/
│   │
│   ├── db/
│   │   └── prisma.js
│   │
│   ├── middleware/
│   │
│   ├── models/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   └── app.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── prisma7.config.ts
└── server.js
```

---

## Database

The initial database is PostgreSQL running inside Docker.

```text
Docker
└── decisionvault-db
    └── PostgreSQL
        └── decisionvault
```

### Initial User Model

The current database schema contains a `User` model:

```text
User
├── id
├── name
├── email
├── password
└── role
```

The currently defined roles are:

```text
Employee
Reviewer
Manager
Administrator
```

### Database Relationship Design

The current design allows users to belong to multiple teams.

```text
User
  │
  │
  ▼
UserTeam
  │
  │
  ▼
Team
```

This represents a many-to-many relationship:

```text
User  ←→  Team
```

A user can therefore participate in multiple teams, while a team can contain multiple users.

Team membership is optional.

---

## Prisma

Prisma is used as the ORM between the Node.js backend and PostgreSQL.

```text
Node.js / Express
        │
        ▼
   Prisma Client
        │
        ▼
   PrismaPg Adapter
        │
        ▼
      pg
        │
        ▼
   PostgreSQL
```

The Prisma schema is located at:

```text
prisma/schema.prisma
```

The initial database migration has been successfully created and applied.

---

## Docker

PostgreSQL is currently running inside a Docker container.

Container:

```text
decisionvault-db
```

Check running containers:

```bash
docker ps
```

Start the PostgreSQL container if necessary:

```bash
docker start decisionvault-db
```

Stop it with:

```bash
docker stop decisionvault-db
```

---

## Environment Variables

The backend uses a `.env` file for private configuration.

Example:

```env
DATABASE_URL="postgresql://decisionvault:YOUR_PASSWORD@localhost:5432/decisionvault"
```

> Never commit `.env` to Git.

The `.env` file should be included in `.gitignore`.

---

## Development Setup

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Docker Desktop

### Clone the repository

```bash
git clone https://github.com/KaranSaini-Git/DecisionVault.git
```

Navigate into the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

### Start PostgreSQL

Make sure Docker Desktop is running.

Check:

```bash
docker ps
```

The PostgreSQL container should appear as:

```text
decisionvault-db
```

### Prisma

Generate the Prisma Client:

```bash
npx prisma generate
```

Create and apply development migrations:

```bash
npx prisma migrate dev
```

---

## Authentication

Authentication is currently under development.

### Planned Authentication Flow

Registration:

```text
React Registration Form
        │
        │ POST /api/auth/register
        ▼
     Express
        │
        ▼
    Auth Route
        │
        ▼
    Auth Controller
        │
        ├── Validate input
        │
        ├── Hash password
        │
        ├── Create user
        │
        ▼
     Prisma
        │
        ▼
    PostgreSQL
```

Login:

```text
React Login Form
        │
        │ POST /api/auth/login
        ▼
     Express
        │
        ▼
    Auth Controller
        │
        ├── Find user
        ├── Verify password
        ├── Generate JWT
        │
        ▼
     Response
```

Planned authentication features:

* [ ] User registration
* [ ] Password hashing
* [ ] Login
* [ ] JWT generation
* [ ] JWT verification
* [ ] Protected routes
* [ ] Role-based authorization
* [ ] Logout/session handling

---

## Development Roadmap

### Milestone 1 — Foundation & Authentication

* [x] React application
* [x] Login page
* [x] Registration page
* [x] Node.js backend
* [x] Express setup
* [x] Express routing
* [x] Controllers
* [x] Docker setup
* [x] PostgreSQL database
* [x] Prisma setup
* [x] User model
* [x] Initial migration
* [x] Backend → PostgreSQL connection
* [ ] Registration API
* [ ] Password hashing
* [ ] Login API
* [ ] JWT authentication
* [ ] Role-based authorization
* [ ] User management

### Future Development

* [ ] Dashboard
* [ ] Team management
* [ ] Decision creation
* [ ] Decision lifecycle
* [ ] Decision alternatives
* [ ] Comments
* [ ] Approval workflow
* [ ] Decision versioning
* [ ] Audit logging
* [ ] Search
* [ ] Filtering
* [ ] Knowledge repository
* [ ] Notifications
* [ ] Analytics
* [ ] Production Docker configuration

---

## Development Philosophy

DecisionVault is being developed incrementally.

The backend follows a layered architecture so that responsibilities remain separated:

```text
Routes
   ↓
Controllers
   ↓
Services
   ↓
Database Layer
   ↓
PostgreSQL
```

This structure is intended to make the application easier to maintain, test, and extend as additional DecisionVault functionality is implemented.

---

## Project Status

**Current focus:** Backend authentication and integration with the existing React login and registration pages.

🚧 DecisionVault is actively under development.

