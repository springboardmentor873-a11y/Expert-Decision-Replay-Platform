from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


@router.get("/")
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()