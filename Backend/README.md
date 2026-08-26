# ⚙️ Backend — Expert Decision Replay Platform

> Capture the reasoning. Replay the decision. Learn from the outcome.

The backend is responsible for storing and managing decisions, alternatives, reasoning, reviews, decision history and outcomes.

---

## 🎯 Backend Objective

The backend will provide APIs to:

- Create and manage users
- Create and manage decisions
- Store alternatives
- Store decision reasoning
- Store reviews
- Store decision history
- Store expected and actual outcomes
- Connect the application with the database

---

# 📌 Milestone 1 — Backend Foundation

Milestone 1 focuses on understanding the backend requirements, database design, API design and basic FastAPI setup.

## 1. 📋 Requirement Analysis

### User Roles

Employee - Creates and manages decisions

Reviewer - Reviews submitted decisions

Manager - Reviews and approves decisions

Administrator - Manages users and system activities

### Decision Information

The backend should store:

- Decision title
- Problem or situation
- Important factors
- Alternatives considered
- Reasoning behind the decision
- Final decision
- Decision status
- Review details
- Expected outcome
- Actual outcome

### Decision Flow

Problem
↓
Important Factors
↓
Alternatives
↓
Comparison and Reasoning
↓
Final Decision
↓
Review
↓
Expected Outcome
↓
Actual Outcome

---

# 🏗️ 2. Backend Architecture Design

The backend will follow a simple layered structure.

Client / Frontend
↓
FastAPI
↓
Routers
↓
Schemas
↓
Models
↓
SQLAlchemy
↓
PostgreSQL

### Architecture Components

Frontend
- Sends requests to the backend APIs.

FastAPI
- Handles HTTP requests and responses.

Routers
- Contains API endpoints for different features.

Schemas
- Validates incoming and outgoing data.

Models
- Defines database tables.

SQLAlchemy
- Connects the application with the database.

PostgreSQL
- Stores the application data.

---

# 🗄️ 3. Database Design

### Initial Entities

- Users
- Decisions
- Alternatives
- Reviews
- Decision History
- Outcomes

### Entity Relationship Design

Users
|
| creates
↓
Decisions
|
+-------- Alternatives
|
+-------- Reviews
|
+-------- Decision History
|
+-------- Outcomes

### Users

Users will contain:

- User ID
- Name
- Email
- Password
- Role
- Created date

### Decisions

Decisions will contain:

- Decision ID
- User ID
- Title
- Problem
- Important factors
- Reasoning
- Final decision
- Status
- Created date
- Updated date

### Alternatives

Alternatives will contain:

- Alternative ID
- Decision ID
- Alternative name
- Description
- Advantages
- Disadvantages
- Selected status

### Reviews

Reviews will contain:

- Review ID
- Decision ID
- Reviewer ID
- Comments
- Review status
- Review date

### Decision History

Decision History will contain:

- History ID
- Decision ID
- Changed by
- Previous status
- New status
- Change description
- Changed date

### Outcomes

Outcomes will contain:

- Outcome ID
- Decision ID
- Expected outcome
- Actual outcome
- Result
- Outcome date

---

# 🎨 4. Database Relationship Design

USER
|
| 1
|
| creates
|
| many
↓
DECISION
|
+------------------+
|                  |
|                  |
↓                  ↓
ALTERNATIVE       REVIEW
|
|
↓
DECISION HISTORY

DECISION
|
↓
OUTCOME

### Main Relationship

One User
↓
Many Decisions

One Decision
↓
Many Alternatives
↓
Many Reviews
↓
Many History Records
↓
One or More Outcomes

---

# 🔌 5. API Design

### User APIs

POST /users/register

Create a new user.

POST /users/login

Login an existing user.

GET /users

View users.

GET /users/{id}

View one user.

### Decision APIs

GET /decisions

View all decisions.

POST /decisions

Create a new decision.

GET /decisions/{id}

View one decision.

PUT /decisions/{id}

Update a decision.

DELETE /decisions/{id}

Delete a decision.

### Alternative APIs

POST /decisions/{id}/alternatives

Add an alternative.

GET /decisions/{id}/alternatives

View alternatives.

### Review APIs

POST /decisions/{id}/reviews

Add a review.

GET /decisions/{id}/reviews

View reviews.

