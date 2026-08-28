from typing import Any

from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any = None,
    ) -> None:
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message, "details": details},
        )
        self.code = code
        self.message = message
        self.details = details


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", details: Any = None) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, "not_found", message, details)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Not authenticated", details: Any = None) -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, "unauthorized", message, details)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Insufficient permissions", details: Any = None) -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "forbidden", message, details)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict", details: Any = None) -> None:
        super().__init__(status.HTTP_409_CONFLICT, "conflict", message, details)
