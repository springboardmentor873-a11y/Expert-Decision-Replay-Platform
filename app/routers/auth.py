from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit_log import AuditAction, AuditEntityType
from app.schemas.user import UserResponse, UserSelfRegister
from app.services.audit_service import log_audit


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserSelfRegister,
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    if db.query(User).filter(User.employee_id == payload.employee_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this employee ID already exists",
        )

    # Self-registration always creates an Employee account.
    # Role escalation must go through an Administrator (/users/{id}/role).
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        password=hash_password(payload.password),
        role="Employee",
        employee_id=payload.employee_id,
        department=payload.department,
        designation=payload.designation,
        phone_number=payload.phone_number,
    )

    db.add(new_user)
    db.flush()

    log_audit(
        db=db,
        user_id=new_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.USER,
        entity_id=new_user.id,
        description=f"User {new_user.email} self-registered",
        request_method="POST",
        endpoint="/auth/register",
    )

    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    client_ip = (
        request.client.host
        if request.client
        else None
    )

    if not user or not verify_password(
        form_data.password,
        user.password
    ):
        # Do not create a user-linked audit record here because
        # authentication failed and the user may not exist.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact an administrator.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    log_audit(
        db=db,
        user_id=user.id,
        action=AuditAction.LOGIN,
        entity_type=AuditEntityType.USER,
        entity_id=user.id,
        description=f"User {user.id} logged in successfully",
        ip_address=client_ip,
        request_method="POST",
        endpoint="/auth/login"
    )

    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user).model_dump(mode="json"),
    }
