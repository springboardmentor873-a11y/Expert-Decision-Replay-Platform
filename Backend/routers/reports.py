import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import require_role
from models.decision import Decision, DecisionStatus, DecisionCategory
from models.approval_step import ApprovalStep, ApprovalStepStatus
from models.team import Team
from models.user import User

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


@router.get("/decisions/summary")
def decisions_summary(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("manager", "administrator")),
):
    by_status = dict(
        db.query(Decision.status, func.count(Decision.id)).group_by(Decision.status).all()
    )
    by_category = dict(
        db.query(Decision.category, func.count(Decision.id)).group_by(Decision.category).all()
    )
    total = db.query(func.count(Decision.id)).scalar()

    return {
        "total_decisions": total,
        "by_status": {status.value: by_status.get(status, 0) for status in DecisionStatus},
        "by_category": {cat.value: by_category.get(cat, 0) for cat in DecisionCategory},
    }


@router.get("/approvals/summary")
def approvals_summary(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("manager", "administrator")),
):
    by_status = dict(
        db.query(ApprovalStep.status, func.count(ApprovalStep.id))
        .group_by(ApprovalStep.status)
        .all()
    )
    total = db.query(func.count(ApprovalStep.id)).scalar()

    return {
        "total_approval_steps": total,
        "by_status": {status.value: by_status.get(status, 0) for status in ApprovalStepStatus},
    }


@router.get("/teams/summary")
def teams_summary(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("manager", "administrator")),
):
    teams = db.query(Team).all()
    result = []
    for team in teams:
        member_ids = [m.id for m in team.members]
        decision_count = (
            db.query(func.count(Decision.id))
            .filter(Decision.created_by_id.in_(member_ids or [-1]))
            .scalar()
        )
        result.append(
            {
                "team_id": team.id,
                "team_name": team.name,
                "member_count": len(member_ids),
                "decisions_created_by_members": decision_count,
            }
        )
    return result


@router.get("/decisions/export")
def export_decisions_csv(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("manager", "administrator")),
):
    """CSV export of every decision — opens directly in Excel/Sheets."""
    decisions = db.query(Decision).order_by(Decision.created_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["ID", "Title", "Category", "Status", "Version", "Created By", "Created At", "Updated At"]
    )
    for d in decisions:
        writer.writerow(
            [
                d.id,
                d.title,
                d.category.value,
                d.status.value,
                d.version,
                d.creator.email if d.creator else "",
                d.created_at.isoformat() if d.created_at else "",
                d.updated_at.isoformat() if d.updated_at else "",
            ]
        )
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=decisions_report.csv"},
    )


@router.get("/audit/export")
def export_audit_log_csv(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("administrator")),
):
    from models.audit_log import AuditLog

    entries = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Actor Email", "Action", "Entity Type", "Entity ID", "Details", "Created At"])
    for e in entries:
        writer.writerow(
            [
                e.id,
                e.actor_email or "",
                e.action,
                e.entity_type or "",
                e.entity_id or "",
                e.details or "",
                e.created_at.isoformat() if e.created_at else "",
            ]
        )
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log_report.csv"},
    )


@router.get("/decisions/{decision_id}/export/pdf")
def export_single_decision_pdf(
    decision_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_role("employee", "reviewer", "manager", "administrator")),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    story = []
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=12
    )
    story.append(Paragraph(f"Decision Document: {decision.title}", title_style))

    meta_data = [
        ["ID:", f"#{decision.id}", "Category:", decision.category.value if decision.category else "N/A"],
        ["Status:", decision.status.value if decision.status else "N/A", "Version:", f"v{decision.version}"],
        ["Created By:", decision.creator.email if decision.creator else "System", "Created Date:", decision.created_at.strftime("%Y-%m-%d %H:%M") if decision.created_at else "N/A"]
    ]
    t = Table(meta_data, colWidths=[80, 180, 90, 180])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#334155")),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t)
    story.append(Spacer(1, 16))

    h2_style = ParagraphStyle('SectionHeader', parent=styles['Heading2'], fontSize=12, leading=16, textColor=colors.HexColor("#1e293b"), spaceAfter=6)

    story.append(Paragraph("1. Problem Statement", h2_style))
    story.append(Paragraph(decision.problem_statement or "No problem statement recorded.", styles['Normal']))
    story.append(Spacer(1, 12))

    story.append(Paragraph("2. Decision Rationale", h2_style))
    story.append(Paragraph(decision.rationale or "No rationale recorded.", styles['Normal']))
    story.append(Spacer(1, 12))

    story.append(Paragraph("3. Alternatives Evaluated", h2_style))
    if decision.alternatives:
        alt_table_data = [["Option Title", "Cost ($)", "Risk", "Feasibility", "Recommended"]]
        for alt in decision.alternatives:
            alt_table_data.append([
                alt.title,
                f"${alt.estimated_cost:,.2f}" if alt.estimated_cost else "$0.00",
                f"{alt.risk_score}/10",
                f"{alt.feasibility_score}/10",
                "YES ★" if alt.is_recommended else "No"
            ])
        alt_table = Table(alt_table_data, colWidths=[180, 80, 80, 90, 100])
        alt_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(alt_table)
    else:
        story.append(Paragraph("No alternatives recorded.", styles['Normal']))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=decision_{decision_id}_report.pdf"},
    )


@router.get("/decisions/export/pdf")
def export_decisions_summary_pdf(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("manager", "administrator")),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    decisions = db.query(Decision).order_by(Decision.created_at.desc()).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    story = []
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=12
    )
    story.append(Paragraph("Executive Decisions Report", title_style))
    story.append(Spacer(1, 10))

    headers = ["ID", "Title", "Category", "Status", "Version", "Created At"]
    data = [headers]
    for d in decisions:
        data.append([
            f"#{d.id}",
            d.title,
            d.category.value if d.category else "N/A",
            d.status.value if d.status else "N/A",
            f"v{d.version}",
            d.created_at.strftime("%Y-%m-%d") if d.created_at else "N/A"
        ])

    table = Table(data, colWidths=[40, 220, 90, 80, 50, 70])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(table)

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=executive_decisions_report.pdf"},
    )

