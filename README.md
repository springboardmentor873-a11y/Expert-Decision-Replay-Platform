\# **Expert Decision Replay Platform**



\## Overview



The Expert Decision Replay Platform is a system designed to capture, manage, and replay expert decision-making processes.



The goal of the platform is to provide a structured environment where decisions can be recorded, reviewed, and analyzed for better understanding and future decision-making.



\---



\## Project Status



\### Milestone 1 — Authentication \& User Management



\*\*Completed\*\*



Milestone 1 establishes the basic backend, database, authentication, and frontend foundation of the platform.



\### Completed Features



\- FastAPI backend

\- PostgreSQL database

\- User registration

\- User login

\- JWT authentication

\- Protected `/me` endpoint

\- Role and team management structure

\- React frontend using Vite

\- Login interface

\- Authenticated dashboard

\- User information display

\- Logout functionality



\---



\## System Architecture



```text

React Frontend

&#x20;     |

&#x20;     | HTTP Requests

&#x20;     v

FastAPI Backend

&#x20;     |

&#x20;     | Database Queries

&#x20;     v

PostgreSQL Database



Authentication Flow 



User

&#x20; |

&#x20; v

Login Page

&#x20; |

&#x20; v

POST /login

&#x20; |

&#x20; v

FastAPI

&#x20; |

&#x20; v

JWT Token

&#x20; |

&#x20; v

React stores token

&#x20; |

&#x20; v

GET /me

&#x20; |

&#x20; v

JWT Verification

&#x20; |

&#x20; v

User Information

&#x20; |

&#x20; v

Dashboard



**Technology Stack**

**Frontend**

* React
* Vite
* JavaScript

**Backend**

* Python
* FastAPI
* Uvicorn
* JWT Authentication

**Database**

* PostgreSQL
* pgAdmin

**Development Tools**

* Visual Studio Code
* Git
* GitHub



**Database Relationships**

Roles

&#x20; |

&#x20; | role\_id

&#x20; v

Users

&#x20; |

&#x20; | team\_id

&#x20; v

Teams



Users

&#x20; |

&#x20; | user\_id

&#x20; v

User Profiles



**Project structure**



Expert-Decision-Replay-Platform/

│

├── Backend/

│   ├── database/

│   ├── models/

│   ├── Schemas/

│   ├── security/

│   └── main.py

│

├── frontend/

│   ├── public/

│   └── src/

│       ├── App.jsx

│       ├── dashboard.jsx

│       ├── main.jsx

│       └── ...

│

├── .gitignore

└── README.md





**Running the Project**

Backend



Navigate to the backend directory:



cd Backend



Start the FastAPI server:



python -m uvicorn main:app --reload



The backend will run at:



http://127.0.0.1:8000



FastAPI documentation is available at:



http://127.0.0.1:8000/docs



**Frontend**



Open another terminal and navigate to the frontend:



cd frontend



Install dependencies:



npm install



Start the development server:



npm run dev

The frontend will run at:



http://localhost:5173





**Milestone 1 Authentication Flow**

* A user registers through the backend.
* The user's information is stored in PostgreSQL.
* The user enters their email and password on the React login page.
* React sends the login request to FastAPI.
* FastAPI verifies the user's credentials.
* FastAPI generates a JWT token.
* React stores the JWT token in local storage.
* React sends the token to the protected /me endpoint.
* FastAPI verifies the JWT token.
* The authenticated user's information is returned.
* The user's information is displayed on the dashboard.
* Logout removes the stored token and returns the user to the login page.



**API Endpoints Implemented**



Register

POST /register



Creates a new user in the database.



Login

POST /login



Authenticates the user and returns a JWT token.



Current User

GET /me



A protected endpoint that verifies the JWT token and returns the authenticated user's information.



**Testing**



Milestone 1 was tested using:



FastAPI Swagger UI

PostgreSQL / pgAdmin

React frontend

JWT authentication flow



The registration, login, authentication, dashboard, and logout flows were successfully tested.



**Future Development**



Future milestones will build the core functionality of the Expert Decision Replay Platform on top of the authentication foundation.



**Planned development includes:**



* Expert decision management
* Decision recording
* Decision replay
* Review workflows
* Team-based functionality
* Decision analysis
* Additional platform features



**Project Progress**

Milestone 1 — Authentication \& User Management    \[COMPLETED]



Milestone 2 — Core Platform Functionality          \[UPCOMING]



Milestone 3 — Decision Replay \& Review             \[UPCOMING]



Milestone 4 — Analysis \& Final Integration         \[UPCOMING]





**Authors**



Expert Decision Replay Platform Project





After saving it, run these \*\*three commands\*\*:



```powershell

git add README.md

git commit -m "Add project README"

git push

