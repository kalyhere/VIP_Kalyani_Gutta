#!/usr/bin/env python3
"""Database initialization script for Docker containers."""

import os
import sys
import time
import subprocess
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, '/app')

def wait_for_database():
    """Wait for database to be ready."""
    print("🔄 Waiting for database to be ready...")
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

def create_tables():
    """Create database tables using SQLAlchemy."""
    try:
        print("🔄 Creating database tables...")
        from backend.database import engine
        from backend.models import Base
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Database table creation failed: {e}")
        return False

def initialize_data():
    """Initialize database with default data."""
    try:
        print("🔄 Initializing database with default data...")
        from backend.db.init_db import setup_database
        setup_database()
        print("✅ Database initialization completed successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def main():
    """Main initialization function."""
    print("🚀 Starting database initialization...")
    
    # Wait for database to be ready
    if not wait_for_database():
        sys.exit(1)

    # Create tables
    if not create_tables():
        sys.exit(1)
    
    # Initialize data
    if not initialize_data():
        sys.exit(1)
    
    print("🎉 Database initialization completed successfully!")

if __name__ == "__main__":
    main() 