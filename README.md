Expert Decision Replay Platform
📌 Project Overview

The Expert Decision Replay Platform is a web-based Decision Intelligence Platform designed to help organizations create, document, analyze, discuss, review, and track important decisions.

The platform provides a centralized place where users can record the reasoning behind decisions, compare alternatives, manage discussions, upload supporting documents, and track outcomes.

🎯 Objectives
Centralize organizational decisions.
Record the problem and reasoning behind each decision.
Compare and evaluate different alternatives.
Enable team discussions and comments.
Manage decision evidence and supporting documents.
Track decision status, priority, and outcomes.
Provide role-based access.
Maintain a structured database for decision information.
Support decision review and replay.
🚀 Main Features
Milestone 1 – User Management & Authentication
1. User Registration

Users can create an account by providing their required information.

2. User Login

Registered users can securely log in to the platform.

3. JWT Authentication

JSON Web Tokens are used to authenticate users and protect API endpoints.

4. Role Management

The system supports different user roles such as:

Employee
Reviewer
Manager
Administrator
5. Team Management

Users can be associated with teams such as:

Data Science
Software Development
AI and Machine Learning
Management
6. User Profiles

User profile information can be maintained separately from authentication information.

Milestone 2 – Decision Management
1. Decision Creation

Users can create and document new organizational decisions.

A decision can contain information such as:

Title
Problem Statement
Description
Priority
Status
Recommended Alternative
Stakeholders
Risks
Evaluation Criteria
Implementation Information
Outcome
2. Problem Statement

The problem or situation that requires a decision can be clearly documented.

3. Alternative Analysis

Multiple alternatives can be added and compared before selecting the recommended option.

The system supports:

Alternative creation
Alternative description
Evaluation
Comparison
Recommended alternative
4. Discussion Module

Team members can participate in discussions related to a decision.

Users can:

Add comments
View discussions
Share opinions
Respond to decision-related information

This helps maintain the reasoning and communication behind a decision.

5. Document Upload

Supporting documents can be associated with decisions.

Examples include:

Reports
Research documents
PDFs
Supporting evidence
Reference documents
6. Decision Profiles

Decision-related profile information can be maintained and managed through the platform.

7. Decision Tracking

Important decision information can be tracked throughout its lifecycle.

Examples:

Draft
Under Review
Approved
Implemented
Completed
8. Decision Review

Decisions can be reviewed by authorized users to improve transparency and accountability.

9. Decision Replay

The platform is designed to preserve the information behind a decision so that users can later understand:

What was decided → Why it was decided → What alternatives were considered → What happened after implementation

🏗️ System Architecture
                 ┌─────────────────────────┐
                 │       React Frontend    │
                 │                         │
                 │  Login / Register       │
                 │  Dashboard              │
                 │  Decisions              │
                 │  Alternatives           │
                 │  Discussions            │
                 │  Documents              │
                 └────────────┬────────────┘
                              │
                              │ REST API
                              ▼
                 ┌─────────────────────────┐
                 │      FastAPI Backend    │
                 │                         │
                 │ Authentication          │
                 │ Users                    │
                 │ Roles                    │
                 │ Teams                    │
                 │ Decisions                │
                 │ Alternatives             │
                 │ Discussions              │
                 │ Documents                │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │     PostgreSQL Database │
                 │                         │
                 │ Users                    │
                 │ Roles                    │
                 │ Teams                    │
                 │ Decisions                │
                 │ Alternatives             │
                 │ Discussions              │
                 │ Documents                │
                 └─────────────────────────┘
🛠️ Technology Stack
Frontend
React
JavaScript
HTML
CSS
Vite
Backend
Python
FastAPI
SQLAlchemy
JWT Authentication
Database
PostgreSQL
Development Tools
Visual Studio Code
Git
GitHub
npm
Python Virtual Environment
📁 Project Structure
Expert-Decision-Replay-Platform/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   │
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── roles.py
│   │       ├── teams.py
│   │       ├── profiles.py
│   │       ├── decisions.py
│   │       ├── alternatives.py
│   │       ├── discussion.py
│   │       └── documents.py
│   │
│   └── requirements.txt
│
├── database/
│   ├── schema.sql
│   ├── milestone2_alternative_analysis.sql
│   ├── milestone2_discussion_module.sql
│   └── milestone2_document_uploads.sql
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── translations.js
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── uploads/
│
└── .gitignore
🗄️ Database

The project uses PostgreSQL for storing application data.

The database contains tables for:

Users
Roles
Teams
User Profiles
Decisions
Decision Alternatives
Discussions
Documents
Decision Evidence
Decision Reviews
Decision Outcomes
Decision Versions
Decision Tags
Decision Feedback
Decision Steps
⚙️ Installation & Setup
1. Clone the Repository
git clone -b Sameeksha https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform
🐍 Backend Setup
2. Create a Virtual Environment

From the project root:

cd backend

Create the virtual environment:

python -m venv venv

Activate it:

.\venv\Scripts\Activate.ps1

If PowerShell blocks activation, you can use:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Then activate again:

.\venv\Scripts\Activate.ps1
3. Install Backend Dependencies
pip install -r requirements.txt
🗄️ PostgreSQL Configuration

Create a PostgreSQL database:

expert_decision_replay

Then execute the SQL schema:

database/schema.sql

The Milestone 2 SQL files can also be executed as required:

database/milestone2_alternative_analysis.sql
database/milestone2_discussion_module.sql
database/milestone2_document_uploads.sql
🔐 Environment Variables

Create a .env file locally.

Example:

DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/expert_decision_replay
SECRET_KEY=your_secret_key

Replace:

YOUR_PASSWORD

with your PostgreSQL password.

Important

The .env file contains sensitive configuration and should not be uploaded to GitHub.

The project .gitignore already contains:

.env
*.env
▶️ Run the Backend

From the backend directory:

uvicorn app.main:app --reload

The backend will normally run at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs
⚛️ Frontend Setup

Open another PowerShell terminal.

From the project root:

cd frontend

Install dependencies:

npm install

Start the React development server:

npm run dev

The frontend will normally run at:

http://localhost:5173
🔄 Application Flow
Register
   ↓
Login
   ↓
Authentication
   ↓
Dashboard
   ↓
Create / View Decision
   ↓
Problem Statement
   ↓
Add Alternatives
   ↓
Evaluate Alternatives
   ↓
Discussion
   ↓
Upload Supporting Documents
   ↓
Review / Approval
   ↓
Implementation
   ↓
Track Outcome
   ↓
Decision Replay
