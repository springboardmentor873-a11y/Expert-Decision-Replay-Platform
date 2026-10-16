from typing import Optional

from sqlalchemy.orm import Session

from models.notification import Notification


def notify(
    db: Session,
    *,
    user_id: int,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> Notification:
    note = Notification(
        user_id=user_id,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
