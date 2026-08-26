# 🧠 Expert Decision Replay Platform

> A platform for capturing, managing, reviewing, and replaying expert decision-making processes.

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- Python
- Node.js
- PostgreSQL
- pgAdmin
- Git

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
```

---

## 🔧 Step 2 — Start the Backend

Open a terminal and navigate to the backend:

```bash
cd Backend
```

### Create a Python virtual environment

```bash
python -m venv .venv
```

### Activate the virtual environment

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

### Install backend dependencies

```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib bcrypt python-multipart
```

### Start FastAPI

```bash
python -m uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

## 📚 Step 3 — Open API Documentation

FastAPI automatically provides interactive API documentation.

Open:

```text
http://127.0.0.1:8000/docs
```

From Swagger UI, you can view and test the available API endpoints.

---

## 💻 Step 4 — Start the Frontend

Open a new terminal.

Navigate to the frontend:

```bash
cd frontend
```

Install the required packages:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

Open this address in your browser.

---

## 🔐 Step 5 — Login

The frontend provides a login page where users can enter:

- Email
- Password

The login form sends the credentials to the FastAPI backend.

If the credentials are valid, the backend returns a JWT access token.

The token is stored in the browser using:

```text
localStorage
```

---

## 👤 Step 6 — User Information

After successful login, the frontend requests the authenticated user's information using:

```text
GET /me
```

The JWT token is sent with the request:

```text
Authorization: Bearer <token>
```

The dashboard displays information such as:

- User name
- Email
- User ID
- Role ID
- Team ID

---

## 🗄️ Database Structure

The project uses PostgreSQL as the database.

The current database structure contains the following tables:

### Roles

Stores the different roles available in the platform.

Current roles:

- Employee
- Reviewer
- Manager
- Administrator

### Teams

Stores team information.

### Users

Stores user information including:

- User ID
- Name
- Email
- Password hash
- Role ID
- Team ID

### User Profiles

Stores additional information about users, including:

- Phone
- Department
- Designation
- Profile image

---

## 🏗️ Project Structure

```text
Expert-Decision-Replay-Platform/
│
├── Backend/
│   ├── Schemas/
│   │   ├── __init__.py
│   │   ├── team.py
│   │   └── user.py
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
│   ├── security/
│   │   ├── _init_.py
│   │   ├── auth.py
│   │   ├── jwt.py
│   │   └── password.py
│   │
│   └── main.py
│
├── frontend/
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
│   └── vite.config.js
│
└── README.md
```

---

## 🔑 Authentication Flow

The current authentication flow works as follows:

```text
User
  │
  ▼
React Login Page
  │
  │ Email + Password
  ▼
FastAPI Backend
  │
  ▼
Verify Credentials
  │
  ▼
Generate JWT Token
  │
  ▼
React Frontend
  │
  ▼
Store Token in localStorage
  │
  ▼
Request /me
  │
  ▼
Display User Dashboard
```

---

## 🎯 Milestone 1

Milestone 1 focuses on establishing the basic authentication and user-management foundation of the platform.

### Completed

- Project repository setup
- Backend setup using FastAPI
- React frontend setup using Vite
- PostgreSQL database structure
- User model
- Role model
- Team model
- Password handling
- JWT authentication
- Login API
- Protected `/me` endpoint
- Frontend login page
- Frontend dashboard
- User information display
- Logout functionality
- GitHub repository setup

---

## 🛠️ Technologies Used

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy

### Database

- PostgreSQL
- pgAdmin

### Authentication

- JWT
- Password hashing

### Version Control

- Git
- GitHub

---

## 📌 Current Status

The first milestone of the Expert Decision Replay Platform has been completed.

The application currently supports:

```text
Login
  ↓
JWT Authentication
  ↓
Authenticated User
  ↓
User Information
  ↓
Dashboard
  ↓
Logout
```

Further milestones will extend the platform with the core expert decision capture, review, and replay functionality.

---

## 👥 Project Roles

The platform currently defines four user roles:

| Role | Purpose |
|------|---------|
| Employee | Regular platform user |
| Reviewer | Reviews submitted decisions |
| Manager | Manages teams and reviews |
| Administrator | Manages the overall platform |

---

## 📄 License

This project is developed as part of the Expert Decision Replay Platform project.
