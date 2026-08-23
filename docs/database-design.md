# Database Design

## 1. Overview

The Expert Decision Replay Platform will use PostgreSQL as the database.

The database will store user information and support authentication and role-based access.

## 2. User Table

### Users

| Field | Data Type | Description |
|---|---|---|
| id | Integer | Unique identifier for the user |
| name | String | Full name of the user |
| email | String | User email address |
| password | String | Encrypted user password |
| role | String | User role |
| team | String | Team assigned to the user |
| created_at | DateTime | Account creation date |

## 3. User Roles

The system will support the following roles:

- Employee
- Reviewer
- Manager
- Administrator

## 4. Relationships

For Milestone 1, the primary database entity is the Users table.

Future modules will introduce additional entities such as decisions, alternatives, discussions, approvals, and audit logs.

## 5. Database Technology

- Database: PostgreSQL
- ORM: SQLAlchemy
- Database Migration Tool: Alembic