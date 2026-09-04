# Database Design — Milestone 1

The database is **MySQL**, accessed directly through
`mysql-connector-python` (no ORM). The full initialization script is
at [`database/schema.sql`](../database/schema.sql).

## Entities

### `users`

| Column          | Type                                             | Notes                          |
|-----------------|---------------------------------------------------|---------------------------------|
| id              | INT, PK, AUTO_INCREMENT                          |                                  |
| full_name       | VARCHAR(150), NOT NULL                           |                                  |
| email           | VARCHAR(150), NOT NULL, UNIQUE                   | Unique constraint enforced      |
| password_hash   | VARCHAR(255), NOT NULL                           | bcrypt hash, never plaintext    |
| role            | ENUM('Employee','Reviewer','Manager','Administrator'), NOT NULL, DEFAULT 'Employee' | |
| team_id         | INT, NULL, FK → teams(id)                        | ON DELETE SET NULL              |
| created_at      | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP             |                                  |
| updated_at      | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE   |                                  |

### `teams`

| Column      | Type                              | Notes                              |
|-------------|-------------------------------------|--------------------------------------|
| id          | INT, PK, AUTO_INCREMENT           |                                      |
| team_name   | VARCHAR(150), NOT NULL, UNIQUE    |                                      |
| manager_id  | INT, NULL, FK → users(id)         | ON DELETE SET NULL                  |
| created_at  | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP |                                  |

### `decisions` (Milestone 1 foundation only)

| Column             | Type                                                                 | Notes                     |
|--------------------|------------------------------------------------------------------------|-----------------------------|
| id                 | INT, PK, AUTO_INCREMENT                                              |                              |
| title              | VARCHAR(200), NOT NULL                                               |                              |
| problem_statement  | TEXT, NOT NULL                                                       |                              |
| category           | VARCHAR(100), NULL                                                   |                              |
| status             | ENUM('Draft','Under Review','Approved','Rejected','Archived'), NOT NULL, DEFAULT 'Draft' | |
| created_by         | INT, NOT NULL, FK → users(id)                                        | ON DELETE CASCADE            |
| created_at         | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP                                 |                              |
| updated_at         | TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE                       |                              |

Full decision-management fields (alternatives, criteria, risks,
stakeholders, discussions, approvals, implementation, outcomes) are
intentionally **out of scope** for Milestone 1 and will be added in
later milestones.

## Relationships

- A **user** can belong to at most one **team** (`users.team_id →
  teams.id`).
- A **team** can have many **users** (one-to-many).
- A **team** may optionally have a **manager**, who is a user
  (`teams.manager_id → users.id`).
- A **user** can create many **decisions** (`decisions.created_by →
  users.id`).
- A **decision** belongs to exactly one creator.

```
teams (1) ──────< (many) users
users (1) ──────< (many) decisions
users (1) ──────  (0..1) teams.manager_id  (a user may manage a team)
```

## Why no ORM?

Per the Milestone 1 technology constraints, the backend uses
`mysql-connector-python` directly with parameterized SQL queries
(see `backend/app/models/`). This keeps the SQL fully visible and easy
to explain during a milestone review, and avoids the additional
abstraction layer an ORM like SQLAlchemy would introduce.
