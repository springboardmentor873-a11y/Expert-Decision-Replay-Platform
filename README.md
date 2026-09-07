# Expert Decision Replay Platform

## 📌 Project Overview

The **Expert Decision Replay Platform** is a web-based Decision Intelligence Platform designed to help organizations create, manage, review, discuss, track, and replay important business decisions.

The platform provides a centralized place where users can record decision information, compare alternatives, discuss decisions, upload supporting documents, track implementation, and review final outcomes.

---

## 🎯 Project Objectives

- Centralize organizational decisions
- Record the reasoning behind decisions
- Compare different alternatives
- Support discussions and collaboration
- Manage decision-related documents
- Track decision implementation
- Record decision outcomes
- Maintain decision history
- Provide secure user authentication
- Support different user roles and teams
- Enable decision replay for future learning

---

# 🚀 Milestone 1 – User & Access Management

Milestone 1 focuses on the basic user management and authentication system.

## Features

### 1. User Registration

New users can create an account by providing:

- Name
- Email
- Password
- Role
- Team

### 2. User Login

Registered users can securely log in using their email and password.

The system uses authentication tokens to protect the application.

### 3. Role Management

The platform supports different user roles:

- Employee
- Reviewer
- Manager
- Administrator

### 4. Team Management

Users can belong to different teams:

- Data Science
- Software Development
- AI and Machine Learning
- Management

### 5. User Profiles

User profile information is stored separately and can be used to manage additional user details.

### 6. JWT Authentication

The backend uses JWT-based authentication to protect APIs and ensure that only authenticated users can access protected resources.

---

# 📊 Milestone 2 – Decision Management

Milestone 2 extends the platform with decision management and collaboration functionality.

## Features

### 1. Decision Creation

Users can create a new decision by providing important information such as:

- Decision title
- Problem statement
- Description
- Priority
- Status
- Owner
- Assigned person
- Stakeholders
- Recommended alternative

### 2. Problem Statement

Each decision contains a clear description of the problem that needs to be solved.

This helps users understand why the decision was required.

### 3. Alternative Analysis

Users can create and compare multiple alternatives for a decision.

Each alternative can contain:

- Alternative name
- Description
- Advantages
- Disadvantages
- Cost
- Risk
- Evaluation
- Recommendation

This helps decision makers select the most suitable option.

### 4. Decision Evaluation

Different alternatives can be evaluated using relevant criteria.

This allows users to compare available options before selecting the final recommendation.

### 5. Risk Management

Important risks related to a decision can be recorded and monitored.

Examples include:

- Technical risk
- Financial risk
- Operational risk
- Implementation risk

### 6. Stakeholder Management

Important people involved in the decision can be recorded.

Stakeholders can include:

- Decision owner
- Team members
- Managers
- Reviewers
- Other responsible users

### 7. Discussion Module

Users can discuss decisions using comments and discussions.

The discussion section helps team members:

- Ask questions
- Share opinions
- Provide suggestions
- Clarify information
- Collaborate on decisions

### 8. Decision Approval

Important decisions can go through a review and approval process.

Reviewers and managers can evaluate the decision before it is finalized.

### 9. Document Upload

Users can upload documents related to decisions.

Examples include:

- Reports
- PDFs
- Supporting documents
- Analysis files
- Reference materials

Documents provide additional evidence for the decision.

### 10. Decision Tracking

Users can track the progress of decisions after they are created.

The system can maintain information such as:

- Current status
- Assigned person
- Priority
- Progress
- Important updates

### 11. Decision Outcomes

After implementation, the result of the decision can be recorded.

This helps organizations understand whether the decision achieved its expected result.

### 12. Decision Replay

The platform allows users to review the complete decision history.

Users can understand:

- What problem existed
- What alternatives were considered
- Why an option was selected
- Who participated
- What discussions happened
- What risks were identified
- What the final outcome was

This helps organizations learn from previous decisions.

---

# 🏗️ System Architecture

The application follows a three-layer architecture:

