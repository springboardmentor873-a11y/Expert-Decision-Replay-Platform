"""
FastAPI dependencies used to protect endpoints:

- get_current_user: decodes the JWT from the Authorization header and
  loads the corresponding user record from MySQL. Raises 401 if the
  token is missing, invalid, expired, or the user no longer exists.

- require_role(*roles): a dependency factory that additionally ensures
  the current user's role is one of the allowed roles. Raises 403
  otherwise. Used to protect administrator-only endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.auth.security import decode_access_token
from app.database import DatabaseCursor

# Points Swagger's "Authorize" button at the login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    with DatabaseCursor() as (cursor, _conn):
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email, u.role, u.team_id,
                   t.team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.id = %s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

    if user is None:
        raise credentials_exception

    return user


def require_role(*allowed_roles: str):
    """
    Dependency factory. Example usage on a route:

        @router.get("/admin-only")
        def admin_endpoint(current_user: dict = Depends(require_role("Administrator"))):
            ...
    """

    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return role_checker
