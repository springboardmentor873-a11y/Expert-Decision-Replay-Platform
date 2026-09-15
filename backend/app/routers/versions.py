from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Decision, DecisionVersion, User
from app.schemas.version import VersionResponse
from app.schemas.replay import ReplayResponse
from app.security.jwt import get_current_user


router = APIRouter(
    prefix="/decisions",
    tags=["Versions"]
)


@router.get(
    "/{decision_id}/versions",
    response_model=list[VersionResponse]
)
def get_decision_versions(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    versions = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision_id
        )
        .order_by(
            DecisionVersion.version_number.asc()
        )
        .all()
    )

    return versions

@router.get(
    "/{decision_id}/replay",
    response_model=list[ReplayResponse]
)
def replay_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = (
        db.query(Decision)
        .filter(Decision.id == decision_id)
        .first()
    )

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

    versions = (
        db.query(DecisionVersion)
        .filter(
            DecisionVersion.decision_id == decision_id
        )
        .order_by(
            DecisionVersion.version_number.asc()
        )
        .all()
    )

    if not versions:
        raise HTTPException(
            status_code=404,
            detail="No versions found for this decision"
        )

    replay = []

    previous_version = None

    for version in versions:

        changes = []

        if previous_version is None:
            changes.append("Initial version")

        else:
            if version.title != previous_version.title:
                changes.append("Title changed")

            if version.description != previous_version.description:
                changes.append("Description changed")

            if version.status != previous_version.status:
                changes.append(
                    f"Status changed from "
                    f"'{previous_version.status}' to "
                    f"'{version.status}'"
                )

            if version.priority != previous_version.priority:
                changes.append(
                    f"Priority changed from "
                    f"'{previous_version.priority}' to "
                    f"'{version.priority}'"
                )

        replay.append(
            ReplayResponse(
                version_number=version.version_number,
                title=version.title,
                description=version.description,
                status=version.status,
                priority=version.priority,
                changed_by=version.changed_by,
                created_at=version.created_at,
                changes=changes
            )
        )

        previous_version = version

    return replay