### Outcome APIs

POST /decisions/{id}/outcome

Add an outcome.

GET /decisions/{id}/outcome

View the outcome.

### Health API

GET /health

Checks whether the backend is working.

---

# 📁 6. Backend Folder Structure

backend/
|
+-- README.md
+-- main.py
+-- requirements.txt
+-- .env
|
+-- app/
    |
    +-- __init__.py
    +-- database.py
    +-- models.py
    +-- schemas.py
    |
    +-- routers/
        |
        +-- __init__.py
        +-- health.py
        +-- users.py
        +-- decisions.py
        +-- reviews.py
        +-- outcomes.py

---

# 🧩 7. File Responsibilities

main.py

Main entry point of the FastAPI application.

database.py

Handles the PostgreSQL database connection.

models.py

Contains database models.

schemas.py

Contains request and response validation schemas.

routers/users.py

Contains user registration and login APIs.

routers/decisions.py

Contains decision management APIs.

routers/reviews.py

Contains review APIs.

routers/outcomes.py

Contains outcome APIs.

.env

Stores environment configuration such as database connection details.

requirements.txt

Stores the Python packages required by the backend.

---

# ⚡ 8. FastAPI Setup

### Step 1 — Create Backend Folder

mkdir backend

cd backend

### Step 2 — Create Virtual Environment

python -m venv venv

### Step 3 — Activate Virtual Environment

Windows:

venv\Scripts\activate

### Step 4 — Install FastAPI

pip install fastapi uvicorn

### Step 5 — Install Database Packages

pip install sqlalchemy psycopg2-binary

### Step 6 — Install Supporting Package

pip install pydantic python-dotenv

### Step 7 — Save Dependencies

pip freeze > requirements.txt

---

# 🗃️ 9. PostgreSQL Configuration

PostgreSQL will be used to store application data.

Example:

DATABASE_URL=postgresql://username:password@localhost:5432/decision_replay

The database configuration will be stored in the .env file.

The .env file should not be uploaded to GitHub.

---

# ▶️ 10. Run the Backend

Start the FastAPI server:

uvicorn main:app --reload

Backend URL:

http://127.0.0.1:8000

FastAPI Swagger documentation:

http://127.0.0.1:8000/docs

The Swagger page will be used to test the APIs.

---

# 🧪 11. Basic API Testing

### Root API

GET /

Expected response:

{
  "message": "Expert Decision Replay Platform API is running"
}

### Health API

GET /health

Expected response:

{
  "status": "healthy"
}

---

# 🔐 12. Authentication Design

Authentication will be added after the basic backend foundation.

### Authentication Flow

Registration
↓
Login
↓
Verify User
↓
Generate JWT
↓
Authenticated Request
↓
Protected API

### Planned Features

- User registration
- User login
- Password protection
- JWT authentication
- Role-based access

---

# 🔄 13. Decision Management Design

Create Decision
↓
Enter Problem
↓
Add Important Factors
↓
Add Alternatives
↓
Compare Alternatives
↓
Record Reasoning
↓
Select Final Decision
↓
Submit for Review
↓
Review and Approval
↓
Record Expected Outcome
↓
Record Actual Outcome
↓
Replay Decision

---

# 🛠️ 14. Backend Commands

Create virtual environment:

python -m venv venv

Activate environment:

venv\Scripts\activate

Install packages:

pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv

Save packages:

pip freeze > requirements.txt

Run backend:

uvicorn main:app --reload

Open API documentation:

http://127.0.0.1:8000/docs

---

# 📦 15. Milestone 1 Deliverables

- Requirement analysis
- User roles
- Decision requirements
- Database entities
- Database relationships
- Backend architecture design
- API design
- FastAPI setup
- Backend folder structure
- PostgreSQL plan
- Authentication plan
- Basic API testing plan

---

# 🚀 16. Milestone 1 Goal

The goal of Milestone 1 is to prepare a clear backend foundation for the Expert Decision Replay Platform.

The backend will later support:

Authentication
↓
User Management
↓
Decision Management
↓
Alternative Management
↓
Review and Approval
↓
Decision History
↓
Outcome Tracking
↓
Decision Replay

The main purpose is to store not only the final decision, but also the reasoning, alternatives, reviews and outcomes so that the decision can be understood and replayed later.
