# System Architecture Document - Milestone 1

**Platform:** Expert Decision Replay Platform  
**Scope:** Foundation, Authentication, and Role-Based Access Control  

---

## 1. High-Level Architecture Overview

The system is structured as a modern decoupled client-server architecture:

```text
+-------------------------------------------------------------------+
|                         React Frontend                            |
|             (Vite, React Router, Context API, CSS)                |
+-------------------------------------------------------------------+
                                  |
                                  | HTTP / JSON (REST API)
                                  | Authorization: Bearer <JWT>
                                  v
+-------------------------------------------------------------------+
|                        FastAPI Backend                            |
|        (CORS Middleware, Pydantic Schemas, Security Layer)        |
+-------------------------------------------------------------------+
                                  |
                                  | SQLAlchemy 2.0 ORM
                                  v
+-------------------------------------------------------------------+
|                      PostgreSQL Database                          |
|             (Users Table, Roles Table, Triggers, DDL)             |
+-------------------------------------------------------------------+
```

---

## 2. Layered Request & Authentication Lifecycle

```text
React Component (Login / Register / Home)
       |
       v
AuthContext (State: user, token, loading)
       |
       v
authService (fetch API client with error handling)
       |
       | HTTP Request (e.g. POST /auth/login or GET /auth/me)
       v
FastAPI Middleware (CORSMiddleware, Request Logging)
       |
       v
API Router Layer (app/api/routes/auth.py, users.py)
       |
       v
Security & Dependencies (get_current_user, require_roles, bcrypt, PyJWT)
       |
       v
Business Service Layer (app/services/user_service.py)
       |
       v
SQLAlchemy ORM Layer (User, Role models)
       |
       v
PostgreSQL Relational Storage (users, roles tables)
```

---

## 3. End-to-End Authentication & Authorization Flow

```text
Client (User)               React Frontend           FastAPI Backend             PostgreSQL
      |                            |                        |                         |
      |-- 1. Enters Credentials -->|                        |                         |
      |                            |-- 2. POST /auth/login->|                         |
      |                            |   {email, password}    |-- 3. Query User ------->|
      |                            |                        |<-- Returns User Record -|
      |                            |                        |                         |
      |                            |                        |-- 4. bcrypt verify pw   |
      |                            |                        |-- 5. Sign JWT Token     |
      |                            |<-- 6. {access_token} --|                         |
      |                            |                        |                         |
      |                            |-- 7. Store token in    |                         |
      |                            |      localStorage      |                         |
      |                            |                        |                         |
      |                            |-- 8. GET /auth/me ---->|                         |
      |                            |   Bearer <JWT>         |-- 9. Decode JWT Claims  |
      |                            |                        |-- 10. Load User -------->|
      |                            |<-- 11. Return Profile -|                         |
      |<-- 12. Render Dashboard ---|                        |                         |
```

---

## 4. Security & Data Integrity Architecture

1. **Password Protection**: Plaintext passwords never touch the database. Passwords are salted and hashed using `bcrypt.gensalt(12)`.
2. **Stateless Authorization**: Client receives an opaque signed JWT containing user ID (`sub`), email, role, and expiration timestamp.
3. **Role-Based Access Enforcement**: The `require_roles(...)` dependency enforces access control before route handlers execute.
4. **Relational Constraints**:
   - `users.email` unique constraint prevents duplicate identities.
   - `users.role_id` foreign key with `ON DELETE RESTRICT` guarantees role integrity.
   - `users.is_active` boolean flag enables immediate account suspension.