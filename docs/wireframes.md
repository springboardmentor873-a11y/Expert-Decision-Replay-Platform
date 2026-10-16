# UI Wireframes — Milestone 1 & 2

Low-fidelity wireframes for the screens built across Milestone 1 and 2.
These were drawn from the actual working app (see `App.jsx`, `pages/*.jsx`),
so they document the real layout rather than a separate design that was
never built.

| # | Screen | File | Who sees it |
|---|---|---|---|
| 1 | Login / Register | [`wireframes/01-login-register.svg`](wireframes/01-login-register.svg) | Everyone (unauthenticated) |
| 2 | Profile | [`wireframes/02-profile.svg`](wireframes/02-profile.svg) | Any logged-in user |
| 3 | Teams | [`wireframes/03-teams.svg`](wireframes/03-teams.svg) | Any logged-in user (create/assign controls: Manager & Administrator only) |
| 4 | Admin — All Users | [`wireframes/04-admin-users.svg`](wireframes/04-admin-users.svg) | Administrator only |
| 5 | Decisions List | [`wireframes/05-decisions-list.svg`](wireframes/05-decisions-list.svg) | Any logged-in user |
| 6 | Decision Detail | [`wireframes/06-decision-detail.svg`](wireframes/06-decision-detail.svg) | Any logged-in user (Edit: owner/manager/admin · Delete: admin only) |

## Navigation flow

```
Login/Register
      │
      │ (successful login)
      ▼
  Sidebar layout
      │
      ├── Profile
      ├── Decisions (list)
      │        │
      │        └── Decision Detail
      │                 ├── Overview tab
      │                 ├── Alternatives tab
      │                 ├── Comments tab
      │                 ├── Attachments tab
      │                 └── Versions tab
      ├── Teams
      └── Admin   ← only rendered if role === "administrator"
```

## Notes on the design

- Tabs, not separate pages/routes — Milestone 1 is small enough that a
  single-page tab switcher (see `App.jsx`'s `Dashboard` component) is
  simpler than adding a router dependency. This can be revisited if
  Milestone 2's decision/discussion screens make the app large enough to
  need real URLs per page (e.g. for bookmarking a specific decision).
- Role-based UI hiding (the Admin tab, the Teams create/assign forms)
  mirrors the backend's `require_role(...)` checks — the frontend hides
  controls a user can't use, but the backend is still the actual
  enforcement point if someone bypasses the UI.
