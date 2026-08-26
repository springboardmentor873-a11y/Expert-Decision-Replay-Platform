# Requirements Analysis Document - Milestone 1

**Project Name:** Expert Decision Replay Platform  
**Milestone:** Milestone 1 - Foundation, Authentication & User Management  
**Status:** Completed  
**Version:** 1.0.0  

---

## 1. Project Overview

The **Expert Decision Replay Platform** is an enterprise-grade web application engineered to record, review, analyze, and replay critical decision-making processes across complex organizational workflows. 

While the full platform will ultimately feature decision lifecycle tracking, alternative analysis, timeline replays, and peer review workflows, **Milestone 1** establishes the core foundational infrastructure:
- Modular full-stack project architecture.
- PostgreSQL database design and SQLAlchemy ORM models.
- Secure user registration and password hashing.
- User authentication and stateless JSON Web Token (JWT) issuance.
- Role-Based Access Control (RBAC) across 4 distinct enterprise roles.
- Administrative user and role management APIs.
- React frontend with authentication state management and protected routing.

---

## 2. Problem Statement

Modern enterprise decisions frequently suffer from a lack of transparent audit trails, fragmented rationale documentation, and loss of institutional knowledge. Before establishing advanced decision tracking, an organization requires a hardened, scalable, and role-governed user identity and authorization foundation. 

Milestone 1 solves this by delivering a secure authentication layer that strictly regulates access based on distinct operational personas.

---

## 3. Milestone 1 Objectives

1. **Scalable Architecture**: Establish a clean separation of concerns between frontend, API routing, business services, and database layers.
2. **Secure Identity Management**: Implement zero-plaintext password storage using standard `bcrypt` hashing with salt rounds.
3. **Stateless Authorization**: Issue secure, signed JWT bearer tokens for stateless API authorization.
4. **Role-Based Access Control (RBAC)**: Enforce granular permission checking across 4 organizational roles.
5. **Administrative User Governance**: Provide administrative endpoints to list, inspect, activate, deactivate, and re-role accounts.
6. **Responsive User Experience**: Deliver an intuitive React client with automatic session restoration and route guarding.

---

## 4. Functional Requirements

### FR-01: User Registration
- **Description**: Allows prospective users to create an account by providing their details and selecting an initial role.
- **User/Role**: Unauthenticated Visitor / All Personas.
- **Expected Behavior**: Validates input (non-empty full name, RFC-compliant email, minimum 8-character password, recognized role). Hashes password with bcrypt. Rejects duplicate emails with `409 Conflict`. Persists user and returns `201 Created` with sanitized payload (never exposing `hashed_password`).

### FR-02: User Login
- **Description**: Authenticates existing users using their email address and password.
- **User/Role**: Unauthenticated Visitor.
- **Expected Behavior**: Validates credentials. Returns `401 Unauthorized` with generic message on invalid email or password. Rejects deactivated users. On success, generates a signed JWT token and returns `200 OK` with `{ "access_token": "<jwt>", "token_type": "bearer" }`.

### FR-03: JWT Authentication
- **Description**: Issues and verifies HMAC-SHA256 signed tokens embedded with user claims (`sub`, `email`, `role`, `full_name`, `exp`).
- **User/Role**: Authenticated API Clients.
- **Expected Behavior**: Backend dependencies parse `Authorization: Bearer <token>` headers, decode the token, check expiration, and resolve the database user. Rejects missing, invalid, or expired tokens with `401 Unauthorized`.

### FR-04: View Current User Profile
- **Description**: Fetches the authenticated user's profile and assigned role.
- **User/Role**: Any Authenticated User.
- **Expected Behavior**: Invokes `GET /auth/me` with Bearer token. Returns `200 OK` containing safe profile fields (`id`, `full_name`, `email`, `role`, `is_active`, `created_at`, `updated_at`).

### FR-05: Role-Based Access Control (RBAC)
- **Description**: Reusable dependency factory `require_roles(...)` restricting endpoint access to specific authorized roles.
- **User/Role**: System-wide middleware.
- **Expected Behavior**: Compares the user's role against the allowed role set. Returns `403 Forbidden` if unauthorized; allows request execution if authorized.

### FR-06: Administrator User Listing
- **Description**: Retrieves a paginated list of all platform user accounts.
- **User/Role**: Administrator only.
- **Expected Behavior**: `GET /users` returns `200 OK` with an array of sanitized user profiles. Rejects non-Administrator requests with `403 Forbidden`.

### FR-07: User Status Management
- **Description**: Activates or deactivates user accounts to grant or revoke system access.
- **User/Role**: Administrator only.
- **Expected Behavior**: `PATCH /users/{user_id}/status` updates `is_active` boolean. Returns `404 Not Found` if user does not exist, and `403 Forbidden` if invoked by non-Administrators.

