# 🧠 Expert Decision Replay Platform

> A platform for capturing, managing, reviewing, and replaying expert decision-making processes.

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)

---

## 🚀 Project Overview

The **Expert Decision Replay Platform** is designed to provide a structured environment for capturing, managing, reviewing, and eventually replaying expert decision-making processes.

The platform is being developed incrementally through multiple milestones.

**Milestone 1 focuses on the foundation of the platform:**

- User management
- Role management
- Team management
- PostgreSQL database
- User registration
- User login
- JWT authentication
- Protected API endpoints
- React frontend
- Authenticated dashboard

---

# ⚡ Quick Start

## Prerequisites

Make sure the following are installed:

- Python
- Node.js
- PostgreSQL
- pgAdmin
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
Start the Backend

Navigate to the backend:

cd Backend

Activate the Python virtual environment:

Windows PowerShell
.venv\Scripts\Activate.ps1

Start FastAPI:

python -m uvicorn main:app --reload

The backend will run at:

http://127.0.0.1:8000
3. Open API Documentation

FastAPI automatically provides interactive API documentation.

Open:

http://127.0.0.1:8000/docs

From Swagger UI you can test the available API endpoints.

4. Start the Frontend

Open a new terminal.

Navigate to the frontend:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will be available at:

http://localhost:5173
✨ Milestone 1 Features
Feature	Status
PostgreSQL Database	✅ Completed
Roles	✅ Completed
Teams	✅ Completed
Users	✅ Completed
User Registration	✅ Completed
User Login	✅ Completed
JWT Authentication	✅ Completed
Protected /me Endpoint	✅ Completed
React Frontend	✅ Completed
Login UI	✅ Completed
Authenticated Dashboard	✅ Completed
Logout	✅ Completed
🔐 Authentication Flow

The authentication system follows this flow:

                 ┌──────────────┐
                 │     User     │
                 └──────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  React Login  │
                │     Page      │
                └───────┬───────┘
                        │
                        │ POST /login
                        ▼
                ┌───────────────┐
                │    FastAPI    │
                │    Backend    │
                └───────┬───────┘
                        │
                        │ Verify credentials
                        ▼
                ┌───────────────┐
                │   PostgreSQL  │
                │    Database   │
                └───────┬───────┘
                        │
                        │ Valid user
                        ▼
                ┌───────────────┐
                │   JWT Token   │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ React stores  │
                │     token     │
                └───────┬───────┘
                        │
                        │ GET /me
                        │ Authorization: Bearer <token>
                        ▼
                ┌───────────────┐
                │ JWT Validation│
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │   Dashboard   │
                └───────────────┘
🏗 System Architecture
┌─────────────────────────────────────────────┐
│                 React Frontend              │
│                                             │
│   Login Page  ────────►  Dashboard          │
│                                             │
│             http://localhost:5173           │
└──────────────────────┬──────────────────────┘
                       │
                       │ HTTP / REST API
                       ▼
┌─────────────────────────────────────────────┐
│               FastAPI Backend               │
│                                             │
│  /register                                  │
│  /login                                     │
│  /me                                        │
│                                             │
│             http://127.0.0.1:8000           │
└──────────────────────┬──────────────────────┘
                       │
                       │ SQL / ORM
                       ▼
┌─────────────────────────────────────────────┐
│                PostgreSQL                   │
│                                             │
│  roles                                      │
│  teams                                      │
│  users                                      │
│  user_profiles                              │
└─────────────────────────────────────────────┘
🗄 Database Structure

Milestone 1 contains four main database tables.

                    ┌──────────────┐
                    │    roles     │
                    └──────┬───────┘
                           │
                        role_id
                           │
                           ▼
                    ┌──────────────┐
                    │    users     │
                    └──────┬───────┘
                           │
                        team_id
                           │
                           ▼
                    ┌──────────────┐
                    │    teams     │
                    └──────────────┘

                    ┌──────────────┐
                    │    users     │
                    └──────┬───────┘
                           │
                        user_id
                           │
                           ▼
                    ┌──────────────┐
                    │user_profiles │
                    └──────────────┘
👤 Roles

The platform currently defines four roles:

Role	Description
Employee	Standard platform user
Reviewer	Reviews submitted information
Manager	Provides management-level oversight
Administrator	Administrative platform role

Detailed role-based permissions will be implemented in later milestones.

