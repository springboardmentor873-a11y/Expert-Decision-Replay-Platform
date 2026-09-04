# UI Wireframes — Milestone 1

These wireframes describe the planned layout of the four Milestone 1
screens before implementation. Each is documented as a simple text
layout below, and standalone HTML wireframe mockups (boxes/labels
only, no real functionality) are provided alongside this file:

- `login-wireframe.html`
- `register-wireframe.html`
- `dashboard-wireframe.html`
- `users-wireframe.html`

## 1. Login Screen

```
--------------------------------------------------
|            Expert Decision Replay Platform      |
--------------------------------------------------
|                                                  |
|                 [ Login Card ]                  |
|   Email:    [______________________]            |
|   Password: [______________________]            |
|             [        Login        ]             |
|                                                  |
|   Don't have an account? Register here           |
--------------------------------------------------
```

## 2. Registration Screen

```
--------------------------------------------------
|            Expert Decision Replay Platform      |
--------------------------------------------------
|              [ Registration Card ]              |
|   Full Name: [______________________]           |
|   Email:     [______________________]           |
|   Password:  [______________________]           |
|   Role:      [ dropdown: Employee/Reviewer/...] |
|   Team ID:   [______________________] (optional)|
|              [       Register       ]           |
|                                                  |
|   Already have an account? Login here           |
--------------------------------------------------
```

## 3. Dashboard Screen (authenticated)

```
--------------------------------------------------
| Expert Decision Replay Platform     [Logout]    |
--------------------------------------------------
|   Welcome, <Full Name>                          |
|                                                  |
|   Full Name: <value>                            |
|   Email:     <value>                            |
|   Role:      <value>                            |
|   Team:      <value>                            |
|                                                  |
|   [Manage Users →]  (Administrators only)        |
--------------------------------------------------
```

## 4. User Management Screen (Administrator only)

```
--------------------------------------------------
| Expert Decision Replay Platform     [Logout]    |
--------------------------------------------------
|   User Management              [← Dashboard]    |
|                                                  |
|   Name      | Email      | Team  | Role | Action|
|   --------------------------------------------- |
|   Jane Doe  | jane@..    | Eng   | [▼]  | Update|
|   John Roe  | john@..    | Sales | [▼]  | Update|
--------------------------------------------------
```

These wireframes intentionally match the pages that were actually
built in `frontend/`, so the implementation can be reviewed against
the original plan.
