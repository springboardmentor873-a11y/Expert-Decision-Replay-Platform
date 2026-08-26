from typing import Callable, Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.database import get_db
from app.models.role import RoleEnum
from app.models.user import User

# HTTP Bearer security scheme
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to extract and validate the current authenticated user from Bearer JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user account",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(*allowed_roles: Union[RoleEnum, str]) -> Callable[[User], User]:
    """
    Reusable authorization dependency factory to restrict endpoint access by role.
    Raises HTTP 403 Forbidden if the authenticated user's role is not in allowed_roles.
    """
    normalized_allowed = {
        r.value if isinstance(r, RoleEnum) else str(r)
        for r in allowed_roles
    }

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_name = current_user.role.name if current_user.role else None
        if not user_role_name or user_role_name not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Access requires one of the following roles: {', '.join(sorted(normalized_allowed))}",
            )
        return current_user

    return role_checker