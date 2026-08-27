from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import User, AuditLog, RoleEnum
from app.schemas import UserOut, UserUpdate, RoleUpdate
from app.utils import get_client_ip

router = APIRouter(prefix="/api/users", tags=["User Management"])


@router.get("/me", response_model=UserOut, summary="Get the current user's own profile")
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut, summary="Update safe fields on the current user's own profile")
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "",
    response_model=List[UserOut],
    summary="List all users (Manager / Administrator only)",
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.MANAGER, RoleEnum.ADMINISTRATOR)),
    role: Optional[RoleEnum] = Query(default=None, description="Filter by role"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    search: Optional[str] = Query(default=None, description="Search by name or email"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(like)) | (User.email.ilike(like)))
    return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()


@router.get(
    "/{user_id}",
    response_model=UserOut,
    summary="Get a single user by id (Manager / Administrator only)",
)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.MANAGER, RoleEnum.ADMINISTRATOR)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserOut,
    summary="Change a user's role (Administrator only)",
)
def change_user_role(
    user_id: str,
    payload: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = payload.role
    db.add(AuditLog(
        actor_id=current_user.id,
        action="role_changed",
        details=f"{user.email} role changed from {old_role.value} to {payload.role.value} by {current_user.email}",
        ip_address=get_client_ip(request),
    ))
    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserOut,
    summary="Deactivate a user account (Administrator only)",
)
def deactivate_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    db.add(AuditLog(
        actor_id=current_user.id,
        action="user_deactivated",
        details=f"{user.email} deactivated by {current_user.email}",
        ip_address=get_client_ip(request),
    ))
    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/activate",
    response_model=UserOut,
    summary="Reactivate a previously deactivated user (Administrator only)",
)
def activate_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.ADMINISTRATOR)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = True
    db.add(AuditLog(
        actor_id=current_user.id,
        action="user_activated",
        details=f"{user.email} reactivated by {current_user.email}",
        ip_address=get_client_ip(request),
    ))
    db.commit()
    db.refresh(user)
    return user
