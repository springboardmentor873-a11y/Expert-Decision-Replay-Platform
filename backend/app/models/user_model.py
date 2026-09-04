"""
Data-access functions for the `users` table.

These functions execute plain SQL through mysql-connector-python.
There is no ORM in this project by design (see Milestone 1 spec).
"""

from typing import Optional
from app.database import DatabaseCursor


def get_user_by_email(email: str) -> Optional[dict]:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email, u.password_hash, u.role,
                   u.team_id, t.team_name, u.created_at, u.updated_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.email = %s
            """,
            (email,),
        )
        return cursor.fetchone()


def get_user_by_id(user_id: int) -> Optional[dict]:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email, u.role, u.team_id,
                   t.team_name, u.created_at, u.updated_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.id = %s
            """,
            (user_id,),
        )
        return cursor.fetchone()


def create_user(full_name: str, email: str, password_hash: str, role: str,
                 team_id: Optional[int]) -> int:
    with DatabaseCursor(commit=True) as (cursor, _conn):
        cursor.execute(
            """
            INSERT INTO users (full_name, email, password_hash, role, team_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (full_name, email, password_hash, role, team_id),
        )
        return cursor.lastrowid


def list_users() -> list:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute(
            """
            SELECT u.id, u.full_name, u.email, u.role, u.team_id,
                   t.team_name, u.created_at, u.updated_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            ORDER BY u.created_at DESC
            """
        )
        return cursor.fetchall()


def update_user_role(user_id: int, new_role: str) -> bool:
    with DatabaseCursor(commit=True) as (cursor, _conn):
        cursor.execute(
            "UPDATE users SET role = %s WHERE id = %s",
            (new_role, user_id),
        )
        return cursor.rowcount > 0


def update_user_team(user_id: int, team_id: Optional[int]) -> bool:
    with DatabaseCursor(commit=True) as (cursor, _conn):
        cursor.execute(
            "UPDATE users SET team_id = %s WHERE id = %s",
            (team_id, user_id),
        )
        return cursor.rowcount > 0
