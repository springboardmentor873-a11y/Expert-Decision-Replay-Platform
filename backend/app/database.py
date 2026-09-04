"""
Database connectivity module.

This project intentionally does NOT use an ORM (e.g. SQLAlchemy).
Instead it connects to MySQL directly using `mysql-connector-python`
and executes plain SQL statements. This keeps the Milestone 1
implementation simple and transparent for a beginner/intermediate
Python developer to follow.
"""

import mysql.connector
from mysql.connector import Error as MySQLError
from fastapi import HTTPException, status

from app.config import settings


def get_connection():
    """
    Open and return a new MySQL connection.

    Each request that needs the database opens its own short-lived
    connection and closes it when finished (see get_db_cursor below).
    This is simple and safe for a Milestone 1 scale project.
    """
    try:
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
        )
        return connection
    except MySQLError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to the database: {exc}",
        )


class DatabaseCursor:
    """
    Small context manager that opens a MySQL connection + dictionary
    cursor, and guarantees both are closed afterwards - even if an
    exception is raised while the cursor is in use.

    Usage:
        with DatabaseCursor() as (cursor, connection):
            cursor.execute("SELECT * FROM users")
            rows = cursor.fetchall()
    """

    def __init__(self, commit: bool = False):
        self.commit = commit
        self.connection = None
        self.cursor = None

    def __enter__(self):
        self.connection = get_connection()
        self.cursor = self.connection.cursor(dictionary=True)
        return self.cursor, self.connection

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is None and self.commit and self.connection:
                self.connection.commit()
        finally:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
        # Do not suppress exceptions
        return False


def check_database_connection() -> bool:
    """Used by the /health endpoint to confirm MySQL is reachable."""
    try:
        connection = get_connection()
        connection.close()
        return True
    except HTTPException:
        return False