```text
React Frontend
       ↓
FastAPI REST API
       ↓
PostgreSQL Database

Frontend

The frontend provides the user interface for:

Login
Registration
Dashboard
Decision creation
Decision viewing
Alternative analysis
Discussions
Document management
Decision tracking
Backend

The backend provides REST APIs for:

Authentication
Users
Roles
Teams
Decisions
Alternatives
Discussions
Documents
Profiles
Database

PostgreSQL is used for persistent storage of application data.

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
Postman
📁 Project Structure
Expert-Decision-Replay-Platform/
│
├── backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   │
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── roles.py
│   │       ├── teams.py
│   │       ├── decisions.py
│   │       ├── alternatives.py
│   │       ├── discussion.py
│   │       ├── documents.py
│   │       └── profiles.py
│   │
│   └── requirements.txt
│
├── frontend/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── database-design/
│   ├── milestone2_alternative_analysis.sql
│   ├── milestone2_discussion_module.sql
│   └── milestone2_document_uploads.sql
│
├── uploads/
│
├── database-schema.sql
├── .gitignore
└── README.md
🗄️ Database

The project uses PostgreSQL as the primary database.

The database contains tables for managing:

Users
Roles
Teams
User profiles
Decisions
Decision versions
Decision steps
Alternatives
Evidence
Feedback
Reviews
Outcomes
Tags
Discussions
Documents
⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git
cd Expert-Decision-Replay-Platform

Switch to the project branch if required:

git checkout Sameeksha
🐍 Backend Setup

Open PowerShell or Command Prompt and go to the backend folder:

cd backend

Create a virtual environment:

python -m venv venv

Activate the virtual environment.

Windows PowerShell
.\venv\Scripts\Activate.ps1
Windows Command Prompt
venv\Scripts\activate

Install the required packages:

pip install -r requirements.txt
🔐 Environment Variables

Create a .env file inside the backend folder.

Example:

DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/expert_decision_replay
SECRET_KEY=your_secret_key

Replace YOUR_PASSWORD with your PostgreSQL password.

Do not upload the .env file to GitHub.

The .gitignore file is configured to ignore environment files.

🐘 PostgreSQL Setup

Create the database:

CREATE DATABASE expert_decision_replay;

Then execute the required SQL schema files.

Make sure PostgreSQL is running before starting the backend.

▶️ Run the Backend

From the backend directory:

uvicorn app.main:app --reload

The backend will normally run at:

http://127.0.0.1:8000

FastAPI API documentation is available at:

http://127.0.0.1:8000/docs
⚛️ Frontend Setup

Open another terminal.

Go to the frontend directory:

cd frontend

Install dependencies:

npm install

Start the React development server:

npm run dev

The frontend will normally be available at:

http://localhost:5173
🔄 Application Flow
User
 ↓
Login / Registration
 ↓
Authentication
 ↓
Dashboard
 ↓
Create / View Decision
 ↓
Problem Statement
 ↓
Alternative Analysis
 ↓
Discussion
 ↓
Review / Approval
 ↓
Implementation
 ↓
Outcome
 ↓
Decision Replay
👥 User Roles
Employee

Employees can:

Create decisions
Participate in discussions
View relevant decisions
Provide information and feedback
Reviewer

Reviewers can:

Review decisions
Evaluate alternatives
Provide feedback
Participate in discussions
Manager

Managers can:

Review important decisions
Approve decisions
Monitor implementation
Review outcomes
Administrator

Administrators can:

Manage users
Manage roles
Manage teams
Maintain the platform
🔒 Security

The platform includes security features such as:

JWT authentication
Password hashing
Protected API endpoints
Role-based access
Environment variables for sensitive configuration
Database authentication
CORS configuration

Sensitive credentials should never be committed to GitHub.

🧪 Testing

The backend APIs can be tested using:

FastAPI Swagger UI
Postman
Browser API requests

Swagger documentation:

http://127.0.0.1:8000/docs

Important API areas include:

Authentication
Users
Roles
Teams
Decisions
Alternatives
Discussions
Documents
Profiles
📌 Milestone Summary
Milestone 1

Focus: User and Access Management

Completed functionality:

User registration
User login
JWT authentication
Role management
Team management
User profiles
Protected APIs
Milestone 2

Focus: Decision Management and Collaboration

Completed functionality:

Decision creation
Problem statement
Alternative analysis
Evaluation
Risk information
Stakeholders
Discussion
Documents
Review and approval
Decision tracking
Outcomes
Decision replay
🌟 Key Benefits

The platform helps organizations:

Make decisions systematically
Keep decision information in one place
Compare alternatives
Improve team collaboration
Maintain decision history
Track implementation
Learn from previous decisions
Improve future decision-making
🔮 Future Enhancements

Possible future improvements include:

Advanced analytics dashboard
AI-based decision recommendations
Automated risk analysis
Decision quality scoring
Advanced search
Notifications
Email integration
Multilingual support
Mobile application
AI-powered decision replay
Advanced reporting
👩‍💻 Project Information

Project: Expert Decision Replay Platform

Type: Decision Intelligence Platform

Frontend: React + Vite

Backend: FastAPI + Python

Database: PostgreSQL

Authentication: JWT

Version Control: Git + GitHub

📄 License

This project is developed for educational and internship purposes.


### After pasting

Click **Preview** in GitHub. You should see the README properly formatted with headings, bullet points, code boxes, and the project structure.

Then select:

**Commit directly to the `Sameeksha` branch → Commit changes**.
