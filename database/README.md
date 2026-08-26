# Database Design & Setup - Milestone 1

This directory contains the database design artifacts, schemas, and documentation for the **Expert Decision Replay Platform**.

## Architecture & Entity Relationships

Milestone 1 introduces the authentication, user identity, and Role-Based Access Control (RBAC) foundation using PostgreSQL and SQLAlchemy.

### Schema Relationship Diagram (ERD)

```text
+------------------------------------------------------+
|                        roles                         |
+------------------------------------------------------+
| * id          : SERIAL (Primary Key)                 |
|   name        : VARCHAR(50) UNIQUE NOT NULL          |
|   description : VARCHAR(255)                         |
+------------------------------------------------------+
                           |
                           | 1:N (One role assigned to many users)
                           v
+------------------------------------------------------+
|                        users                         |
+------------------------------------------------------+
| * id              : SERIAL (Primary Key)             |
|   full_name       : VARCHAR(100) NOT NULL            |
|   email           : VARCHAR(255) UNIQUE NOT NULL     |
|   hashed_password : VARCHAR(255) NOT NULL            |
|   role_id         : INTEGER (Foreign Key -> roles.id)|
|   is_active       : BOOLEAN DEFAULT TRUE             |
|   created_at      : TIMESTAMPTZ DEFAULT CURRENT_TIME |
|   updated_at      : TIMESTAMPTZ DEFAULT CURRENT_TIME |
+------------------------------------------------------+
```

### Pre-defined Roles

| Role Name | Description |
|---|---|
| **`Employee`** | Standard employee creating and submitting decision workflows. |
| **`Reviewer`** | Subject matter expert analyzing alternatives, scoring, and providing review feedback. |
| **`Manager`** | Decision approver validating, overriding, or approving submitted decision tracks. |
| **`Administrator`** | System administrator with full governance over user accounts, roles, and system configs. |

---

## Schema Files

- [`database/schema/initial_schema.sql`](file:///C:/Users/Admin/.gemini/antigravity/scratch/Expert-Decision-Replay-Platform/database/schema/initial_schema.sql): PostgreSQL DDL script creating `roles`, `users`, indexes, updated_at trigger, and seed data.

---

## PostgreSQL Setup & Execution

### Executing Schema DDL:
```bash
psql -U postgres -h localhost -p 5432 -d expert_decision_db -f database/schema/initial_schema.sql
```

### Connecting Backend to PostgreSQL:
In `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expert_decision_db
```