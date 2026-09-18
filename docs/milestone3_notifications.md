# Milestone 3: In-App Notifications System

## Overview
The In-App Notification System provides real-time, event-driven, role-aware notifications across the lifecycle of decisions, discussions, approvals, and documents.

## Architectural Highlights
1. **Database Persistence (notifications table)**:
   - Tracks id, recipient_id, notification_type, title, message, decision_id, is_read, and created_at.
   - Indexed on recipient_id, (recipient_id, is_read), created_at, notification_type, and decision_id.
   - Foreign key cascade: deleting a decision cascades cleanly to all related notifications.

2. **Security & RBAC Enforcement**:
   - Centralized recipient calculation: No endpoint allows a client to pass recipient_id.
   - Users can only fetch, view, count, and mark read their own notifications.
   - Self-notification suppression: Users performing actions never receive notifications for their own events.
   - Deduplication: Multi-recipient batches guarantee unique recipient lists.

3. **Domain Event Triggers**:
   - **Decision Submitted**: Reviewer, Manager, and Administrator roles receive notification. Submitter is excluded.
   - **Decision Approved**: Decision creator is notified with approval details and reviewer comments.
   - **Decision Rejected**: Decision creator is notified with the rejection reason.
   - **Discussion Created**: Decision owner is notified of new comments on their decision.
   - **Discussion Reply**: Parent discussion author and decision owner are notified of replies.
   - **Document Uploaded**: Decision owner and administrators are notified of document attachments.
   - **Decision Updated**: Interested stakeholders (author and prior discussion participants) are notified of meaningful content changes (no-op updates do not generate notifications).

4. **REST API Endpoints**:
   - GET /api/v1/notifications: Paginated list of notifications with unread count and unread_only filter.
   - GET /api/v1/notifications/unread-count: Fast indexed unread notification count.
   - PATCH /api/v1/notifications/{id}/read: Mark a single notification as read.
   - PATCH /api/v1/notifications/read-all: Mark all notifications for the authenticated user as read.
   - GET /api/v1/notifications/{id}: View single notification details.

5. **Frontend UI Components**:
   - NotificationBell.jsx: Interactive bell in the top navigation header with dynamic unread badge, 30s polling, and auto-refresh on window focus.
   - NotificationDropdown.jsx: Quick dropdown displaying latest notifications, instant mark-as-read, and deep links to decision details.
   - Notifications.jsx: Dedicated page (/notifications) with tabs for All / Unread, Mark All as Read button, pagination, and empty state handling.
   - Sidebar.jsx: Integrated navigation item with real-time unread badge.
