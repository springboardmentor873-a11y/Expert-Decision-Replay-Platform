from typing import List, Optional, Union
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.audit_log import AuditActionEnum
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserRegisterRequest, UserRosterItem
from app.services.audit_service import create_audit_log


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieves a user by email (case-insensitive)."""
    return db.query(User).filter(User.email == email.strip().lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Retrieves a single user by primary key ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieves all registered users ordered by creation date."""
    return db.query(User).order_by(User.id.asc()).offset(skip).limit(limit).all()


def get_role_by_name(db: Session, role_name: str) -> Optional[Role]:
    """Retrieves a role entity by its name."""
    return db.query(Role).filter(Role.name == role_name).first()


def seed_roles_if_needed(db: Session) -> None:
    """Ensures default roles exist in the database."""
    default_roles = [
        (RoleEnum.EMPLOYEE.value, "Standard employee submitting decisions for evaluation and review"),
        (RoleEnum.REVIEWER.value, "Subject matter expert analyzing and evaluating decision alternatives"),
        (RoleEnum.MANAGER.value, "Manager reviewing, validating, and approving final decisions"),
        (RoleEnum.ADMINISTRATOR.value, "System administrator managing users, roles, and platform governance"),
    ]
    for role_name, description in default_roles:
        existing_role = db.query(Role).filter(Role.name == role_name).first()
        if not existing_role:
            new_role = Role(name=role_name, description=description)
            db.add(new_role)
    db.commit()


def create_user(db: Session, user_in: UserRegisterRequest) -> User:
    """Business logic to validate and register a new user."""
    normalized_email = user_in.email.strip().lower()

    # 1. Check for duplicate email
    if get_user_by_email(db, normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{user_in.email}' already exists."
        )

    # 2. Resolve Role
    role_name = user_in.role.value if isinstance(user_in.role, RoleEnum) else str(user_in.role)
    role = get_role_by_name(db, role_name)
    if not role:
        seed_roles_if_needed(db)
        role = get_role_by_name(db, role_name)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_name}' is not recognized or does not exist."
            )

    # 3. Hash password securely
    hashed_pw = hash_password(user_in.password)

    # 4. Create and persist User record
    db_user = User(
        full_name=user_in.full_name,
        email=normalized_email,
        hashed_password=hashed_pw,
        role_id=role.id,
        is_active=True,
    )
    db.add(db_user)
    db.flush()

    # Audit logging for user registration
    from app.models.audit_log import AuditActionEnum
    from app.services.audit_service import create_audit_log
    create_audit_log(
        db=db,
        action=AuditActionEnum.USER_REGISTERED,
        entity_type="User",
        entity_id=db_user.id,
        user_id=db_user.id,
        description=f"User registered: {db_user.full_name} ({db_user.email}) with role '{role_name}'",
        details={
            "user_id": db_user.id,
            "email": db_user.email,
            "role": role_name,
        },
        skip_commit=True,
    )

    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, login_in: LoginRequest) -> User:
    """Authenticates a user by email and password. Raises 401 on failure."""
    normalized_email = login_in.email.strip().lower()
    user = get_user_by_email(db, normalized_email)

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def update_user_status(db: Session, user_id: int, is_active: bool) -> User:
    """Updates user active status (activate/deactivate)."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user_id: int, new_role: Union[RoleEnum, str]) -> User:
    """Updates a user's assigned system role."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    role_name = new_role.value if isinstance(new_role, RoleEnum) else str(new_role)
    role = get_role_by_name(db, role_name)
    if not role:
        seed_roles_if_needed(db)
        role = get_role_by_name(db, role_name)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{role_name}' does not exist."
            )

    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(
    db: Session,
    user_id: int,
    full_name: Optional[str] = None,
    request: Optional[Request] = None
) -> User:
    """Updates the user's permitted profile fields (e.g. full_name) and records an audit log."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    old_name = user.full_name
    if full_name is not None and full_name.strip():
        user.full_name = full_name.strip()

    create_audit_log(
        db=db,
        action=AuditActionEnum.USER_PROFILE_UPDATED,
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
        description=f"User {user.email} updated their profile name from '{old_name}' to '{user.full_name}'",
        details={"user_id": user.id, "old_name": old_name, "new_name": user.full_name},
        request=request,
        skip_commit=True,
    )

    db.commit()
    db.refresh(user)
    return user


def change_user_password(
    db: Session,
    user_id: int,
    current_password: str,
    new_password: str,
    request: Optional[Request] = None
) -> None:
    """Verifies existing password, hashes new password securely, and updates account."""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(new_password.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long."
        )

    user.hashed_password = hash_password(new_password.strip())

    create_audit_log(
        db=db,
        action=AuditActionEnum.USER_PASSWORD_CHANGED,
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
        description=f"User {user.email} changed their password securely",
        details={"user_id": user.id, "email": user.email},
        request=request,
        skip_commit=True,
    )

    db.commit()


def get_user_roster(db: Session, skip: int = 0, limit: int = 100) -> List[UserRosterItem]:
    """Retrieves safe user cards for team collaboration and member selection."""
    users = db.query(User).filter(User.is_active == True).order_by(User.full_name.asc()).offset(skip).limit(limit).all()
    return [
        UserRosterItem(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role_name=u.role.name if u.role else "Employee",
            is_active=u.is_active,
        )
        for u in users
    ]