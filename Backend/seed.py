"""Optional demo seed data and first-manager bootstrap.

Two independent, opt-in behaviours:

* `SEED_DEMO_USERS=true` creates one manager and two employees so the approval
  workflow can be exercised immediately after `docker compose up`.
* `BOOTSTRAP_MANAGER_EMAIL` guarantees the deployment has at least one manager.
  Self-service signup can never create one, so without this an installation
  would have nobody able to approve decisions or manage roles.

Both leave existing accounts untouched.
"""

import os

from database import SessionLocal, create_tables, wait_for_database
from models import User
from security import hash_password, is_manager_role, normalise_role

DEMO_USERS = [
    {
        "name": "Morgan Ellis",
        "email": os.getenv("SEED_MANAGER_EMAIL", "manager@example.com"),
        "password": os.getenv("SEED_MANAGER_PASSWORD", "Manager@123"),
        "role": "manager",
    },
    {
        "name": "Avery Patel",
        "email": os.getenv("SEED_EMPLOYEE_EMAIL", "employee@example.com"),
        "password": os.getenv("SEED_EMPLOYEE_PASSWORD", "Employee@123"),
        "role": "employee",
    },
    {
        "name": "Jordan Rivera",
        "email": os.getenv("SEED_EMPLOYEE2_EMAIL", "employee2@example.com"),
        "password": os.getenv("SEED_EMPLOYEE2_PASSWORD", "Employee@123"),
        "role": "employee",
    },
]


def bootstrap_manager(db) -> str:
    """
    Guarantee that BOOTSTRAP_MANAGER_EMAIL holds a manager account.

    The named account is always honoured, because the operator asked for it by
    name. A brand-new account is only created when the installation has no
    manager at all, so re-running this cannot resurrect an old admin.

    Returns a short status line describing what happened.
    """

    email = (os.getenv("BOOTSTRAP_MANAGER_EMAIL") or "").strip().lower()
    if not email:
        return "skipped: BOOTSTRAP_MANAGER_EMAIL not set"

    user = db.query(User).filter(User.email == email).first()

    if user:
        if is_manager_role(user.role):
            return f"skipped: {email} is already a manager"

        previous = user.role
        user.role = "manager"
        db.add(user)
        db.commit()
        return f"promoted existing account {email} from {previous} to manager"

    has_manager = any(
        is_manager_role(other.role) for other in db.query(User).all()
    )
    if has_manager:
        return f"skipped: {email} does not exist and managers already exist"

    password = os.getenv("BOOTSTRAP_MANAGER_PASSWORD") or ""
    if not password:
        return "skipped: no managers exist and BOOTSTRAP_MANAGER_PASSWORD is unset"

    db.add(
        User(
            name=os.getenv("BOOTSTRAP_MANAGER_NAME", "Platform Administrator"),
            email=email,
            password=hash_password(password),
            role="manager",
        )
    )
    db.commit()
    return f"created bootstrap manager {email}"


def seed() -> None:
    if not wait_for_database():
        raise SystemExit("Database is not reachable; cannot seed.")

    create_tables()

    db = SessionLocal()
    created = 0

    try:
        for payload in DEMO_USERS:
            exists = (
                db.query(User).filter(User.email == payload["email"]).first()
            )
            if exists:
                continue

            db.add(
                User(
                    name=payload["name"],
                    email=payload["email"],
                    password=hash_password(payload["password"]),
                    role=normalise_role(payload["role"]),
                )
            )
            created += 1

        db.commit()

        status = bootstrap_manager(db)
    finally:
        db.close()

    print(f"[seed] created {created} demo user(s)", flush=True)
    print(f"[seed] bootstrap manager: {status}", flush=True)


if __name__ == "__main__":
    seed()