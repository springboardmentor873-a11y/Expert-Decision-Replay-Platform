from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.report import (
    ActivityReport,
    AlternativeReport,
    ApprovalReport,
    DecisionSummaryReport,
    DecisionTimelineReport,
    OutcomeReport,
)
from app.services import report_service

router = APIRouter()


@router.get("/decisions/summary", response_model=DecisionSummaryReport)
def get_decision_summary_report(
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    created_by: Optional[int] = Query(None, description="Creator user ID filter"),
    decision_id: Optional[int] = Query(None, description="Specific decision ID filter"),
    title: Optional[str] = Query(None, description="Title search term"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get aggregated Decision Summary Report:
    Total count, draft, submitted, under review, approved, rejected, percentages, and trend over time.
    """
    return report_service.get_decision_summary_report(
        db=db,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        status_filter=status,
        created_by=created_by,
        decision_id=decision_id,
        title_search=title,
    )


@router.get("/approvals", response_model=ApprovalReport)
def get_approval_report(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    action: Optional[str] = Query(None, description="Action filter (APPROVED, REJECTED)"),
    reviewer_id: Optional[int] = Query(None, description="Reviewer user ID filter"),
    decision_id: Optional[int] = Query(None, description="Decision ID filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Approval Report:
    Approval & rejection counts, rates, pending approvals, and paginated review audit records.
    """
    return report_service.get_approval_report(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        action_filter=action,
        reviewer_id=reviewer_id,
        decision_id=decision_id,
    )


@router.get("/outcomes", response_model=OutcomeReport)
def get_outcome_report(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    outcome_status: Optional[str] = Query(None, description="Outcome status: recorded | not_recorded"),
    status: Optional[str] = Query(None, description="Decision status filter"),
    created_by: Optional[int] = Query(None, description="Creator user ID filter"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Decision Outcome Report:
    Comparison of expected vs actual outcomes, recorded rate, and decision list.
    """
    return report_service.get_outcome_report(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        outcome_status=outcome_status,
        status_filter=status,
        created_by=created_by,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/alternatives", response_model=AlternativeReport)
def get_alternative_report(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    decision_id: Optional[int] = Query(None, description="Decision ID filter"),
    is_selected: Optional[bool] = Query(None, description="Filter selected alternative"),
    feasibility: Optional[str] = Query(None, description="Feasibility filter (High, Medium, Low)"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Alternative Report:
    Alternative analysis breakdown, selected vs unselected, feasibility distribution, and records.
    """
    return report_service.get_alternative_report(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        decision_id=decision_id,
        is_selected=is_selected,
        feasibility=feasibility,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/activity", response_model=ActivityReport)
def get_activity_report(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    action: Optional[str] = Query(None, description="Action filter"),
    user_id: Optional[int] = Query(None, description="User ID filter"),
    decision_id: Optional[int] = Query(None, description="Decision ID filter"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Decision Activity Report:
    Chronological activity stream filtered by RBAC and decision context.
    """
    return report_service.get_activity_report(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        action=action,
        user_id=user_id,
        decision_id=decision_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/decisions/{decision_id}/timeline", response_model=DecisionTimelineReport)
def get_decision_timeline(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Decision Timeline Report:
    Chronological full lifecycle reconstruction for a single decision.
    """
    return report_service.get_decision_timeline(
        db=db,
        decision_id=decision_id,
        current_user=current_user,
    )


@router.get("/export/csv")
def export_report_csv(
    report_type: str = Query(..., description="Report type: summary | approvals | outcomes | alternatives | activity | timeline"),
    decision_id: Optional[int] = Query(None, description="Decision ID (required for timeline)"),
    status: Optional[str] = Query(None, description="Status filter"),
    action: Optional[str] = Query(None, description="Action filter"),
    outcome_status: Optional[str] = Query(None, description="Outcome status filter"),
    feasibility: Optional[str] = Query(None, description="Feasibility filter"),
    is_selected: Optional[bool] = Query(None, description="Is selected filter"),
    created_by: Optional[int] = Query(None, description="Creator user ID"),
    user_id: Optional[int] = Query(None, description="User ID filter"),
    reviewer_id: Optional[int] = Query(None, description="Reviewer ID filter"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Backwards-compatible CSV export endpoint."""
    return export_report_data(
        report_type=report_type,
        format="csv",
        decision_id=decision_id,
        status=status,
        action=action,
        outcome_status=outcome_status,
        feasibility=feasibility,
        is_selected=is_selected,
        created_by=created_by,
        user_id=user_id,
        reviewer_id=reviewer_id,
        start_date=start_date,
        end_date=end_date,
        db=db,
        current_user=current_user,
    )


@router.get("/teams/{team_id}")
def get_team_report_data(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated report for a specific team."""
    return report_service.get_team_report(db=db, team_id=team_id, current_user=current_user)


@router.get("/audit")
def get_audit_report_data(
    action: Optional[str] = Query(None, description="Action filter"),
    user_id: Optional[int] = Query(None, description="User ID filter"),
    entity_type: Optional[str] = Query(None, description="Entity type filter"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated Audit Report with activity distribution."""
    return report_service.get_audit_report(
        db=db,
        current_user=current_user,
        action=action,
        user_id=user_id,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.get("/export", summary="Export reports as CSV, Excel (.xlsx), or PDF (.pdf)")
def export_report_data(
    report_type: str = Query(..., description="Report type: summary, approvals, outcomes, alternatives, activity, timeline, team, audit"),
    format: str = Query("csv", description="Format: csv, excel, or pdf"),
    team_id: Optional[int] = Query(None, description="Team ID for team report"),
    status: Optional[str] = Query(None, description="Status filter"),
    action: Optional[str] = Query(None, description="Action filter"),
    outcome_status: Optional[str] = Query(None, description="Outcome status filter"),
    decision_id: Optional[int] = Query(None, description="Decision ID filter"),
    feasibility: Optional[str] = Query(None, description="Feasibility filter"),
    is_selected: Optional[bool] = Query(None, description="Is selected filter"),
    created_by: Optional[int] = Query(None, description="Creator user ID"),
    user_id: Optional[int] = Query(None, description="User ID filter"),
    reviewer_id: Optional[int] = Query(None, description="Reviewer ID filter"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp filter"),
    end_date: Optional[datetime] = Query(None, description="End timestamp filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export filtered report data directly as downloadable CSV, Excel (.xlsx), or PDF (.pdf) file.
    """
    clean_type = report_type.lower().strip()
    clean_format = format.lower().strip()

    if clean_type == "summary":
        data = report_service.get_decision_summary_report(
            db=db,
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            status_filter=status,
            created_by=created_by,
            decision_id=decision_id,
        )
    elif clean_type == "approvals":
        data = report_service.get_approval_report(
            db=db,
            current_user=current_user,
            page=1,
            page_size=1000,
            start_date=start_date,
            end_date=end_date,
            action_filter=action,
            reviewer_id=reviewer_id,
            decision_id=decision_id,
        )
    elif clean_type == "outcomes":
        data = report_service.get_outcome_report(
            db=db,
            current_user=current_user,
            page=1,
            page_size=1000,
            outcome_status=outcome_status,
            status_filter=status,
            created_by=created_by,
            start_date=start_date,
            end_date=end_date,
        )
    elif clean_type == "alternatives":
        data = report_service.get_alternative_report(
            db=db,
            current_user=current_user,
            page=1,
            page_size=1000,
            decision_id=decision_id,
            is_selected=is_selected,
            feasibility=feasibility,
            start_date=start_date,
            end_date=end_date,
        )
    elif clean_type == "activity":
        data = report_service.get_activity_report(
            db=db,
            current_user=current_user,
            page=1,
            page_size=1000,
            action=action,
            user_id=user_id,
            decision_id=decision_id,
            start_date=start_date,
            end_date=end_date,
        )
    elif clean_type == "timeline":
        if not decision_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="decision_id parameter is required for timeline report export."
            )
        data = report_service.get_decision_timeline(
            db=db,
            decision_id=decision_id,
            current_user=current_user,
        )
    elif clean_type == "team":
        if not team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="team_id parameter is required for team report export."
            )
        data = report_service.get_team_report(
            db=db,
            team_id=team_id,
            current_user=current_user,
        )
    elif clean_type == "audit":
        data = report_service.get_audit_report(
            db=db,
            current_user=current_user,
            action=action,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            page=1,
            page_size=1000,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report_type '{report_type}'. Must be one of: summary, approvals, outcomes, alternatives, activity, timeline, team, audit."
        )

    timestamp_str = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

    if clean_format in ("excel", "xlsx"):
        file_bytes = report_service.export_report_to_excel(report_type=clean_type, data=data)
        filename = f"{clean_type}_report_{timestamp_str}.xlsx"
        return Response(
            content=file_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    elif clean_format == "pdf":
        file_bytes = report_service.export_report_to_pdf(report_type=clean_type, data=data)
        filename = f"{clean_type}_report_{timestamp_str}.pdf"
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    else:
        # Default CSV
        csv_data = report_service.export_report_to_csv(report_type=clean_type, data=data)
        filename = f"{clean_type}_report_{timestamp_str}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

