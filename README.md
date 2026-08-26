 Expert Decision Replay Platform

## 📁 Project Structure

```text
Expert-Decision-Replay-Platform/
│
├── backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   │
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── roles.py
│   │       └── teams.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   │
│   └── src/
│       ├── assets/
│       │
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       └── index.css
│
└── database/
    │
    └── database-design/
        └── database-schema.sql
```

### Backend

The `backend` directory contains the FastAPI application and REST API implementation.

* **`main.py`** – Initializes the FastAPI application and registers routers.
* **`database.py`** – Configures the PostgreSQL database connection and database session.
* **`models.py`** – Contains SQLAlchemy database models.
* **`schemas.py`** – Contains Pydantic request and response schemas.
* **`auth.py`** – Handles authentication, password verification, JWT generation, and authenticated-user verification.
* **`routers/auth.py`** – Provides registration and login endpoints.
* **`routers/users.py`** – Provides user-related APIs.
* **`routers/roles.py`** – Provides role-related APIs.
* **`routers/teams.py`** – Provides team-related APIs.
* **`requirements.txt`** – Contains required Python packages.
* **`.env`** – Stores local environment configuration and secrets. It should not be committed to GitHub.

### Frontend

The `frontend` directory contains the React user interface.

* **`App.jsx`** – Main application component.
* **`App.css`** – Application-specific styling.
* **`main.jsx`** – React entry point.
* **`index.css`** – Global styling.
* **`assets/`** – Stores frontend assets.

The frontend communicates with the FastAPI backend through REST APIs.

### Database

The `database` directory contains the database design.

* **`database-design/database-schema.sql`** – Contains the PostgreSQL database schema used for the project.

The database supports the core Milestone 1 entities such as users, roles, and teams.

## 🎯 Milestone 1

Milestone 1 establishes the foundation of the Expert Decision Replay Platform.

### Implemented Features

* User Registration
* User Login
* JWT Authentication
* Password Hashing
* Authenticated User Verification
* User Management
* Role Management
* Team Management
* PostgreSQL Database Integration
* FastAPI REST APIs
* React Frontend
* Frontend–Backend Integration
* Protected API Endpoints
* Professional Login and Registration Interface
* Swagger API Documentation

## 🔄 Application Architecture

```text
                    USER
                      │
                      ▼
             ┌─────────────────┐
             │ React Frontend  │
             │                 │
             │ Login           │
             │ Registration    │
             │ Dashboard       │
             └────────┬────────┘
                      │
                      │ REST API
                      ▼
             ┌─────────────────┐
             │ FastAPI Backend │
             │                 │
             │ Authentication  │
             │ Users           │
             │ Roles           │
             │ Teams           │
             └────────┬────────┘
                      │
                      │ SQLAlchemy
                      ▼
             ┌─────────────────┐
             │   PostgreSQL    │
             │    Database     │
             └─────────────────┘
```

## 🔐 Authentication Flow

```text
User
 │
 ▼
Registration
 │
 ▼
FastAPI
 │
 ▼
Password Hashing
 │
 ▼
PostgreSQL
```

For login:

```text
User
 │
 ▼
Login
 │
 ▼
FastAPI
 │
 ▼
Verify Credentials
 │
 ▼
Generate JWT
 │
 ▼
Authenticated User
```

Authenticated API requests use:

```text
Authorization: Bearer <JWT_TOKEN>
```

## 🔗 Main API Endpoints

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| POST   | `/auth/register` | Register a new user             |
| POST   | `/auth/login`    | Authenticate a user             |
| GET    | `/auth/me`       | Retrieve the authenticated user |
| GET    | `/roles/`        | Retrieve available roles        |
| GET    | `/teams/`        | Retrieve available teams        |

## 🗄️ Database

**Database:** PostgreSQL

The database schema is maintained in:

```text
database/
└── database-design/
    └── database-schema.sql
```

Core Milestone 1 data includes:

```text
Users
  │
  ├── Roles
  │
  └── Teams
```

## 🚀 Running the Project

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the React application:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

## 🧪 API Testing

FastAPI Swagger UI can be used to test the backend APIs:

```text
http://127.0.0.1:8000/docs
```

The authentication flow can be tested by:

1. Registering a user.
2. Logging in.
3. Obtaining the JWT token.
4. Authorizing the Swagger interface.
5. Testing protected endpoints.
6. Retrieving the authenticated user using `/auth/me`.

## 🔒 Security

The application uses:

* JWT-based authentication
* Password hashing
* Bearer token authorization
* Protected API endpoints
* Pydantic data validation
* Environment variables for configuration
* PostgreSQL database authentication

> The `.env` file should remain local and should not be uploaded to GitHub.

## 📌 Milestone 1 Status

**Milestone 1 – Authentication & User Management: Completed ✅**

The first milestone establishes the core foundation required for the subsequent development of the Expert Decision Replay Platform.

## 🔮 Future Development

Future milestones can extend the platform with:

* Decision Creation
* Problem Statement Management
* Alternative Management
* Evaluation Criteria
* Risk Management
* Stakeholder Management
* Discussion Management
* Approval Workflow
* Implementation Tracking
* Decision Outcomes
* Document Management
* Decision Search and Filtering
* Decision Replay
* Dashboard and Analytics
* Audit Logs

---

**Project:** Expert Decision Replay Platform
**Milestone:** Milestone 1 – Authentication & User Management

