from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.user import (
    PasswordChange,
    UserCreate,
    UserResponse,
    UserRoleUpdate,
    UserUpdate,
)
from app.services.audit_service import log_audit

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def _assert_unique_user(db: Session, email: str, employee_id: str):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists"
        )
    if db.query(User).filter(User.employee_id == employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this employee ID already exists"
        )


# CREATE USER (Administrator only - use /auth/register for self sign-up)
@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator"))
):
    _assert_unique_user(db, user.email, user.employee_id)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        role=user.role.value,
        password=hash_password(user.password),
        employee_id=user.employee_id,
        department=user.department,
        designation=user.designation,
        phone_number=user.phone_number,
    )

    db.add(new_user)
    db.flush()

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.USER,
        entity_id=new_user.id,
        description=f"Administrator {current_user.id} created user {new_user.email}",
        request_method="POST",
        endpoint="/users"
    )

    db.commit()
    db.refresh(new_user)

    return new_user


# GET ALL USERS (Administrator sees all, Manager sees own department)
@router.get(
    "",
    response_model=List[UserResponse]
)
def get_users(
    department: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User)

    if current_user.role == "Manager":
        query = query.filter(User.department == current_user.department)
    elif current_user.role not in ["Administrator"]:
        # Employees/Reviewers may only see themselves through this listing
        query = query.filter(User.id == current_user.id)

    if department:
        query = query.filter(User.department == department)

    if role:
        query = query.filter(User.role == role)

    return query.order_by(User.full_name.asc()).all()


# GET CURRENT USER PROFILE
@router.get(
    "/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# GET USER BY ID
@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "Administrator":
        return user
    if current_user.role == "Manager" and user.department == current_user.department:
        return user
    if current_user.id == user.id:
        return user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to view this user"
    )


# UPDATE USER (self or Administrator)
@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != "Administrator" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )

    if user_data.is_active is not None and current_user.role != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an Administrator can activate/deactivate a user"
        )

    if user_data.email is not None and user_data.email != user.email:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.department is not None:
        user.department = user_data.department
    if user_data.designation is not None:
        user.designation = user_data.designation
    if user_data.phone_number is not None:
        user.phone_number = user_data.phone_number
    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.USER,
        entity_id=user.id,
        description=f"User {user.id} profile updated by {current_user.id}",
        request_method="PUT",
        endpoint=f"/users/{user_id}"
    )

    db.commit()
    db.refresh(user)

    return user


# CHANGE ROLE (Administrator only)
@router.patch(
    "/{user_id}/role",
    response_model=UserResponse
)
def change_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = role_data.role.value

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.USER,
        entity_id=user.id,
        description=f"User {user.id} role changed from {old_role} to {user.role}",
        old_value={"role": old_role},
        new_value={"role": user.role},
        request_method="PATCH",
        endpoint=f"/users/{user_id}/role"
    )

    db.commit()
    db.refresh(user)

    return user


# CHANGE OWN PASSWORD
@router.post(
    "/me/change-password"
)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password = hash_password(payload.new_password)

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.USER,
        entity_id=current_user.id,
        description=f"User {current_user.id} changed their password",
        request_method="POST",
        endpoint="/users/me/change-password"
    )

    db.commit()

    return {"message": "Password updated successfully"}


# DEACTIVATE USER (Administrator only) - soft delete, preserves audit/history integrity
@router.delete(
    "/{user_id}"
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    user.is_active = False

    log_audit(
        db=db,
        user_id=current_user.id,
        action=AuditAction.DELETE,
        entity_type=AuditEntityType.USER,
        entity_id=user.id,
        description=f"User {user.id} deactivated by Administrator {current_user.id}",
        request_method="DELETE",
        endpoint=f"/users/{user_id}"
    )

    db.commit()

    return {"message": "User deactivated successfully"}
