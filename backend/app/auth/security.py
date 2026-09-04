"""
Security utilities: password hashing and JWT token creation/validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

# ---------------------------------------------------------------------
# Password hashing (bcrypt via passlib)
# ---------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password. Passwords are NEVER stored in plaintext."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, password_hash)


# ---------------------------------------------------------------------
# JWT token creation / decoding
# ---------------------------------------------------------------------
def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    """
    Create a signed JWT containing the given claims plus an expiration
    time. The secret key and algorithm come from environment variables
    (see app/config.py) - never hardcoded.
    """
    to_encode = data.copy()
    expire_minutes = expires_minutes or settings.JWT_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT. Returns the payload dict on success,
    or None if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
