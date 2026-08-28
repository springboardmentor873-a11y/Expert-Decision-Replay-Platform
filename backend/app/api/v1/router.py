from fastapi import APIRouter

from app.api.v1.endpoints.alternatives import router as alternatives_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.approvals import router as approvals_router
from app.api.v1.endpoints.attachments import router as attachments_router
from app.api.v1.endpoints.audit import router as audit_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.decisions import router as decisions_router
from app.api.v1.endpoints.discussions import router as discussions_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.repository import router as repository_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(decisions_router)
api_router.include_router(alternatives_router)
api_router.include_router(discussions_router)
api_router.include_router(approvals_router)
api_router.include_router(attachments_router)
api_router.include_router(notifications_router)
api_router.include_router(repository_router)
api_router.include_router(audit_router)
api_router.include_router(reports_router)
api_router.include_router(dashboard_router)
api_router.include_router(analytics_router)
