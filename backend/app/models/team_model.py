"""
Data-access functions for the `teams` table.
"""

from typing import Optional
from app.database import DatabaseCursor


def create_team(team_name: str, manager_id: Optional[int]) -> int:
    with DatabaseCursor(commit=True) as (cursor, _conn):
        cursor.execute(
            "INSERT INTO teams (team_name, manager_id) VALUES (%s, %s)",
            (team_name, manager_id),
        )
        return cursor.lastrowid


def list_teams() -> list:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute(
            """
            SELECT t.id, t.team_name, t.manager_id, u.full_name AS manager_name,
                   t.created_at
            FROM teams t
            LEFT JOIN users u ON t.manager_id = u.id
            ORDER BY t.created_at DESC
            """
        )
        return cursor.fetchall()


def get_team_by_id(team_id: int) -> Optional[dict]:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute("SELECT id, team_name FROM teams WHERE id = %s", (team_id,))
        return cursor.fetchone()


def get_team_by_name(team_name: str) -> Optional[dict]:
    with DatabaseCursor() as (cursor, _conn):
        cursor.execute("SELECT id FROM teams WHERE team_name = %s", (team_name,))
        return cursor.fetchone()
