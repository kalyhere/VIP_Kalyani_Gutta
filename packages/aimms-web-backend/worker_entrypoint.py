#!/usr/bin/env python3
"""Entrypoint script for Celery worker service."""

import os
import sys
import time

# Add the backend directory to Python path
sys.path.insert(0, '/app')

def wait_for_database():
    """Wait for database to be ready."""
    print("🔄 Starting AIMMS Celery Worker...")
    print("⏳ Waiting for database to be ready...")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            from backend.database import check_db_connection
            if check_db_connection():
                print("✅ Database connection successful")
                return True
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"⏳ Database not ready yet (attempt {attempt + 1}/{max_attempts}). Waiting...")
                time.sleep(2)
            else:
                print(f"❌ Failed to connect to database after {max_attempts} attempts: {e}")
                return False
    return False

def main():
    """Main entrypoint function."""
    # Wait for database
    if not wait_for_database():
        sys.exit(1)
    
    # Start the Celery worker with debug logging
    print("🔄 Starting Celery worker with debug logging...")
    os.execvp("celery", ["celery", "-A", "backend.celery_app", "worker", 
                        "--loglevel=debug", "--concurrency=2"])

if __name__ == "__main__":
    main() 