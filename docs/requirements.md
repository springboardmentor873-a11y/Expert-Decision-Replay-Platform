# Requirement Analysis — Expert Decision Replay Platform

## Problem Statement

Organizations make many important decisions every year — choosing a
vendor, redesigning a process, picking a technical architecture,
restructuring a team, and so on. The reasoning behind these decisions
(the problem being solved, the alternatives considered, the risks
identified, who was involved, and what actually happened afterward)
is usually scattered across emails, chat threads, meeting notes, or
simply someone's memory. Over time this information becomes hard to
find or is lost entirely, especially as employees change teams or
leave the organization. As a result, teams often repeat past
mistakes, re-debate decisions that were already settled, or lose the
context needed to evaluate whether a past decision is still valid.

## Proposed Solution

The **Expert Decision Replay Platform** provides a centralized,
searchable system of record for organizational decisions. It captures
the full lifecycle of a decision — the problem statement, the
alternatives that were evaluated, the criteria used to judge them,
identified risks, the stakeholders involved, discussion, the approval
outcome, implementation status, and the final result. Employees can
later "replay" a decision to understand not just *what* was decided,
but *why*, and use that institutional knowledge to make better
decisions going forward.

## Objective

To build a reliable, secure, role-aware platform that preserves the
context and reasoning behind organizational decisions so that
knowledge is retained and past mistakes are not repeated.

## Target Users

- Employees who want to understand why a past decision was made.
- Reviewers who evaluate proposed decisions before approval.
- Managers who oversee a team's decisions and approve/reject them.
- Administrators who manage user accounts, roles, and teams.

## User Roles

| Role          | Description                                                             |
|---------------|--------------------------------------------------------------------------|
| Employee      | Standard user. Can register, log in, view their profile, and (in later milestones) create/view decisions. |
| Reviewer      | Can access reviewer-related functionality in later milestones (e.g. evaluating proposed decisions). |
| Manager       | Can access manager-related functionality, such as creating teams and (in later milestones) approving decisions for their team. |
| Administrator | Manages user accounts: viewing all users, changing roles, and managing teams. |

## Functional Requirements (Milestone 1 scope)

1. A visitor can register a new account with full name, email,
   password, role, and (optionally) a team.
2. The system must reject duplicate email registrations.
3. The system must securely hash passwords — plaintext passwords are
   never stored.
4. A registered user can log in with email and password and receive a
   JWT access token.
5. A logged-in user can retrieve their own profile (`GET /auth/me`).
6. An Administrator can list all registered users.
7. An Administrator can change any user's role.
8. An Administrator (or Manager) can create teams, and any
   authenticated user can view the list of teams.
9. Protected endpoints must reject requests without a valid JWT.
10. Administrator-only endpoints must reject requests from users who
    are not Administrators.
11. The frontend must provide working Login, Registration, Dashboard,
    and User Management pages that talk to the real backend — no
    mock data.

## Non-Functional Requirements

- **Security:** Passwords hashed with bcrypt; JWT secret and database
  credentials loaded from environment variables, never hardcoded;
  administrator endpoints protected by role checks; invalid/expired
  tokens are rejected.
- **Maintainability:** Clean, modular backend structure (routers,
  models, schemas, auth) so that later milestones can extend the
  system without a rewrite.
- **Usability:** Simple, uncluttered HTML/CSS/JS pages that a
  non-technical reviewer can navigate without instructions.
- **Reliability:** The API validates all incoming data and returns
  clear error messages instead of crashing; a `/health` endpoint
  reports whether the database is reachable.

## Milestone 1 Scope

Milestone 1 delivers the **foundation** of the platform:

- Requirement analysis and UI wireframes (this documentation).
- A MySQL database with `users`, `teams`, and a basic `decisions`
  table (no full decision workflow yet).
- A FastAPI backend exposing authentication and user/team management
  APIs, connected directly to MySQL (no ORM).
- A plain HTML/CSS/JavaScript frontend with working Login,
  Registration, Dashboard, and User Management pages.
- Working JWT-based authentication and basic role-based access
  control for the four user roles.

## Future Scope (later milestones — NOT built here)

- Full decision-management workflow: alternatives, evaluation
  criteria, risks, stakeholders, discussion threads, file
  attachments, and version tracking.
- Multi-level approval workflows and notifications.
- Audit logging and reporting/analytics dashboards.
- Containerized/cloud deployment and production hardening.
