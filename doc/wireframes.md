# UI Wireframes — Milestone 1

## 1. Design Direction

The first interface is designed as a clean workspace for organizational decision management.

Milestone 1 focuses on authentication, navigation, and role-aware dashboard structure. Detailed decision-management screens will be introduced later.

## 2. Login

```text
┌──────────────────────────────────────────────┐
│                 Decisionvault                │
│        Decision Intelligence Platform        │
│                                              │
│  Email                                       │
│  |________________________________________|  │
│                                              │
│  Password                                    │
│  |________________________________________|  │
│                                              │
│                 [ Sign in ]                  │
│                                              │
│        Don't have an account? Register       │
└──────────────────────────────────────────────┘
```

## 3. Registration

```text
┌──────────────────────────────────────────────┐
│                 Create account               │
│                                              │
│  Full name                                   │
│  |________________________________________|  │
│                                              │
│  Email                                       │
│  |________________________________________|  │
│                                              │
│  Password                                    │
│  |________________________________________|  │
│                                              │
│  Role                                        │
│  | Employee                              ▼ | │
│                                              │
│              [ Create account ]              │
└──────────────────────────────────────────────┘
```

## 4. Main Workspace

```text
┌─────────────────┬─────────────────────────────────────────┐
│  Decisionvault  │ Overview                                │
│                 │                                         │
│ - Overview      │ Welcome back                            │
│ - Decisions     │ Manage decisions and reviews from one   │
│ - Reviews       │ workspace.                              │
│ - Knowledge     │                                         │
│                 │ Total   Under Review   Approved         │
│                 │  12          4             8            │
│                 │                                         │
│                 │ Recent Decisions:                       │
│                 │ - Database architecture       Draft     │
│                 │ - Cloud infrastructure        Review    │
│ Settings        │ - Authentication strategy     Approved  │
└─────────────────┴─────────────────────────────────────────┘
```