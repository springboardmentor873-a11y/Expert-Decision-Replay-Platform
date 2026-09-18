from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas, database, auth
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Total decisions
    total_decisions = db.query(models.Decision).count()
    
    # Decisions by status
    status_counts = db.query(
        models.Decision.status, 
        func.count(models.Decision.id)
    ).group_by(models.Decision.status).all()
    
    status_dict = {status.value: count for status, count in status_counts}
    
    # Ensure all statuses exist in the dict
    for s in models.DecisionStatusEnum:
        if s.value not in status_dict:
            status_dict[s.value] = 0

    # Recent activities (from audit logs)
    recent_logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(5).all()
    
    activities = []
    for log in recent_logs:
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        activities.append({
            "id": log.id,
            "userInitials": "".join([part[0].upper() for part in user.full_name.split()][:2]) if user and user.full_name else "SY",
            "userName": user.full_name if user else "System",
            "action": log.action,
            "target": log.description or (f"{log.entity_type} {log.entity_id}" if log.entity_type else ""),
            "time": log.created_at.strftime("%Y-%m-%d %H:%M")
        })

    # User activity statistics (e.g. decisions created in last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_decisions_count = db.query(models.Decision).filter(models.Decision.created_at >= seven_days_ago).count()

    return {
        "totalCount": total_decisions,
        "draftCount": status_dict.get(models.DecisionStatusEnum.DRAFT.value, 0),
        "underReviewCount": status_dict.get(models.DecisionStatusEnum.UNDER_REVIEW.value, 0),
        "approvedCount": status_dict.get(models.DecisionStatusEnum.APPROVED.value, 0),
        "rejectedCount": status_dict.get(models.DecisionStatusEnum.REJECTED.value, 0),
        "recentActivities": activities,
        "recentDecisionsCount": recent_decisions_count
    }

import csv
import io
from fastapi.responses import StreamingResponse

@router.get("/export-decisions")
def export_decisions_csv(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    decisions = db.query(models.Decision).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Category", "Status", "Creator ID", "Created At"])
    
    for d in decisions:
        writer.writerow([d.id, d.title, d.category, d.status.value, d.creator_id, d.created_at])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=decisions_report.csv"}
    )

@router.get("/export-audit-logs")
def export_audit_logs_csv(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = db.query(models.AuditLog).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Action", "Entity Type", "Entity ID", "Description", "User ID", "Created At"])
    
    for log in logs:
        writer.writerow([log.id, log.action, log.entity_type, log.entity_id, log.description, log.user_id, log.created_at])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs_report.csv"}
    )
