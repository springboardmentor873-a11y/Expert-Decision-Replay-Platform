# UI Wireframe & Navigation Flow Documentation - Milestone 1

This document outlines the visual structure, layout hierarchy, and navigation state machines for the **Expert Decision Replay Platform** frontend.

---

## 1. Login Page Wireframe (`/login`)

```text
+-----------------------------------------------------------------------+
|                                                                       |
|                          [ ⚖ Brand Icon ]                             |
|                              Sign In                                  |
|                 Expert Decision Replay Platform                       |
|                                                                       |
|         +---------------------------------------------------+         |
|         | [ ! ] Invalid email or password (Error Alert)    |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Email Address                                                 |
|         +---------------------------------------------------+         |
|         | user@example.com                                  |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Password                                                      |
|         +---------------------------------------------------+         |
|         | ••••••••••••••••                                  |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         +---------------------------------------------------+         |
|         | [                  Sign In                      ] |         |
|         +---------------------------------------------------+         |
|                                                                       |
|                   Don't have an account? Create an account            |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 2. Registration Page Wireframe (`/register`)

```text
+-----------------------------------------------------------------------+
|                                                                       |
|                          [ ⚖ Brand Icon ]                             |
|                           Create Account                              |
|                 Expert Decision Replay Platform                       |
|                                                                       |
|         +---------------------------------------------------+         |
|         | [ ✓ ] Registration successful! Redirecting...     |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Full Name                                                     |
|         +---------------------------------------------------+         |
|         | Jane Doe                                          |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Email Address                                                 |
|         +---------------------------------------------------+         |
|         | jane@example.com                                  |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Password (min. 8 characters)                                  |
|         +---------------------------------------------------+         |
|         | ••••••••••••••••                                  |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         Platform Role                                                 |
|         +---------------------------------------------------+         |
|         | Employee (Submit decisions for review)          v |         |
|         +---------------------------------------------------+         |
|         | Options:                                          |         |
|         | - Employee (Submit decisions for review)          |         |
|         | - Reviewer (Analyze and evaluate alternatives)    |         |
|         | - Manager (Approve and manage decisions)          |         |
|         | - Administrator (Manage platform & users)         |         |
|         +---------------------------------------------------+         |
|                                                                       |
|         +---------------------------------------------------+         |
|         | [              Register Account                 ] |         |
|         +---------------------------------------------------+         |
|                                                                       |
|                     Already have an account? Sign in here             |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 3. Protected Home Page Wireframe (`/home`)

```text
+-----------------------------------------------------------------------------------+
| [⚖] Expert Decision Replay Platform             Jane Doe  [MANAGER]  [ Sign Out ]|
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  [ MILESTONE 1 COMPLETED ]                                                  |  |
|  |  Expert Decision Replay Platform                                            |  |
|  |  Authentication and User Management are successfully configured.            |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +---------------------------------------+ +-----------------------------------+  |
|  | User Profile                 [ACTIVE] | | Role Capabilities                 |  |
|  |---------------------------------------| |-----------------------------------|  |
|  | Full Name:       Jane Doe             | | Manager Permissions:              |  |
|  | Email Address:   jane@example.com     | | Can review, approve, override,    |  |
|  | Assigned Role:   [Manager Badge]      | | and finalize decision lifecycle   |  |
|  | Account Status:  Active & Verified    | | stages.                           |  |
|  |                                       | |                                   |  |
|  |                                       | | 🔒 JWT Authentication Active:     |  |
|  |                                       | | Protected route and API requests  |  |
|  |                                       | | are secured via signed JWT tokens.|  |
|  +---------------------------------------+ +-----------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Navigation & State Transition Flows

### User Lifecycle Flow

```text
    [ Unregistered User ]
              |
              v
       /register Page  <-------------------+
              |                            |
      (Submit Registration)                | (Has account link)
              |                            |
              v                            |
         /login Page   --------------------+
              |
        (Submit Login)
              |
        (Validate JWT)
              |
              v
       /home Dashboard  (Protected)
              |
       (Click Sign Out)
              |
              v
         /login Page
```

### Route Guard State Machine

```text
                         [ User Navigates to Route ]
                                      |
                     +----------------+----------------+
                     |                                 |
           Target: /home (Protected)          Target: /login or /register (Public)
                     |                                 |
         Is Authenticated? (JWT Valid)       Is Authenticated? (JWT Valid)
          /              \                     /              \
       [Yes]            [No]                [Yes]            [No]
         |                |                   |                |
    Render Home     Redirect to         Redirect to       Render Login /
     Component        /login               /home             Register
```