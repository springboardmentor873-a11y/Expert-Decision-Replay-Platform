from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Team

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


@router.get("/")
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()