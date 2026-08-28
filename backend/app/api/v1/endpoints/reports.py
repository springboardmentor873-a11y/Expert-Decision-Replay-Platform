from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.models.decision import Decision
from app.models.identity import User
from app.services.report_service import (
    generate_decision_excel,
    generate_decision_pdf,
    generate_summary_excel,
)

router = APIRouter(prefix="/reports", tags=["reports & exports"])


@router.get("/decision/{decision_id}/pdf")
def download_decision_pdf_report(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download complete PDF case file report for a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    pdf_buffer = generate_decision_pdf(db, decision_id)
    filename = f"Decision_{str(decision_id)[:8]}_CaseFile.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/decision/{decision_id}/excel")
def download_decision_excel_report(
    decision_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download full structured Excel workbook for a decision."""
    decision = db.scalar(select(Decision).where(Decision.id == decision_id, Decision.deleted_at.is_(None)))
    if not decision:
        raise NotFoundError(message="Decision not found.")

    excel_buffer = generate_decision_excel(db, decision_id)
    filename = f"Decision_{str(decision_id)[:8]}_Analysis.xlsx"

    return Response(
        content=excel_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/summary/excel")
def download_decisions_summary_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download enterprise decisions summary report in Excel."""
    excel_buffer = generate_summary_excel(db)
    filename = "Decisions_Executive_Summary.xlsx"

    return Response(
        content=excel_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )
