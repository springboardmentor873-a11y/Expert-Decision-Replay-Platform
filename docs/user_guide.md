# Expert Decision Replay Platform — Role-Based User Guide

This user guide walks each enterprise role through navigating and using the Expert Decision Replay Platform.

---

## 1. Getting Started

### 1.1 Accessing the Platform
- **URL**: `http://localhost:5173` (Local Dev) or `http://localhost` (Docker)
- Navigate to the **Login** screen (`/login`).
- Enter your registered email address and password.
- Upon successful authentication, you will be redirected to your **Dashboard** (`/dashboard`).

---

## 2. Employee Workflow

### 2.1 Dashboard & Navigation
- The dashboard highlights your active drafts, recent decisions, assigned team, and unread notifications.
- Use the left navigation sidebar to access **Decisions**, **Knowledge Repository**, **My Team**, and **Settings**.

### 2.2 Creating a Structured Decision
1. Navigate to **Decisions** and click **Create Decision** (`/decisions/create`).
2. Fill out the mandatory structured fields:
   - **Title**: Brief, descriptive summary of the decision.
   - **Category**: Select the relevant organizational domain.
   - **Problem Statement**: What problem necessitated this decision?
   - **Background Context & Constraints**: Budget, technical limitations, deadlines, legacy systems.
   - **Decision Taken**: The selected path or architectural choice.
   - **Reasoning & Trade-Offs**: Why this path was selected over others.
   - **Expected Outcomes**: Projected benefits, metrics, and deliverables.
3. Click **Save as Draft**.

### 2.3 Adding Alternatives
1. Open your draft decision and scroll to the **Alternatives** section.
2. Click **Add Alternative**.
3. Detail the alternative option:
   - Alternative Title and Description.
   - Pros and Cons.
   - Feasibility Rating (Scale 1–10).
   - Risk Level (`Low`, `Medium`, `High`, `Critical`).
4. Click **Save Alternative**.

### 2.4 Attaching Documents & Meeting Notes
- **Upload Supporting Documents**: In the **Documents** section, click **Upload File** to attach architecture diagrams, benchmark sheets, or RFP documents (up to 10 MB).
- **Record Meeting Notes**: In the **Meeting Notes** section, record notes from sync meetings with attendees, summary, key takeaways, and action items.

### 2.5 Inspecting Version Snapshots
- Any edit to a saved decision creates a version snapshot.
- Access the **Version History** tab to view previous versions or open the **Version Compare** modal to inspect side-by-side textual diffs.

### 2.6 Submitting for Review
- When your draft is complete, click **Submit Decision**.
- The status transitions to `Submitted`. Core decision fields become locked from further edits, and reviewers are notified.

### 2.7 Collaborating in Discussions
- Use the **Discussions** panel at the bottom of the decision view to ask questions, tag team members, and post replies to comments.

### 2.8 Team Workspaces & Knowledge Repository
- **My Team (`/my-team`)**: View your active team, teammates, Team Lead, and team-specific decisions. If not on a team, browse teams at `/teams` and click **Request to Join**.
- **Knowledge Repository (`/knowledge-repository`)**: Search past decisions, filter by category or status, and open the interactive **Knowledge Graph** to explore architectural relationships.

---

## 3. Reviewer Workflow

### 3.1 Pending Reviews Queue
- Navigate to **Pending Approvals** (`/approvals/pending`) via the sidebar or top banner.
- Review decisions submitted across your assigned categories or teams.

### 3.2 Conducting a Review
1. Click on a pending decision to open its full detail view.
2. Inspect the **Problem Statement**, **Reasoning**, **Evaluated Alternatives**, and **Attached Documents**.
3. Check the **Discussion** feed for any clarifying questions from stakeholders.
4. In the **Review Actions** panel:
   - To approve: Click **Approve Decision** and enter constructive feedback.
   - To reject: Click **Reject Decision** and document reasons or requested changes.
5. Click **Submit Review**. The author receives an instant notification of the outcome.

### 3.3 Accessing Analytics
- Reviewers can view **Reports & Analytics** (`/reports`) to inspect approval cycle-times, outcome accuracy, and alternative risk distributions.

---

## 4. Manager Workflow

### 4.1 Team Administration
- Navigate to **Teams** (`/teams`) to view all teams across the enterprise.
- As a Team Lead or Manager:
  - Create new teams with descriptions and leads.
  - Review **Join Requests**: Approve or reject pending requests from employees.
  - Manage rosters: Add or remove team members.
  - Access the **Team Workspace** (`/teams/{id}/workspace`) for team-level decisions.

### 4.2 Multi-Step Approval Workflows
- Managers participate in multi-tiered governance chains (e.g., Step 2 or Executive Sign-off).
- Review SLA deadlines and overdue flags.
- Trigger step escalations (`/escalate`) if peer reviews stall past due dates.

### 4.3 Departmental Reports & Audit Inspection
- Access **Reports & Analytics** (`/reports`) with export capabilities to **PDF**, **Excel**, or **CSV**.
- Review the **Audit Logs** (`/audit-logs`) to monitor status changes, user promotions, and system compliance within permitted scopes.

---

## 5. Administrator Workflow

### 5.1 User Management (`/users`)
- Browse the full organizational user roster.
- Inspect individual user profiles, roles, and registration dates.
- **Account Activation**: Deactivate inactive or departing personnel (`is_active = False`) or reactivate accounts.
- **Role Reassignment**: Elevate or reassign roles (`Employee`, `Reviewer`, `Manager`, `Administrator`).

### 5.2 Global Decision Governance
- Administrators possess override authority across all decisions:
  - Edit or delete decisions in any state if policy compliance demands it.
  - Execute soft-archives on deprecated decisions.
  - Restore archived decisions back into active catalog status.

### 5.3 System-Wide Audit & Compliance (`/audit-logs`)
- Filter and search the complete tamper-resistant audit trail by user, action, entity, or date range.
- Export full compliance audit datasets to CSV for external regulatory audits.

### 5.4 Categories & Tag Management
- Create, rename, or retire organizational categories (`/categories`).
- Curate tag folksonomies to maintain knowledge repository hygiene.
