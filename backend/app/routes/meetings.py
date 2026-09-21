from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session

from datetime import datetime

from typing import Optional

from app.database import get_db
from app.models import Meeting
from app.models import Team
from app.models import User
from app.models import Decision
from app.auth import get_current_user
from app.schemas import MeetingCreate

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

MANAGER_ROLES = (3, 4)


# ==========================================
# HELPER: MEETING DICT
# ==========================================

def meeting_dict(meeting: Meeting):

    scheduled = meeting.scheduled_at

    return {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "team_id": meeting.team_id,
        "team_name": (
            meeting.team.team_name
            if meeting.team
            else None
        ),
        "organizer_id": meeting.organizer_id,
        "organizer_name": (
            meeting.organizer.name
            if meeting.organizer
            else None
        ),
        "decision_id": meeting.decision_id,
        "decision_title": (
            meeting.decision.title
            if meeting.decision
            else None
        ),
        "scheduled_at": scheduled,
        "date": (
            scheduled.date().isoformat()
            if scheduled
            else None
        ),
        "time": (
            scheduled.strftime("%H:%M")
            if scheduled
            else None
        ),
        "duration_minutes": meeting.duration_minutes,
        "location": meeting.location,
        "agenda": meeting.agenda,
        "status": meeting.status,
        "created_at": meeting.created_at
    }


# ==========================================
# HELPER: ROLE SCOPING
# ==========================================

def scoped_meetings(
    db: Session,
    current_user
):

    query = db.query(Meeting)

    if current_user.role_id != 4:

        if current_user.team_id:
            query = query.filter(
                Meeting.team_id == current_user.team_id
            )
        else:
            query = query.filter(
                Meeting.organizer_id == current_user.user_id
            )

    return query


# ==========================================
# GET UPCOMING MEETINGS
# ==========================================

@router.get("/upcoming")
def upcoming_meetings(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    now = datetime.utcnow()

    query = (
        scoped_meetings(db, current_user)
        .filter(Meeting.status != "Cancelled")
        .filter(Meeting.scheduled_at >= now)
        .order_by(Meeting.scheduled_at.asc())
        .limit(limit)
    )

    return [meeting_dict(m) for m in query.all()]


# ==========================================
# GET ALL MEETINGS
# ==========================================

@router.get("/")
def list_meetings(
    include_past: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = scoped_meetings(db, current_user)

    if not include_past:
        query = query.filter(
            Meeting.scheduled_at >= datetime.utcnow()
        )

    query = query.order_by(Meeting.scheduled_at.asc())

    return [meeting_dict(m) for m in query.all()]


# ==========================================
# CREATE MEETING
# ==========================================

@router.post("/")
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role_id not in MANAGER_ROLES:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only a Manager or an Administrator "
                "can schedule a meeting"
            )
        )

    meeting = Meeting(
        title=payload.title,
        team_id=payload.team_id,
        organizer_id=(
            payload.organizer_id
            if payload.organizer_id
            else current_user.user_id
        ),
        decision_id=payload.decision_id,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        location=payload.location,
        agenda=payload.agenda,
        status=payload.status or "Scheduled"
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return meeting_dict(meeting)
