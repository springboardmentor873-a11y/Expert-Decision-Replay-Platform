from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Best-effort extraction of the caller's IP address, respecting a
    reverse-proxy X-Forwarded-For header when present (e.g. behind nginx/ALB).
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
