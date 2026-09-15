"""
User Settings router — get and update per-user notification preferences.

Settings are stored as JSON in the user_settings table (persisted in DB).
"""
import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.user_settings import UserSettings

router = APIRouter(prefix="/users/me", tags=["User Settings"])

_DEFAULT_SETTINGS = {
    "notify_on_comment": True,
    "notify_on_approval": True,
    "notify_on_status_change": True,
    "digest_frequency": "immediate",
}


class UserSettingsPayload(BaseModel):
    notify_on_comment: Optional[bool] = None
    notify_on_approval: Optional[bool] = None
    notify_on_status_change: Optional[bool] = None
    digest_frequency: Optional[str] = None  # "immediate" | "daily" | "weekly"


def _get_or_create_settings(db: Session, user_id: int) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if not settings:
        settings = UserSettings(
            user_id=user_id,
            settings_json=json.dumps(_DEFAULT_SETTINGS),
        )
        db.add(settings)
        db.flush()
    return settings


# ------------------------------------------------------------------ #
# GET /users/me/settings                                               #
# ------------------------------------------------------------------ #
@router.get("/settings")
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = _get_or_create_settings(db, current_user.id)
    try:
        prefs = json.loads(row.settings_json)
    except json.JSONDecodeError:
        prefs = _DEFAULT_SETTINGS

    return {**_DEFAULT_SETTINGS, **prefs}


# ------------------------------------------------------------------ #
# PUT /users/me/settings                                               #
# ------------------------------------------------------------------ #
@router.put("/settings")
def update_my_settings(
    payload: UserSettingsPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = _get_or_create_settings(db, current_user.id)
    try:
        current = json.loads(row.settings_json)
    except json.JSONDecodeError:
        current = dict(_DEFAULT_SETTINGS)

    # Merge only non-None values from payload
    patch = payload.model_dump(exclude_none=True)
    current.update(patch)
    row.settings_json = json.dumps(current)

    db.commit()
    db.refresh(row)

    return {**_DEFAULT_SETTINGS, **json.loads(row.settings_json)}