### FR-08: User Role Management
- **Description**: Updates the assigned role of any user account.
- **User/Role**: Administrator only.
- **Expected Behavior**: `PATCH /users/{user_id}/role` validates that the new role exists, updates `role_id`, and returns the updated profile. Rejects invalid role names with `422/400` and non-Admin access with `403 Forbidden`.

### FR-09: Frontend Authentication Flow
- **Description**: Interactive UI allowing users to register, sign in, view their dashboard, and persist session across reloads.
- **User/Role**: Client End-Users.
- **Expected Behavior**: `AuthContext` stores JWT in `localStorage`, restores active session on mount via `GET /auth/me`, and guards routes with `<ProtectedRoute />`.

### FR-10: Logout and Session Handling
- **Description**: Allows logged-in users to securely terminate their session.
- **User/Role**: Any Authenticated User.
- **Expected Behavior**: Clears `localStorage` token, nullifies `user` state, and navigates immediately to `/login`.

---

## 5. Non-Functional Requirements

- **Security**: 
  - Cryptographic password hashing via `bcrypt` (12 rounds).
  - JWT signature validation with `HS256` and minimum 32-byte secret key.
  - Zero password hash leakage across all response DTOs.
  - Case-insensitive email normalization to prevent account collision.
- **Performance**:
  - Database indexing on `users.email`, `users.role_id`, and `roles.name`.
  - Fast stateless token verification avoiding repeated authentication queries.
- **Scalability**:
  - Layered architecture (Routes $\to$ Services $\to$ Models $\to$ DB) allowing future modules to hook into user services seamlessly.
- **Maintainability**:
  - Strongly typed Pydantic models for request validation and response schemas.
  - Reusable dependency injection in FastAPI.
- **Usability**:
  - Responsive, enterprise-tailored UI built with Vite + React.
  - Clear, accessible form error handling and status indicators.

---

## 6. User Roles & Permissions

The platform defines four core enterprise roles:

1. **`Employee`**: Baseline contributor creating and submitting decision workflows.
2. **`Reviewer`**: Subject matter expert analyzing alternatives, scoring trade-offs, and submitting reviews.
3. **`Manager`**: Decision authority approving, rejecting, or escalating submitted decision proposals.
4. **`Administrator`**: System administrator managing user provisioning, roles, and platform settings.

### Permissions Matrix (Milestone 1)

| Feature / Action | Endpoint | Employee | Reviewer | Manager | Administrator |
|---|---|:---:|:---:|:---:|:---:|
| Register Account | `POST /auth/register` | ✅ | ✅ | ✅ | ✅ |
| Sign In | `POST /auth/login` | ✅ | ✅ | ✅ | ✅ |
| View Own Profile | `GET /auth/me` | ✅ | ✅ | ✅ | ✅ |
| Access Home Dashboard | `/home` | ✅ | ✅ | ✅ | ✅ |
| View Single User Profile | `GET /users/{id}` | Self Only | Self Only | Self Only | Any User |
| List All Users | `GET /users` | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| Update User Status | `PATCH /users/{id}/status` | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| Update User Role | `PATCH /users/{id}/role` | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |

---

## 7. Technology Stack

### Backend
- **Language**: Python 3.11+ (Python 3.14 compatible)
- **Web Framework**: FastAPI
- **Database & ORM**: PostgreSQL / SQLAlchemy 2.0+
- **Data Validation**: Pydantic v2 & Pydantic Settings
- **Authentication**: PyJWT (HMAC-SHA256)
- **Password Security**: bcrypt (with blowfish hashing)
- **Database Driver**: psycopg2-binary / psycopg

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6
- **State Management**: React Context API (`AuthContext`)
- **Styling**: Modern Semantic CSS

---

## 8. Milestone 1 Scope Boundaries

### In Scope (Completed)
- ✅ Full-stack project structure & configuration.
- ✅ PostgreSQL DDL schema and SQLAlchemy models for `users` and `roles`.
- ✅ Role seeds for `Employee`, `Reviewer`, `Manager`, `Administrator`.
- ✅ Secure registration with duplicate email rejection.
- ✅ Secure login with JWT token issuance.
- ✅ Reusable `get_current_user` and `require_roles` dependencies.
- ✅ Administrative User Management API (list, detail, status toggle, role change).
- ✅ React client with Login, Register, Protected Home, and Navbar components.
- ✅ Comprehensive end-to-end automated test suites.

### Out of Scope (Future Milestones)
- ❌ Decision Management (Milestone 2)
- ❌ Decision Replay Timeline (Milestone 2+)
- ❌ Alternative Analysis & Multi-Criteria Scoring (Future)
- ❌ Discussion & Reviewer Annotation Threads (Future)
- ❌ Multi-stage Approval Workflow (Future)
- ❌ Knowledge Repository & Search (Future)
- ❌ Analytics Dashboard, Audit Logs, and Metric Reports (Future)