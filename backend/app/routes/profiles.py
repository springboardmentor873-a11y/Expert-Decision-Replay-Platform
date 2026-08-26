from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/profiles",
    tags=["User Profiles"]
)


@router.get("/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    profile = db.execute(
        text("""
            SELECT
                profile_id,
                user_id,
                phone,
                department,
                designation,
                profile_image
            FROM user_profiles
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    ).fetchone()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="User profile not found"
        )

    return {
        "profile_id": profile.profile_id,
        "user_id": profile.user_id,
        "phone": profile.phone,
        "department": profile.department,
        "designation": profile.designation,
        "profile_image": profile.profile_image
    }