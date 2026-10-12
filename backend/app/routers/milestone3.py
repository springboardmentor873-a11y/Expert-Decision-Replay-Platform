from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth.dependencies import get_current_user, require_role
from app.models import milestone3_model as m

router = APIRouter(tags=["Milestone 3"])


class AssignReviewerIn(BaseModel):
    reviewer_id: int
    approval_level: int = Field(default=1, ge=1, le=10)


class ReviewIn(BaseModel):
    action: str
    comment: str | None = None


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: int
    created_at: str
    decision_id: int | None = None
    decision_title: str | None = None


def _dates(rows):
    for row in rows:
        for key in ("created_at", "assigned_at", "reviewed_at", "read_at", "changed_at"):
            if row.get(key) is not None:
                row[key] = str(row[key])
    return rows


@router.get("/approvals", tags=["Approval Workflow"])
def get_approvals(status: str | None = Query(None), current_user=Depends(get_current_user)):
    return _dates(m.list_approvals(current_user, status))


@router.get("/approvals/reviewers", tags=["Approval Workflow"])
def get_reviewers(current_user=Depends(require_role("Manager", "Administrator"))):
    return m.reviewer_users()


@router.post("/decisions/{decision_id}/submit", tags=["Approval Workflow"])
def submit_for_review(decision_id: int, current_user=Depends(get_current_user)):
    from app.models import decision_model
    decision = decision_model.get_decision(decision_id)
    if not decision:
        raise HTTPException(404, "Decision not found.")
    if decision["created_by"] != current_user["id"] and current_user["role"] not in ("Manager", "Administrator"):
        raise HTTPException(403, "You may only submit your own decisions for review.")
    from app.database import DatabaseCursor
    with DatabaseCursor(commit=True) as (c, _):
        c.execute("UPDATE decisions SET status='Under Review' WHERE id=%s", (decision_id,))
    for a in m.pending_reviewers_for_decision(decision_id):
        m.create_notification(a["reviewer_id"], "Decision submitted for review", f"{decision['title']} is ready for your review.", "approval", decision_id)
    m.log_audit(current_user["id"], "Decision Submitted", "Approval", f"Submitted '{decision['title']}' for review.", "decision", decision_id)
    return {"message": "Decision submitted for review."}


@router.post("/decisions/{decision_id}/assign-reviewer", tags=["Approval Workflow"])
def assign_reviewer(decision_id: int, payload: AssignReviewerIn, current_user=Depends(require_role("Manager", "Administrator"))):
    from app.models import decision_model
    decision = decision_model.get_decision(decision_id)
    if not decision:
        raise HTTPException(404, "Decision not found.")
    reviewers = {r["id"]: r for r in m.reviewer_users()}
    if payload.reviewer_id not in reviewers:
        raise HTTPException(400, "Selected user cannot be assigned as a reviewer.")
    approval_id = m.assign_reviewer(decision_id, payload.reviewer_id, current_user["id"], payload.approval_level)
    reviewer = reviewers[payload.reviewer_id]
    m.create_notification(reviewer["id"], "New review assigned", f"You were assigned to review '{decision['title']}'.", "approval", decision_id)
    m.log_audit(current_user["id"], "Reviewer Assigned", "Approval", f"Assigned {reviewer['full_name']} to '{decision['title']}'.", "decision", decision_id)
    return {"id": approval_id, "message": "Reviewer assigned successfully."}


@router.post("/approvals/{approval_id}/review", tags=["Approval Workflow"])
def review(approval_id: int, payload: ReviewIn, current_user=Depends(require_role("Reviewer", "Manager", "Administrator"))):
    action = payload.action.lower()
    if action not in ("approve", "reject"):
        raise HTTPException(400, "Action must be approve or reject.")
    approval = m.get_approval(approval_id)
    if not approval:
        raise HTTPException(404, "Approval not found.")
    if current_user["role"] == "Reviewer" and approval["reviewer_id"] != current_user["id"]:
        raise HTTPException(403, "This approval is not assigned to you.")
    reviewer_id = approval["reviewer_id"] if current_user["role"] != "Reviewer" else current_user["id"]
    result = m.review_approval(approval_id, reviewer_id, action, payload.comment)
    if result is False:
        raise HTTPException(403, "You cannot review this approval or it is already completed.")
    new_status = "Approved" if action == "approve" else "Rejected"
    m.create_notification(approval["creator_id"] if "creator_id" in approval else approval.get("created_by"),
                          f"Decision {new_status.lower()}",
                          f"'{approval['decision_title']}' was {new_status.lower()} by {current_user['full_name']}.",
                          "approval", approval["decision_id"])
    m.log_audit(current_user["id"], f"Decision {new_status}", "Approval", f"{new_status} '{approval['decision_title']}'.", "decision", approval["decision_id"])
    return {"message": f"Decision {new_status.lower()} successfully.", "approval": result}


@router.get("/decisions/{decision_id}/approvals", tags=["Approval Workflow"])
def decision_approvals(decision_id: int, current_user=Depends(get_current_user)):
    rows = m.list_decision_approvals(decision_id)
    if current_user["role"] == "Reviewer" and not any(r["reviewer_id"] == current_user["id"] for r in rows):
        raise HTTPException(403, "You are not assigned to this decision.")
    if current_user["role"] == "Employee" and not any(r["creator_id"] == current_user["id"] for r in rows):
        raise HTTPException(403, "You cannot view this decision's approvals.")
    return _dates(rows)


