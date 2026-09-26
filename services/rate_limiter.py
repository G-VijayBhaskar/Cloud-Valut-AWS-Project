import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.config import settings

class RateLimiter:
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Stores IP address -> list of request timestamps
        self.requests = defaultdict(list)

    def check_rate_limit(self, request: Request):
        # Obtain client IP address safely
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # Support X-Forwarded-For header if behind reverse proxy (Nginx)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        now = time.time()
        timestamps = self.requests[client_ip]

        # Evict timestamps outside time window
        timestamps = [ts for ts in timestamps if now - ts < self.window_seconds]
        self.requests[client_ip] = timestamps

        if len(timestamps) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please wait a minute before trying again."
            )

        timestamps.append(now)

auth_rate_limiter = RateLimiter(
    max_requests=settings.AUTH_RATE_LIMIT_REQUESTS,
    window_seconds=settings.AUTH_RATE_LIMIT_WINDOW_SEC
)
