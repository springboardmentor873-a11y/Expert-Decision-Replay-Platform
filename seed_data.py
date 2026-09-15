"""
seed_data.py - Run this script to insert sample users into the database.

Usage:
    python seed_data.py

This will insert 8 sample users covering all roles (Employee, Reviewer,
Manager, Administrator) and both departments (IT, CAC).

The script is idempotent: running it multiple times will not create
duplicate users (it skips any email or employee_id that already exists).
"""

import sys
import os

# Make sure the project root is on sys.path so app.* imports work
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.core.security import hash_password

# Import every model so that Base.metadata.create_all() (used only as a
# safety net below) knows about every table. Normally tables are created
# via `alembic upgrade head`, not this script.
import app.models  # noqa: F401


SEED_USERS = [
    {
        "full_name": "Admin User",
        "email": "admin@example.com",
        "password": "Admin@123",
        "role": "Administrator",
        "employee_id": "EMP001",
        "department": "IT",
        "designation": "System Administrator",
        "phone_number": "9876543210",
    },
    {
        "full_name": "Dhanya Manager",
        "email": "dhanya.manager@example.com",
        "password": "Manager@123",
        "role": "Manager",
        "employee_id": "EMP002",
        "department": "IT",
        "designation": "IT Manager",
        "phone_number": "9876543211",
    },
    {
        "full_name": "Ramya Reviewer",
        "email": "ramya.reviewer@example.com",
        "password": "Reviewer@123",
        "role": "Reviewer",
        "employee_id": "EMP003",
        "department": "CAC",
        "designation": "Senior Reviewer",
        "phone_number": "9876543212",
    },
    {
        "full_name": "Arjun Employee",
        "email": "arjun.employee@example.com",
        "password": "Employee@123",
        "role": "Employee",
        "employee_id": "EMP004",
        "department": "IT",
        "designation": "Software Engineer",
        "phone_number": "9876543213",
    },
    {
        "full_name": "Priya Employee",
        "email": "priya.employee@example.com",
        "password": "Employee@123",
        "role": "Employee",
        "employee_id": "EMP005",
        "department": "CAC",
        "designation": "Customer Advisor",
        "phone_number": "9876543214",
    },
    {
        "full_name": "Suresh Manager",
        "email": "suresh.manager@example.com",
        "password": "Manager@123",
        "role": "Manager",
        "employee_id": "EMP006",
        "department": "CAC",
        "designation": "CAC Manager",
        "phone_number": "9876543215",
    },
    {
        "full_name": "Kavitha Reviewer",
        "email": "kavitha.reviewer@example.com",
        "password": "Reviewer@123",
        "role": "Reviewer",
        "employee_id": "EMP007",
        "department": "IT",
        "designation": "QA Reviewer",
        "phone_number": "9876543216",
    },
    {
        "full_name": "Ravi Employee",
        "email": "ravi.employee@example.com",
        "password": "Employee@123",
        "role": "Employee",
        "employee_id": "EMP008",
        "department": "IT",
        "designation": "Junior Developer",
        "phone_number": "9876543217",
    },
]


def seed():
    # Safety net only - the real schema should already exist via
    # `alembic upgrade head`. This will not touch existing tables.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    inserted = 0
    skipped = 0

    try:
        for data in SEED_USERS:
            existing = (
                db.query(User)
                .filter(
                    (User.email == data["email"])
                    | (User.employee_id == data["employee_id"])
                )
                .first()
            )
            if existing:
                print(f"  [SKIP] {data['email']} already exists")
                skipped += 1
                continue

            user = User(
                full_name=data["full_name"],
                email=data["email"],
                password=hash_password(data["password"]),
                role=data["role"],
                employee_id=data["employee_id"],
                department=data["department"],
                designation=data["designation"],
                phone_number=data["phone_number"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"  [OK]   {data['email']}  (id={user.id}, role={user.role})")
            inserted += 1

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()

    print(f"\n[DONE] {inserted} user(s) inserted, {skipped} skipped.")
    print("\n--- Login credentials to test ---")
    print("  Administrator : admin@example.com           / Admin@123")
    print("  Manager (IT)  : dhanya.manager@example.com  / Manager@123")
    print("  Manager (CAC) : suresh.manager@example.com  / Manager@123")
    print("  Reviewer (CAC): ramya.reviewer@example.com  / Reviewer@123")
    print("  Reviewer (IT) : kavitha.reviewer@example.com/ Reviewer@123")
    print("  Employee (IT) : arjun.employee@example.com  / Employee@123")
    print("  Employee (CAC): priya.employee@example.com  / Employee@123")
    print("  Employee (IT) : ravi.employee@example.com   / Employee@123")


if __name__ == "__main__":
    print("Seeding database...\n")
    seed()
