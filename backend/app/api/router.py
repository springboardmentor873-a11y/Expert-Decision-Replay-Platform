from fastapi import APIRouter
from app.api.routes import (
    approval_workflows,
    approvals,
    audit_logs,
    auth,
    categories,
    dashboard,
    decisions,
    knowledge_repository,
    meeting_notes,
    notifications,
    reports,
    tags,
    teams,
    users,
)

api_router = APIRouter()

# Register Authentication endpoints under /auth
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Register User Management endpoints under /users
api_router.include_router(users.router, prefix="/users", tags=["User Management"])

# Register Decision Management endpoints under /decisions
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])

# Register Approval Workflow endpoints under /approvals
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approval Workflows"])

# Register Notifications endpoints under /notifications
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Register Audit Logs endpoints under /audit-logs
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])

# Register Reports endpoints under /reports
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics"])

# Register Dashboard endpoints under /dashboard
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# Register Teams endpoints under /teams
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])

# Register Categories endpoints under /categories
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])

# Register Tags endpoints under /tags
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])

# Register Meeting Notes endpoints
api_router.include_router(meeting_notes.router, prefix="", tags=["Meeting Notes"])

# Register Multi-Level Approval Workflows endpoints
api_router.include_router(approval_workflows.router, prefix="", tags=["Multi-Level Approval Workflows"])

# Register Knowledge Repository endpoints under /knowledge-repository
api_router.include_router(knowledge_repository.router, prefix="/knowledge-repository", tags=["Knowledge Repository"])


@api_router.get("/info", tags=["General"])
def get_api_info():
    """Returns basic API service information."""
    return {
        "service": "Expert Decision Replay Platform API",
        "version": "0.2.0",
        "milestone": "Milestone 2 - Decision Capture and Decision Management",
        "status": "ready"
    }