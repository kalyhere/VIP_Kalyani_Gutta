"""
Simple rate limiting for email sending to prevent abuse.
Uses Redis for distributed rate limiting across instances.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException
from redis import Redis
import os

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter using Redis for storing rate limit counters.
    """

    def __init__(self):
        """Initialize rate limiter with Redis connection."""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.redis = Redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()  # Test connection
            self.enabled = True
            logger.info("Rate limiter initialized with Redis")
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting: {e}. Rate limiting disabled.")
            self.redis = None
            self.enabled = False

    def check_rate_limit(
        self,
        user_id: int,
        limit_per_hour: int = 20,
        limit_per_day: int = 100
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user has exceeded rate limits.

        Args:
            user_id: User ID to check
            limit_per_hour: Maximum requests per hour
            limit_per_day: Maximum requests per day

        Returns:
            Tuple of (is_allowed, error_message)
            - (True, None) if request is allowed
            - (False, error_message) if rate limit exceeded
        """
        if not self.enabled:
            # If Redis is not available, allow all requests
            return True, None

        try:
            # Generate keys for hourly and daily counters
            now = datetime.utcnow()
            hour_key = f"rate_limit:email:{user_id}:hour:{now.strftime('%Y%m%d%H')}"
            day_key = f"rate_limit:email:{user_id}:day:{now.strftime('%Y%m%d')}"

            # Get current counts
            hour_count = self.redis.get(hour_key)
            day_count = self.redis.get(day_key)

            hour_count = int(hour_count) if hour_count else 0
            day_count = int(day_count) if day_count else 0

            # Check hourly limit
            if hour_count >= limit_per_hour:
                minutes_until_reset = 60 - now.minute
                return False, f"Hourly email limit exceeded ({limit_per_hour}/hour). Try again in {minutes_until_reset} minutes."

            # Check daily limit
            if day_count >= limit_per_day:
                hours_until_reset = 24 - now.hour
                return False, f"Daily email limit exceeded ({limit_per_day}/day). Try again in {hours_until_reset} hours."

            # Increment counters
            pipe = self.redis.pipeline()

            # Increment hourly counter and set expiration
            pipe.incr(hour_key)
            pipe.expire(hour_key, 3600)  # 1 hour

            # Increment daily counter and set expiration
            pipe.incr(day_key)
            pipe.expire(day_key, 86400)  # 24 hours

            pipe.execute()

            return True, None

        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            # On error, allow the request (fail open)
            return True, None

    def get_remaining_quota(self, user_id: int) -> dict:
        """
        Get remaining quota for a user.

        Args:
            user_id: User ID to check

        Returns:
            Dictionary with hourly and daily remaining counts
        """
        if not self.enabled:
            return {"hourly_remaining": None, "daily_remaining": None}

        try:
            now = datetime.utcnow()
            hour_key = f"rate_limit:email:{user_id}:hour:{now.strftime('%Y%m%d%H')}"
            day_key = f"rate_limit:email:{user_id}:day:{now.strftime('%Y%m%d')}"

            hour_count = self.redis.get(hour_key)
            day_count = self.redis.get(day_key)

            hour_count = int(hour_count) if hour_count else 0
            day_count = int(day_count) if day_count else 0

            return {
                "hourly_remaining": max(0, 20 - hour_count),
                "daily_remaining": max(0, 100 - day_count)
            }
        except Exception as e:
            logger.error(f"Error getting remaining quota: {e}")
            return {"hourly_remaining": None, "daily_remaining": None}


# Global rate limiter instance
_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """
    Get or create the global rate limiter instance.

    Returns:
        RateLimiter instance
    """
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
