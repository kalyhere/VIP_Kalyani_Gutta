import time
import asyncio
import structlog
from functools import wraps

structlog.configure(
    processors=[structlog.processors.JSONRenderer()],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()


def time_measurement(task_name: str):
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            result = await func(*args, **kwargs)
            elapsed_time = time.perf_counter() - start_time
            logger.info(f"{task_name} Completed", elapsed_time=f"{elapsed_time:.6f}")
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            result = func(*args, **kwargs)
            elapsed_time = time.perf_counter() - start_time
            logger.info(f"{task_name} Completed", elapsed_time=f"{elapsed_time:.6f}")
            return result

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator
