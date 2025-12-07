#!/usr/bin/env python3
"""Startup script for the suture analysis backend."""

import uvicorn
import os
import sys

# Add src directory to Python path
src_path = os.path.join(os.path.dirname(__file__), 'src')
sys.path.insert(0, src_path)

# Also add individual module paths
sys.path.insert(0, os.path.join(src_path, 'api'))
sys.path.insert(0, os.path.join(src_path, 'auth'))
sys.path.insert(0, os.path.join(src_path, 'ml'))
sys.path.insert(0, os.path.join(src_path, 'ml', 'utils'))

if __name__ == "__main__":
    # Use reload only in development
    is_development = os.environ.get("ENVIRONMENT", "production") == "development"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8001)),
        reload=is_development,
        log_level="info"
    )