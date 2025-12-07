"""
Celery tasks for AIMMS Web Platform
Background job processing for AIMHEI transcript analysis
"""

import os
import json
import uuid
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, Optional
import asyncio
import redis
import structlog
from celery import current_task
from celery.exceptions import Retry

from .celery_app import celery_app
from .AIMHEI.AIMHEI import AIMHEI
from .models import AIMHEIReport
from .database import SessionLocal
from .crud import create_aimhei_report

# Configure structured logging
logger = structlog.get_logger(__name__)

# Redis client for job status tracking
redis_url = os.getenv("REDIS_URL", os.getenv("REDIS_TLS_URL", "redis://localhost:6379/0"))

# Handle Heroku Redis with self-signed certificates
import ssl

if redis_url.startswith("rediss://"):
    redis_client = redis.from_url(
        redis_url,
        ssl_cert_reqs=ssl.CERT_NONE,
        ssl_check_hostname=False
    )
else:
    redis_client = redis.from_url(redis_url)

# Job status constants
class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobProgress:
    STARTED = 0
    PREPARING = 10
    MODELING = 30
    GENERATING_REPORTS = 60
    SAVING_RESULTS = 80
    COMPLETED = 100

def update_job_status(job_id: str, status: str, progress: int = 0, message: str = "", error: str = None):
    """Update job status and progress in Redis"""
    try:
        job_data = {
            "job_id": job_id,
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        if error:
            job_data["error"] = error
            
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(job_data))
        
        # Also publish to channel for Server-Sent Events
        redis_client.publish(f"job_progress:{job_id}", json.dumps(job_data))
        
        logger.info(f"Updated job {job_id}: {status} - {progress}% - {message}")
        
    except Exception as e:
        logger.error(f"Failed to update job status for {job_id}: {str(e)}")

