# Database Design — Milestone 1

## 1. Purpose

The platform will use PostgreSQL as the primary relational database.

For Milestone 1, the database foundation focuses on authentication and user management. The schema is intentionally limited so later decision-related modules can be added without redesigning the foundation.

## 2. Users

| Field | Type | Purpose |
|---|---|---|
| id | UUID | Unique user identifier |
| name | VARCHAR | User's full name |
| email | VARCHAR | Unique login email |
| password_hash | VARCHAR | Hashed password |
| role_id | UUID | User's assigned role |
| team_id | UUID | User's team |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

## 3. Roles

The initial roles are:

- Employee
- Reviewer
- Manager
- Administrator

### Roles

| Field | Type | Purpose |
|---|---|---|
| id | UUID | Unique role identifier |
| name | VARCHAR | Role name |
| description | TEXT | Role description |

## 4. Teams

### Teams

| Field | Type | Purpose |
|---|---|---|
| id | UUID | Unique team identifier |
| name | VARCHAR | Team name |
| created_at | TIMESTAMP | Team creation time |

## 5. Relationships

```text
Role
  │
  └── 1 : Many ── Users

Team
  │
  └── 1 : Many ── Users
```

Each user has one assigned role and may belong to one team.

## 6. Future Expansion

Later milestones can add:

- Decisions
- Alternatives
- Discussions and comments
- Approvals
- Attachments
- Versions
- Audit records
- Notifications

## 7. Technology

- Database: PostgreSQL
- Backend: Node.js + Express.js
- ORM: Prisma
- Authentication: JWT
