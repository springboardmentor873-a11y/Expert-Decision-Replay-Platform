from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.decision_version import DecisionVersionResponse, VersionComparisonResponse
from app.services.decision_version_service import (
    compare_versions,
    get_version,
    get_versions,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[DecisionVersionResponse],
    summary="List all historical versions of a decision",
)
def list_decision_versions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all historical version snapshots for a decision ordered by version_number DESC.
    Users can access versions only if they have permission to view the decision.
    """
    return get_versions(db=db, decision_id=decision_id, current_user=current_user)


@router.get(
    "/{version_a}/compare/{version_b}",
    response_model=VersionComparisonResponse,
    summary="Compare two versions of a decision",
)
def compare_decision_versions(
    decision_id: int,
    version_a: int,
    version_b: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compares two historical versions and returns the field-level differences.
    """
    return compare_versions(
        db=db,
        decision_id=decision_id,
        version_a_ref=version_a,
        version_b_ref=version_b,
        current_user=current_user,
    )


@router.get(
    "/{version_id}",
    response_model=DecisionVersionResponse,
    summary="Get details of a specific decision version",
)
def get_single_decision_version(
    decision_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves a read-only historical version snapshot by its version number (or version ID).
    """
    return get_version(
        db=db,
        decision_id=decision_id,
        version_ref=version_id,
        current_user=current_user,
    )
