"""
Celery configuration for AIMMS Web Platform
Handles background job processing for AIMHEI transcript analysis
"""

import os
from celery import Celery
from celery.signals import worker_ready
import structlog

# Configure structured logging
logger = structlog.get_logger(__name__)

# Get Redis URL from environment variables
REDIS_URL = os.getenv("REDIS_URL", os.getenv("REDIS_TLS_URL", "redis://localhost:6379/0"))

# Configure SSL for TLS connections (Heroku Redis)
broker_use_ssl = None
redis_backend_use_ssl = None

if REDIS_URL.startswith("rediss://"):
    import ssl
    # Heroku Redis uses self-signed certificates
    broker_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_NONE,
        'ssl_ca_certs': None,
        'ssl_check_hostname': False,
    }
    redis_backend_use_ssl = broker_use_ssl

# Create Celery app
celery_app = Celery(
    "aimms_web",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.tasks"]
)

# Celery configuration
celery_app.conf.update(
    # SSL configuration for TLS connections
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=redis_backend_use_ssl,
    # Task routing - removed custom queues, use default queue for simplicity
    # task_routes={
    #     "backend.tasks.process_aimhei_transcript": {"queue": "aimhei"},
    #     "backend.tasks.update_job_progress": {"queue": "progress"},
    # },
    
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        "master_name": "mymaster",
        "visibility_timeout": 3600,
    },
    
    # Task execution settings
    task_soft_time_limit=3600,  # 1 hour soft limit
    task_time_limit=3900,       # 65 minutes hard limit
    task_track_started=True,
    
    # Retry settings
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Connection settings (fixes deprecation warnings)
    broker_connection_retry_on_startup=True,
)

# Worker ready signal
@worker_ready.connect
def worker_ready_handler(sender=None, **kwargs):
    logger.info("Celery worker is ready and waiting for tasks")

# Task failure handler
@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery configuration"""
    logger.info(f"Request: {self.request!r}")
    return "Debug task completed successfully"

if __name__ == "__main__":
    celery_app.start() 