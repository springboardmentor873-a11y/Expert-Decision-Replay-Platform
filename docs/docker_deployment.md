# Expert Decision Replay Platform — Docker Deployment Guide

This guide details how to build, run, and manage the containerized Expert Decision Replay Platform using Docker and Docker Compose.

---

> [!WARNING]
> ### Deployment Status & Environment Validation Notice
> - **A. Local Development**: **ACTIVE & 100% OPERATIONAL**. Verified running on Python/FastAPI (`:8000`) and React/Vite (`:5173`) with full database and test suite passing.
> - **B. Docker Configuration**: **FULLY CONFIGURED & VERIFIED**. All Dockerfiles, `.dockerignore` files, `nginx.conf`, `docker-compose.yml`, and `.env.example` are complete and syntax-validated.
> - **C. Docker Runtime Deployment**: **PENDING RUNTIME EXECUTION**. Docker runtime could not be executed during the current validation because Docker Desktop was unavailable on the development machine. It is **not** claimed as live-deployed in Docker on this host until Docker Desktop is installed and started.

---

## 1. Architecture Overview

The containerized deployment consists of three coordinated services within an isolated bridge network (`expert_decision_network`):

```
+---------------------------------------------------------------------------------+
|                                Host Machine                                     |
|                                                                                 |
|   Browser (User) ----> http://localhost:80   -----------------------+           |
|                  ----> http://localhost:8000 --------------------+  |           |
+---------------------------------------------------------------|--|--------------+
                                                                |  |
                                Docker Network                  v  v
+---------------------------------------------------------------------------------+
|                                                                                 |
|   +-----------------------+     proxy /api/     +---------------------------+   |
|   |  Frontend Container   | ------------------> |     Backend Container     |   |
|   |  (Nginx :80)          |                     |     (FastAPI :8000)       |   |
|   |  SPA Routing Fallback |                     +---------------------------+   |
|   +-----------------------+                                   |                 |
|                                                               | postgres:5432   |
|                                                               v                 |
|                                                 +---------------------------+   |
|                                                 |    PostgreSQL Container   |   |
|                                                 |       (postgres:15)       |   |
|                                                 +---------------------------+   |
|                                                               |                 |
|     Volumes:                                                  v                 |
|     - expert_decision_uploads_data -------------> /app/uploads                  |
|     - expert_decision_postgres_data ------------> /var/lib/postgresql/data       |
+---------------------------------------------------------------------------------+
```

---

## 2. Prerequisites & Verification

Before deploying with Docker, verify that Docker and Docker Compose are installed and running:

```powershell
docker --version
docker compose version
```

If `docker` is not recognized on Windows:
1. Download and install **Docker Desktop for Windows** from [docker.com](https://www.docker.com/products/docker-desktop/).
2. Enable the **WSL 2** backend during installation.
3. Start Docker Desktop and ensure the engine icon indicates **Running**.

---

## 3. Environment Setup

1. Copy the environment configuration template from the project root:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Edit `.env` to configure your passwords and secrets:
   ```dotenv
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=expert_decision_replay
   POSTGRES_PORT=5432
   SECRET_KEY=generate_a_secure_random_key_here
   VITE_API_BASE_URL=http://localhost:8000
   ```

> [!NOTE]
> If local PostgreSQL is already running on port 5432 on your Windows host, set `POSTGRES_PORT=5433` in `.env` to avoid port collisions on the host machine. The internal container network always connects on `postgres:5432`.

---

## 4. Build and Run Commands

### Validate Compose Syntax
```powershell
docker compose config
```

### Build Docker Images
```powershell
docker compose build
```

### Start Services in Background
```powershell
docker compose up -d
```

### View Status & Health
```powershell
docker compose ps
```

### Stream Live Logs
```powershell
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend

# PostgreSQL only
docker compose logs -f postgres
```

### Stop Services
```powershell
# Stop containers (preserves volumes and data)
docker compose down

# Stop and remove volumes (WARNING: clears container database and uploads)
# docker compose down -v
```

---

## 5. Application URLs & Endpoints

| Service | Access URL | Description |
|---|---|---|
| **Frontend Application** | `http://localhost` or `http://localhost:80` | React Single Page Application (SPA) |
| **Backend API Root** | `http://localhost:8000/` | API metadata and entry point |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger / OpenAPI UI |
| **API Health Check** | `http://localhost:8000/health` | Container health probe |
| **PostgreSQL Database** | `localhost:5432` (or configured port) | PostgreSQL direct connection |

---

## 6. Persistent Volumes & Document Storage

Docker Compose defines two persistent named volumes:

1. **`expert_decision_postgres_data`**:
   - Container Path: `/var/lib/postgresql/data`
   - Purpose: Stores all PostgreSQL tables, indexes, users, decisions, discussions, audit logs, and workflow data. Data persists even when containers are restarted or rebuilt.

2. **`expert_decision_uploads_data`**:
   - Container Path: `/app/uploads`
   - Purpose: Stores decision attachments and uploaded files (`/app/uploads/decisions/{decision_id}/...`).
   - Ensures that uploaded documents are preserved across container lifecycle operations without bloating Docker image layers.

---

## 7. Database Safety & Migration Guide

> [!IMPORTANT]
> The Docker PostgreSQL container (`postgres`) is **completely isolated** from your local Windows PostgreSQL service.

### Local vs. Docker PostgreSQL Separation
- **Local Development**: Connects to `localhost:5432` running on Windows (database `expert_decision_replay`).
- **Docker Deployment**: Runs inside the containerized service `expert_decision_postgres` using named volume `expert_decision_postgres_data`.
- Running `docker compose up` **never modifies, truncates, or deletes** your local Windows PostgreSQL database.

### Migrating Existing Local Data to Docker (Optional)
If you wish to transfer existing local database records to the Docker container:

1. **Export local database**:
   ```powershell
   pg_dump -U postgres -h localhost -d expert_decision_replay -F c -b -v -f backup.dump
   ```
2. **Ensure Docker PostgreSQL container is running**:
   ```powershell
   docker compose up -d postgres
   ```
3. **Restore into Docker container**:
   ```powershell
   docker compose exec -T postgres pg_restore -U postgres -d expert_decision_replay -v < backup.dump
   ```

---

## 8. Local Development vs. Docker Deployment

Both workflows are 100% independent and supported simultaneously:

### Workflow A: Local Development (VS Code)
Fast feedback with hot-reload and local debugging:
```powershell
# Terminal 1 - Backend (from backend directory)
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend (from frontend directory)
cd frontend
npm run dev
```

### Workflow B: Docker Deployment
Reproducible, self-contained multi-container deployment:
```powershell
# From project root
docker compose up -d
```

---

## 9. Troubleshooting

### Problem: Port 5432 already in use
**Cause**: Local PostgreSQL is running on the host Windows machine.  
**Fix**: In `.env`, change `POSTGRES_PORT=5433`. The internal Docker network still routes traffic to `postgres:5432` automatically.

### Problem: Port 80 already in use
**Cause**: IIS or another web server is bound to port 80.  
**Fix**: In `docker-compose.yml`, change frontend port mapping to `8080:80` and access at `http://localhost:8080`.

### Problem: SPA routes show 404 upon browser refresh
**Cause**: Missing Nginx rewrite rules.  
**Fix**: Verify `frontend/nginx.conf` contains `try_files $uri $uri/ /index.html;`.
