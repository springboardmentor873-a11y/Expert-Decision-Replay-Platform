# 🎨 Frontend — Expert Decision Replay Platform

> Capture the reasoning. Replay the decision. Learn from the outcome.

The frontend provides a simple interface for creating, viewing, reviewing, and understanding important decisions.

---

## 🎯 Frontend Objective

The frontend will allow users to:

- Login and register
- View the dashboard
- Create a decision
- Add the problem and background
- Add alternatives
- Record reasoning
- Select the final decision
- Review decisions
- View expected and actual outcomes

---

## 🛠️ Technology Stack

- React
- Vite
- JavaScript
- HTML
- CSS
- React Router
- Axios
- Canva for initial UI wireframes

---

## 👥 User Roles

| Role | Responsibility |
|------|----------------|
| Employee | Creates and manages decisions |
| Reviewer | Reviews submitted decisions |
| Manager | Reviews and approves decisions |
| Administrator | Manages users and system activities |

---

## 🔄 Decision Flow

Problem
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

# 📌 Milestone 1 — Frontend Foundation

Milestone 1 focuses on understanding the frontend requirements, designing the initial UI, and preparing the basic React structure.

## 1. 📋 Requirement Analysis

The frontend requirements include:

- Identify users and roles
- Identify required screens
- Define basic navigation
- Define the decision entry flow
- Define the review flow
- Define the outcome flow
- Keep the interface simple and user-friendly

---

## 2. 🎨 UI Wireframes

Initial UI screens:

- Login
- Registration
- Dashboard
- Create Decision
- Decision Details
- Review Decision
- Outcome
- Profile
- User Management

The initial UI design will be prepared using Canva before implementing the screens.

---

## 3. 🖥️ Initial UI Layout

Basic navigation:

Login
↓
Dashboard
↓
Create Decision
↓
Decision Details
↓
Review
↓
Outcome

Dashboard will contain:

- Total Decisions
- Pending Reviews
- Completed Decisions
- Recent Decisions
- Create New Decision button

---

## 4. 🧱 Frontend Structure

frontend/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── assets/
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
├── vite.config.js
└── README.md

---

## 5. 🧩 Main Components

The frontend will use reusable components such as:

- Navbar
- Sidebar
- Button
- Input
- Form
- Card
- Modal
- Decision Card
- Review Card
- Outcome Card

---

## 6. 📄 Main Pages

### Login

Fields:

- Email / Username
- Password

Actions:

- Login
- Go to Registration

### Registration

Fields:

- Name
- Email
- Password
- Role

Actions:

- Register
- Go to Login

### Dashboard

The dashboard will show:

- Total decisions
- Pending reviews
- Completed decisions
- Recent decisions
- Create Decision option

### Create Decision

The user will enter:

- Decision title
- Problem
- Background
- Alternatives
- Important factors
- Reasoning
- Selected option
- Expected outcome

### Decision Details

The page will display:

- Problem
- Alternatives
- Comparison
- Reasoning
- Final decision
- Review status
- Expected outcome
- Actual outcome

### Review

The reviewer can:

- View the decision
- Read the reasoning
- Add comments
- Approve the decision
- Request changes

### Outcome

The page will show:

- Expected outcome
- Actual outcome
- Review comments
- Lessons learned

---

## 🔌 Frontend and Backend Connection

The frontend will communicate with the backend through APIs.

React Frontend
↓
HTTP Requests
↓
FastAPI Backend
↓
Database

Axios will be used for API communication.

Initial API operations:

POST /login
POST /users
GET /decisions
POST /decisions
GET /decisions/{id}
PUT /decisions/{id}
POST /reviews
GET /outcomes

---

## ⚙️ Frontend Setup Commands

Open the terminal and run:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The application will normally run at:

http://localhost:5173

---

## 🚀 Frontend Development Steps

1. Analyse frontend requirements
2. Identify users and roles
3. Define screen flow
4. Create UI wireframes in Canva
5. Set up React and Vite
6. Create basic frontend folders
7. Create Login and Registration screens
8. Create Dashboard
9. Create Decision Entry screen
10. Create Decision Details screen
11. Create Review screen
12. Create Outcome screen
13. Connect frontend with backend APIs
14. Test the complete user flow

---

## 🎨 UI Design Principles

The interface will follow:

- Clean layout
- Simple navigation
- Consistent buttons
- Clear forms
- Easy-to-read information
- Responsive design
- Clear status indicators
- Simple and user-friendly screens

---

## 📁 Development Plan

### Milestone 1

- Requirement analysis
- User roles
- Decision flow
- UI wireframes
- Canva design
- React + Vite setup
- Basic frontend structure

### Milestone 2

- Login and Registration
- Dashboard
- Decision creation
- Decision details

### Milestone 3

- Review functionality
- Outcome page
- Backend API integration

### Milestone 4

- Testing
- Bug fixing
- UI improvements
- Final integration

---

## 📌 Current Status

Milestone 1 — Frontend Foundation

Current work:

- Frontend requirements identified
- User roles identified
- Basic decision flow defined
- Initial screens identified
- UI wireframe planning started
- React + Vite structure prepared

---

## 🌱 Future Improvements

- Decision history
- Search and filtering
- Decision comparison
- Outcome analytics
- Notifications
- Role-based navigation
- Responsive improvements

---

## 💡 Project Vision

The frontend should make it easy for users to understand:

What was the problem?

What alternatives were considered?

Why was the decision selected?

What happened after the decision?

The goal is to provide a simple interface for recording, reviewing, and learning from important decisions.