@router.get("/decisions/{decision_id}/approval-history", tags=["Approval Workflow"])
def decision_approval_history(decision_id: int, current_user=Depends(get_current_user)):
    return _dates(m.approval_history(decision_id))


@router.get("/notifications", response_model=list[NotificationOut], tags=["Notifications"])
def notifications(unread_only: bool = False, current_user=Depends(get_current_user)):
    return _dates(m.list_notifications(current_user["id"], unread_only))


@router.patch("/notifications/{notification_id}/read", tags=["Notifications"])
def read_notification(notification_id: int, current_user=Depends(get_current_user)):
    if not m.mark_notification_read(notification_id, current_user["id"]):
        raise HTTPException(404, "Notification not found.")
    return {"message": "Notification marked as read."}


@router.post("/notifications/read-all", tags=["Notifications"])
def read_all_notifications(current_user=Depends(get_current_user)):
    return {"updated": m.mark_all_notifications_read(current_user["id"])}


@router.get("/audit-logs", tags=["Audit & Compliance"])
def get_audit_logs(action: str | None = None, current_user=Depends(get_current_user)):
    if current_user["role"] not in ("Administrator", "Manager"):
        raise HTTPException(403, "Only Managers and Administrators can view audit logs.")
    return _dates(m.audit_logs(current_user, action))


@router.get("/dashboard/summary", tags=["Dashboard"])
def dashboard_summary(current_user=Depends(get_current_user)):
    return _dates([m.dashboard_summary(current_user)])[0]


def _report_rows(kind, status_filter=None, category=None):
    if kind == "decisions":
        return m.report_decisions(status_filter, category)
    if kind == "approvals":
        return m.report_approvals()
    if kind == "teams":
        return m.report_teams()
    if kind == "audit":
        return m.audit_logs({"id": 0, "role": "Administrator"})
    raise HTTPException(404, "Unknown report type.")


@router.get("/reports/{kind}", tags=["Reports"])
def report(kind: str, status: str | None = None, category: str | None = None, current_user=Depends(get_current_user)):
    if kind not in ("decisions", "approvals", "teams", "audit"):
        raise HTTPException(404, "Unknown report type.")
    if kind == "audit" and current_user["role"] not in ("Administrator", "Manager"):
        raise HTTPException(403, "Only Managers and Administrators can view audit reports.")
    rows = _report_rows(kind, status, category)
    return _dates(rows)


@router.get("/reports/{kind}/export", tags=["Reports"])
def export_report(kind: str, format: str = Query("pdf"), status: str | None = None, category: str | None = None, current_user=Depends(get_current_user)):
    if kind not in ("decisions", "approvals", "teams", "audit"):
        raise HTTPException(404, "Unknown report type.")
    if kind == "audit" and current_user["role"] not in ("Administrator", "Manager"):
        raise HTTPException(403, "Only Managers and Administrators can export audit reports.")
    rows = _report_rows(kind, status, category)
    format = format.lower()
    headers = {
        "decisions": ["ID", "Title", "Category", "Status", "Creator", "Team", "Created", "Updated"],
        "approvals": ["ID", "Decision", "Reviewer", "Level", "Status", "Comment", "Assigned", "Reviewed"],
        "teams": ["Team", "Manager", "Members", "Decisions"],
        "audit": ["ID", "User", "Action", "Module", "Description", "Entity", "Entity ID", "Created"],
    }
    key_map = {
        "decisions": ["id", "title", "category", "status", "creator_name", "team_name", "created_at", "updated_at"],
        "approvals": ["id", "decision_title", "reviewer_name", "approval_level", "status", "review_comment", "assigned_at", "reviewed_at"],
        "teams": ["team_name", "manager_name", "member_count", "decision_count"],
        "audit": ["id", "user_name", "action", "module", "description", "entity_type", "entity_id", "created_at"],
    }
    if format == "excel":
        from openpyxl import Workbook
        wb = Workbook(); ws = wb.active; ws.title = kind.title()
        ws.append(headers[kind])
        for row in rows:
            ws.append([str(row.get(k) or "") for k in key_map[kind]])
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            ws.column_dimensions[col[0].column_letter].width = min(max(max_len + 2, 12), 45)
        buf = BytesIO(); wb.save(buf); buf.seek(0)
        return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 headers={"Content-Disposition": f"attachment; filename={kind}_report.xlsx"})
    if format == "pdf":
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        buf = BytesIO(); doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
        styles = getSampleStyleSheet(); story = [Paragraph(f"Expert Decision Replay Platform — {kind.title()} Report", styles["Title"]), Spacer(1, 12)]
        data = [headers[kind]] + [[str(row.get(k) or "")[:80] for k in key_map[kind]] for row in rows]
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1f4f91")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("GRID", (0,0), (-1,-1), 0.35, colors.HexColor("#d7dde7")),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 7),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ]))
        story.append(table); doc.build(story); buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf",
                                 headers={"Content-Disposition": f"attachment; filename={kind}_report.pdf"})
    raise HTTPException(400, "Format must be pdf or excel.")