👥 Teams

The teams table stores the teams within the organization.

Users can optionally be associated with a team using:

users.team_id → teams.team_id
👤 Users

The users table stores:

User ID
Name
Email
Password hash
Role ID
Team ID

Relationships:

users.role_id → roles.role_id

users.team_id → teams.team_id
🪪 User Profiles

The user_profiles table stores additional user information:

Phone
Department
Designation
Profile image

Relationship:

user_profiles.user_id → users.user_id

The profile uses ON DELETE CASCADE, so a user's profile is removed when the associated user is deleted.

📡 API Reference
Authentication
Register User
POST /register

Creates a new user.

Example request:

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "role_id": 1,
  "team_id": null
}

Example response:

{
  "message": "User registered successfully",
  "user_id": 3,
  "name": "Test User",
  "email": "test@example.com",
  "role_id": 1,
  "team_id": null
}
Login
POST /login

Authenticates a user and returns a JWT access token.

The token is then used to access protected endpoints.

Current User
GET /me

Protected endpoint.

Requires:

Authorization: Bearer <JWT_TOKEN>

Example response:

{
  "message": "Authenticated successfully",
  "id": 4,
  "name": "Secure User",
  "email": "secure@example.com",
  "role_id": 1,
  "team_id": null
}
🖥 Frontend

The frontend is built using React + Vite.

Login Page

The login page allows users to enter:

Email
Password

The credentials are sent to the FastAPI backend.

React
  │
  │ POST /login
  ▼
FastAPI
  │
  │ JWT
  ▼
React
📊 Authenticated Dashboard

After successful authentication, the dashboard displays information about the logged-in user.

Currently displayed information includes:

Name
Email
User ID
Role ID
Team ID

The dashboard also provides a logout button.

🗂 Project Structure
Expert-Decision-Replay-Platform/
│
├── Backend/
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── _init_.py
│   │   ├── role.py
│   │   ├── team.py
│   │   └── user.py
│   │
│   ├── Schemas/
│   │   ├── __init__.py
│   │   ├── team.py
│   │   └── user.py
│   │
│   ├── security/
│   │   ├── _init_.py
│   │   ├── auth.py
│   │   ├── jwt.py
│   │   └── password.py
│   │
│   └── main.py
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── dashboard.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
🛠 Development
Backend

The backend uses:

Python
FastAPI
Uvicorn
JWT authentication
PostgreSQL

Run the development server:

python -m uvicorn main:app --reload
Frontend

The frontend uses:

React
Vite
JavaScript

Run the development server:

npm run dev
🧪 Testing

Milestone 1 was tested using:

FastAPI Swagger UI
PostgreSQL
pgAdmin
React frontend
JWT authentication
Tested Flow
Registration
     ↓
Database
     ↓
Login
     ↓
JWT Token
     ↓
Protected /me
     ↓
Dashboard
     ↓
Logout

All of these core Milestone 1 flows have been successfully tested.

📈 Project Progress
Milestone 1
Authentication & User Management
████████████████████ 100% ✅


Milestone 2
Core Decision Platform
░░░░░░░░░░░░░░░░░░░░ 0%


Milestone 3
Decision Replay & Review
░░░░░░░░░░░░░░░░░░░░ 0%


Milestone 4
Analysis & Final Integration
░░░░░░░░░░░░░░░░░░░░ 0%
🔮 Future Development

Future milestones will build the core Expert Decision Replay functionality on top of the Milestone 1 foundation.

Planned areas include:

Decision creation
Decision storage
Expert decision records
Decision review
Decision replay
Team-based workflows
Decision analysis
Additional user permissions
Platform integration
🔒 Security

The platform uses JWT-based authentication for protected endpoints.

Passwords are not stored directly as plain text. The backend uses password hashing before storing credentials.

Sensitive configuration values should be stored using environment variables and should not be committed to GitHub.

📚 API Documentation

When the backend is running, interactive API documentation is available at:

http://127.0.0.1:8000/docs

This can be used to test the backend endpoints directly through Swagger UI.

👨‍💻 Development Workflow

The project is maintained using Git and GitHub.

Milestone-based commits are used to track development progress.

Example:

Milestone 1
     │
     ▼
Authentication + User Management
     │
     ▼
Git Commit
     │
     ▼
GitHub
     │
     ▼
Milestone 2
