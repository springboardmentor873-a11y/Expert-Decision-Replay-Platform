"""Password hashing and role helpers.

Passwords were previously stored in plain text. They are now stored using
PBKDF2-HMAC-SHA256 (standard library only, so no extra native dependency).
Legacy plain-text rows are still accepted on login and upgraded in place.
"""

import hashlib
import hmac
import os
import secrets

PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 390_000
SALT_BYTES = 16


def hash_password(password: str, *, iterations: int = PBKDF2_ITERATIONS) -> str:
    if not password:
        raise ValueError("Password cannot be empty")

    salt = os.urandom(SALT_BYTES)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )

    return (
        f"{PBKDF2_ALGORITHM}${iterations}$"
        f"{salt.hex()}${derived.hex()}"
    )


def is_hashed(password: str) -> bool:
    return bool(password) and password.startswith(f"{PBKDF2_ALGORITHM}$")


def verify_password(password: str, stored: str) -> bool:
    """Verify a candidate password against a stored hash (or a legacy row)."""

    if not password or not stored:
        return False

    # Legacy accounts created before hashing was introduced.
    if not is_hashed(stored):
        return hmac.compare_digest(password, stored)

    try:
        algorithm, iterations_raw, salt_hex, hash_hex = stored.split("$")
        if algorithm != PBKDF2_ALGORITHM:
            return False

        iterations = int(iterations_raw)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, TypeError):
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )

    return hmac.compare_digest(derived, expected)


MANAGER_ROLES = {"manager", "admin", "administrator", "superadmin"}


def normalise_role(role: str | None) -> str:
    return (role or "employee").strip().lower() or "employee"


def is_manager_role(role: str | None) -> bool:
    return normalise_role(role) in MANAGER_ROLES


def normalise_role_for_storage(role: str | None) -> str:
    """
    Canonical role strings stored in the database.

    Manager-family roles collapse to `manager`; everything else is kept as a
    distinct non-manager role (`employee`, `reviewer`) so the UI can show it.
    """

    normalised = normalise_role(role)
    return "manager" if normalised in MANAGER_ROLES else normalised


def generate_secret(length: int = 32) -> str:
    return secrets.token_urlsafe(length)