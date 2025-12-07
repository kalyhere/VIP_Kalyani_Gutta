"""Main FastAPI application for suture analysis backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from pathlib import Path

from routes import router as suture_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AIMMS Suture Analysis API",
    description="Backend API for suture pad analysis using YOLOv8",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    root_path="/api/suture-analysis"
)

# CORS configuration - should match main aimms-web settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React frontend local
        "http://127.0.0.1:3000",
        "http://localhost:8000",  # Main backend local
        "http://127.0.0.1:8000",
        "https://www.aidset.ai",  # Production frontend
        "https://aidset.ai",  # Production frontend (no www)
        "https://aimms-web-backend-d6aa2ce3638a.herokuapp.com",  # Production main backend
        "http://aimms.colo-prod-aws.arizona.edu",  # Campus server
        "https://aimms.colo-prod-aws.arizona.edu",  # Campus server (HTTPS)
        # Mobile development - add your local network IP here
        "http://10.132.148.159:3000",   # Mobile access
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(suture_router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "AIMMS Suture Analysis Backend",
        "version": "1.0.0",
        "status": "running",
        "deployed": True
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info("Starting AIMMS Suture Analysis Backend")
    
    # Check if weights directory exists
    weights_dir = Path(__file__).parent.parent.parent / "weights"
    if not weights_dir.exists():
        logger.warning(f"Weights directory not found: {weights_dir}")
        logger.info("Creating weights directory - please add YOLOv8 model weights")
        weights_dir.mkdir(exist_ok=True)
    
    # Check for model files
    model_files = list(weights_dir.glob("*.pt"))
    if not model_files:
        logger.warning("No YOLOv8 model weights found in weights directory")
        logger.info("Please add .pt model files to the weights directory for full functionality")
    else:
        logger.info(f"Found {len(model_files)} model file(s): {[f.name for f in model_files]}")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Shutting down AIMMS Suture Analysis Backend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )