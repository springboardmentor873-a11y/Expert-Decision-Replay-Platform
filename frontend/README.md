# Expert Decision Replay Platform — Frontend

React + Vite frontend for the Milestone 1 + 2 backend.

## Setup

```bash
cd edrp-frontend
npm install
npm run dev
```

Runs at **http://localhost:5173** by default. The backend's CORS config
already allows this origin.

If your backend runs somewhere other than `http://localhost:8000`, set:

```bash
echo "VITE_API_URL=http://your-backend-host:8000" > .env
```

## What's included

- **Login / Register** — JWT auth, role picker (Employee, Reviewer, Manager, Administrator)
- **Decisions list** — filterable table by category and status, "+ New decision" modal
- **Decision detail page** with four tabs:
  - **Alternatives** — add options with pros/cons/cost/risk/feasibility; the
    highest-scoring option is auto-tagged "Recommended," matching the
    backend's composite scoring
  - **Discussion** — threaded-ready comments (backend supports `parent_id`;
    this UI shows a flat list — extend it if you want nested replies rendered)
  - **Files** — upload and list attachments
  - **Version history** — every status/field change, in order, with its summary
- Status changes on a decision (Draft → Under Review → Approved → Rejected →
  Archived) trigger the backend's version-snapshot logic automatically

## Design notes

Built as a data-dense internal tool rather than a marketing page: a real
table for decisions, muted status colors that carry meaning (amber for
review, green for approved, red for rejected), Source Serif 4 for headings
paired with Inter for UI text. Sidebar navigation on desktop collapses to a
top bar on narrow screens.

## Before deploying

- Token is stored in `localStorage` — fine for a student/internal project,
  but swap for httpOnly cookies if this ever handles real company data.
- No pagination on the decisions list yet — add it if the list grows large.
