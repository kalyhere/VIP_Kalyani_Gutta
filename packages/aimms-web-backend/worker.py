#!/usr/bin/env python3
"""
Celery worker startup script for AIMMS Web Platform
"""

import os
import sys
import structlog
from backend.celery_app import celery_app

# Configure structured logging
logger = structlog.get_logger(__name__)

def main():
    """Main function to start the Celery worker"""
    
    # Set up environment
    environment = os.getenv("ENVIRONMENT", "development")
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    logger.info(f"Starting Celery worker in {environment} mode")
    logger.info(f"Redis URL: {redis_url}")
    
    # Configure worker options
    worker_options = [
        '--loglevel=info',
        '--concurrency=2',
        '--prefetch-multiplier=1',
        '--max-tasks-per-child=1000',
        '--without-heartbeat',
        '--without-gossip',
        '--without-mingle',
    ]
    
    # Add environment-specific options
    if environment == "development":
        worker_options.extend([
            '--reload',
            '--pool=threads',  # Use threads for better development experience
        ])
    else:
        worker_options.extend([
            '--pool=prefork',  # Use prefork for production
            '--optimization=fair',
        ])
    
    # Start the worker
    try:
        logger.info("Starting Celery worker with options: %s", worker_options)
        celery_app.worker_main(worker_options)
    except KeyboardInterrupt:
        logger.info("Celery worker stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Celery worker failed to start: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 