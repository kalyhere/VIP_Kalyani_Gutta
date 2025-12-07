#!/usr/bin/env python3
"""Entrypoint script for backend service."""

import os
import sys
import subprocess

# Add the backend directory to Python path
sys.path.insert(0, '/app')

def main():
    """Main entrypoint function."""
    print("🚀 Starting AIMMS Backend...")
    
    # Initialize database
    print("🔄 Initializing database...")
    result = subprocess.run([sys.executable, "-m", "backend.db.init_db"], 
                          capture_output=True, text=True, cwd="/app")
    
    if result.returncode != 0:
        print(f"❌ Database initialization failed:")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        sys.exit(1)
    
    print("✅ Database initialization completed")
    print(result.stdout)

    # Seed test data in development
    if os.environ.get("ENVIRONMENT") == "development":
        print("🌱 Seeding test data...")
        result = subprocess.run([sys.executable, "seed_test_data.py"],
                              capture_output=True, text=True, cwd="/app")
        if result.returncode == 0:
            print(result.stdout)
        else:
            print(f"⚠️  Seeding failed: {result.stderr}")

    # Start the web server
    print("🌐 Starting web server...")
    port = os.environ.get("PORT", "8000")
    print(f"📍 Using port: {port}")
    os.execvp("uvicorn", ["uvicorn", "backend.main:app",
                         "--host", "0.0.0.0", "--port", port])

if __name__ == "__main__":
    main() 