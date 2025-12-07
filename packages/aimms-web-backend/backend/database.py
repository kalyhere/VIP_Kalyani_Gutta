from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
import structlog
from dotenv import load_dotenv
from contextlib import contextmanager

# Load environment variables
load_dotenv()

logger = structlog.get_logger()

# Get DB URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Fix for Heroku PostgreSQL connection string
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with settings optimized for both web requests and long-running operations
engine = create_engine(
    DATABASE_URL,
    pool_size=5,  # Base pool size for regular web requests
    max_overflow=20,  # Allow more connections for AIMHEI operations
    pool_recycle=600,  # Recycle connections after 10 minutes
    pool_pre_ping=True,  # Check connection validity before usage
    pool_timeout=120,  # 2 minute timeout for long-running operations
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Session:
    """Get a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Provide a transactional scope around a series of operations for manual usage."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error("Database error", error=str(e))
        raise
    finally:
        db.close()

def init_db():
    """Initialize the database by creating all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise

def check_db_connection():
    """Check if the database connection is working."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error("Database connection failed", error=str(e))
        return False