def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job status from Redis"""
    try:
        data = redis_client.get(f"job:{job_id}")
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        logger.error(f"Failed to get job status for {job_id}: {str(e)}")
        return None

def generate_mock_aimhei_result(file_name: str = "mock_transcript") -> dict:
    """Generate mock AIMHEI result for testing"""
    return {
        "aimhei_report": None,  # Skip PDF generation in test mode
        "rubric": {
            "Information Section": {
                "Chief Complaint": {
                    "Did the student ask for the chief complaint?": {
                        "answer": "yes",
                        "explanation": "Student properly inquired about the chief complaint",
                        "line_numbers": [1, 2, 3]
                    }
                },
                "History of Present Illness": {
                    "Did the student ask about the history of present illness?": {
                        "answer": "yes", 
                        "explanation": "Student thoroughly explored the history of present illness",
                        "line_numbers": [5, 6, 7, 8]
                    }
                }
            },
            "Skill Section": {
                "Politeness Scoring": {
                    "polite_examples": [12, 15, 18],
                    "politeness_score": 8.5,
                    "scoring_details": {
                        "12": {
                            "original": "Could you please tell me more about that?",
                            "best_version": "Could you please tell me more about that?",
                            "worst_version": "Tell me more.",
                            "score": 9.2
                        }
                    }
                },
                "Empathy Scoring": {
                    "empathy_examples": [20, 25, 30],
                    "empathy_score": 7.8,
                    "scoring_details": {
                        "20": {
                            "original": "That must be very difficult for you",
                            "best_version": "That must be incredibly difficult for you to experience",
                            "worst_version": "That's tough",
                            "score": 8.1
                        }
                    }
                },
                "Medical Terminology Scoring": {
                    "hypertension": {
                        "correct_usage": "yes",
                        "explanation": "Used appropriately in context",
                        "line_num": 45,
                        "line": "Patient has history of hypertension",
                        "context": ["Previous line", "Patient has history of hypertension", "Next line"]
                    }
                }
            }
        }
    }

@celery_app.task(bind=True, acks_late=True, reject_on_worker_lost=True)
def process_aimhei_transcript(
    self,
    job_id: str,
    transcript_data: str,
    json_data: dict,
    file_name: str = "transcript",
    user_id: int = None,
    has_custom_criteria: bool = False
):
    """
    Process AIMHEI transcript in background

    Args:
        job_id: Unique job identifier
        transcript_data: Raw transcript content
        json_data: Configuration data for AIMHEI processing
        file_name: Name of the transcript file
        user_id: ID of the user who submitted the job
        has_custom_criteria: Flag indicating if custom criteria is stored in Redis
    """

    # Initialize job status
    update_job_status(job_id, JobStatus.PROCESSING, JobProgress.STARTED,
                     "Starting AIMHEI processing...")

    # Retrieve custom criteria from Redis if flag is set
    custom_criteria = None
    if has_custom_criteria:
        criteria_key = f"job:{job_id}:criteria"
        try:
            criteria_json = redis_client.get(criteria_key)
            if criteria_json:
                custom_criteria = json.loads(criteria_json)
                logger.info(f"Job {job_id}: Retrieved custom criteria from Redis (keys: {list(custom_criteria.keys())})")
            else:
                logger.warning(f"Job {job_id}: Custom criteria flag set but not found in Redis")
        except Exception as e:
            logger.error(f"Job {job_id}: Failed to retrieve custom criteria from Redis: {str(e)}")

    # Debug: Log what we received
    logger.info(f"Job {job_id}: Task parameters - file_name={file_name}, user_id={user_id}, custom_criteria={'present' if custom_criteria else 'None'}")

    try:
        # Check if test mode is enabled
        is_test_mode = os.getenv("AIMHEI_TEST_MODE", "false").lower() == "true"
        
        if is_test_mode:
            logger.info(f"Job {job_id}: Running in test mode - generating mock data")
            
            # Simulate processing steps with delays
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.PREPARING, 
                             "Preparing transcript (test mode)...")
            
            # Simulate some processing time
            import time
            time.sleep(2)
            
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.MODELING, 
                             "Analyzing transcript (test mode)...")
            time.sleep(3)
            
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.GENERATING_REPORTS, 
                             "Generating reports (test mode)...")
            time.sleep(2)
            
            # Generate mock results
            result = generate_mock_aimhei_result(file_name)
            
        else:
            # Real AIMHEI processing
            logger.info(f"Job {job_id}: Running real AIMHEI processing")

            # Log custom criteria status
            if custom_criteria:
                logger.info(f"Job {job_id}: Custom criteria provided (keys: {list(custom_criteria.keys())})")
            else:
                logger.info(f"Job {job_id}: No custom criteria - will use default")

            # Create BytesIO object from transcript data
            transcript_input = BytesIO(transcript_data.encode('utf-8'))

            # Initialize AIMHEI processor
            aimhei = AIMHEI(
                json_data=json_data,
                transcript_input=transcript_input,
                file_name=file_name,
                is_test_mode=False,
                skip_pdf=True,  # Skip PDF generation for web processing
                custom_criteria=custom_criteria  # Pass custom criteria if provided
            )
            
            # Step 1: Prepare transcript
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.PREPARING, 
                             "Preparing and formatting transcript...")
            aimhei.prepare()
            
            # Step 2: Model data (AI analysis)
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.MODELING, 
                             "Analyzing transcript with AI models...")
            
            # Run async model_data in thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(aimhei.model_data())
            
            # Step 3: Generate reports
            update_job_status(job_id, JobStatus.PROCESSING, JobProgress.GENERATING_REPORTS, 
                             "Generating comprehensive reports...")
            
            result = loop.run_until_complete(aimhei.generate_reports(
                transcript=aimhei.prepared.transcript,
                criteria_dict=aimhei.modeled.criteria_dict,
                strengths_weaknesses=True,
            ))
            
            loop.close()
        
        # Step 4: Save results to database
        update_job_status(job_id, JobStatus.PROCESSING, JobProgress.SAVING_RESULTS,
                         "Saving results to database...")

        # Parse rubric to get actual scores
        from backend.routers.transcripts import parse_rubric_data
        rubric_data = result.get("rubric", [])
        scores = parse_rubric_data(rubric_data)

        # Save to database
        db = SessionLocal()
        try:
            # Create AIMHEI report record directly to avoid parameter conflicts
            from backend.models import AIMHEIReport
            from backend.schemas import AIMHEIStatus, AIMHEIReportType
            from datetime import datetime

            db_report = AIMHEIReport(
                session_id=None,  # Standalone report
                report_name=json_data.get('report_name'),
                ai_model=json_data.get('model', 'gpt-4o'),
                hcp_name=json_data.get('HCP_name'),
                hcp_year=json_data.get('HCP_year'),
                patient_id=json_data.get('patient_ID'),
                interview_date=json_data.get('interview_date'),
                human_supervisor=json_data.get('human_supervisor'),
                aispe_location=json_data.get('aispe_location'),
                status=AIMHEIStatus.COMPLETED,
                report_type=AIMHEIReportType.standalone,
                # Use actual scores from AIMHEI analysis
                total_points_earned=scores.get('total_points_earned', 0),
                total_points_possible=scores.get('total_points_possible', 0),
                percentage_score=scores.get('percentage_score', 0),
                information_section_score=scores.get('information_section_score', 0),
                skill_section_score=scores.get('skill_section_score', 0),
                medical_terminology_score=scores.get('medical_terminology_score', 0),
                politeness_score=scores.get('politeness_score', 0),
                empathy_score=scores.get('empathy_score', 0),
                rubric_detail=rubric_data,  # Store the actual rubric data
                strengths_weaknesses=result.get('strengths_weaknesses'),  # Store AIMES analysis
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(db_report)
            db.commit()
            db.refresh(db_report)
            report_id = db_report.id
            
            # Add report_id to result
            result["report_id"] = report_id
            
        except Exception as e:
            logger.error(f"Job {job_id}: Database save failed: {str(e)}")
            raise
        finally:
            db.close()
        
        # Mark job as completed
        update_job_status(job_id, JobStatus.COMPLETED, JobProgress.COMPLETED, 
                         "AIMHEI processing completed successfully!", 
                         )
        
        # Store final result
        redis_client.setex(f"job_result:{job_id}", 3600, json.dumps(result))
        
        logger.info(f"Job {job_id}: AIMHEI processing completed successfully")
        return result
        
    except Exception as e:
        error_msg = f"AIMHEI processing failed: {str(e)}"
        logger.error(f"Job {job_id}: {error_msg}")
        
        # Mark job as failed
        update_job_status(job_id, JobStatus.FAILED, 0, "Processing failed", error_msg)
        
        # Re-raise for Celery retry logic
        raise self.retry(exc=e, countdown=60, max_retries=3)

@celery_app.task
def cleanup_old_jobs():
    """Clean up old job data from Redis"""
    try:
        # Get all job keys
        keys = redis_client.keys("job:*")
        
        cleaned_count = 0
        for key in keys:
            try:
                data = redis_client.get(key)
                if data:
                    job_data = json.loads(data)
                    updated_at = datetime.fromisoformat(job_data.get("updated_at", ""))
                    
                    # Remove jobs older than 24 hours
                    if (datetime.utcnow() - updated_at).total_seconds() > 86400:
                        redis_client.delete(key)
                        # Also clean up result data
                        job_id = key.decode().split(":")[-1]
                        redis_client.delete(f"job_result:{job_id}")
                        cleaned_count += 1
                        
            except Exception as e:
                logger.warning(f"Failed to clean job key {key}: {str(e)}")
                continue
                
        logger.info(f"Cleaned up {cleaned_count} old jobs")
        return cleaned_count
        
    except Exception as e:
        logger.error(f"Job cleanup failed: {str(e)}")
        raise

@celery_app.task(bind=True)
def health_check(self):
    """Health check task for monitoring"""
    try:
        # Test Redis connection
        redis_client.ping()
        
        # Test database connection
        db = SessionLocal()
        try:
            db.execute("SELECT 1")
        finally:
            db.close()
            
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "worker_id": self.request.id
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Export task functions for use in other modules
__all__ = [
    'process_aimhei_transcript',
    'cleanup_old_jobs', 
    'health_check',
    'update_job_status',
    'get_job_status',
    'JobStatus',
    'JobProgress'
] 