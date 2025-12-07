import uvicorn
import base64
import json
import os
import traceback
import sys
from io import BytesIO
from typing import List, Optional
from datetime import datetime, timedelta

import structlog
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    status,
    Request,
    Query,
    Path,
    File,
    UploadFile
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from structlog.processors import JSONRenderer
from dotenv import load_dotenv
import jwt
from jose import JWTError

# Load environment variables from .env file
load_dotenv()

from sqlalchemy.orm import Session

from . import models, schemas, crud
from .AIMHEI.AIMHEI import AIMHEI
from .crud import CustomSQLAlchemyCrudRouter
from .database import SessionLocal, engine, get_db
from .auth import router as auth_router, get_current_user, hash_password, SECRET_KEY, ALGORITHM, get_current_active_user
from .routers import users, medical_cases, case_assignments, transcripts, virtual_patient, aimhei_reports, admin, invitations
from .routers import students

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI()

# Configure CORS - Dynamic for Codespaces
def get_cors_origins():
    """Get CORS origins dynamically based on environment"""
    base_origins = [
        "http://localhost:5174",  # Vite dev server
        "http://localhost:5173",  # Alternative Vite port
        "http://localhost:3000",  # Development
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:4173",  # Build
        "https://aimms-web-frontend.vercel.app", # Vite Prod frontend
        "https://virtual-patient-frontend.vercel.app",  # Virtual Patient frontend
        "https://aidset.ai", # Production domain (public)
        "https://www.aidset.ai", # Production domain with www
        "https://aimms.colo-prod-aws.arizona.edu", # Internal campus access
        # Mobile development - add your local network IP here
        "http://10.132.148.159:3000",   # Mobile access
    ]

    return base_origins

# Use wildcard for Codespaces in development, specific origins in production
cors_origins = get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add exception handler for better logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(datetime.now().timestamp())
    error_msg = f"Unhandled error ID: {error_id}"
    error_detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    
    # Log the full error details with stack trace
    logger.error(
        "Unhandled exception",
        error_id=error_id,
        path=request.url.path,
        method=request.method,
        exception_type=str(type(exc)),
        exception_msg=str(exc),
        traceback=error_detail
    )
    
    # Return a user-friendly response
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {error_msg}"},
    )

# Global variable to store the test mode status
is_test_mode = os.getenv("AIMHEI_TEST_MODE", "false").lower() == "true"

# Set up logging
structlog.configure(processors=[JSONRenderer()])
logger = structlog.get_logger()

# Include the routers - all under /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(medical_cases.router, prefix="/api")
app.include_router(case_assignments.router, prefix="/api")
app.include_router(transcripts.router)  # Already has /api/transcripts prefix
app.include_router(virtual_patient.router)  # Already has /api/virtual-patient prefix
app.include_router(aimhei_reports.router)  # Already has /api/aimhei-reports prefix
app.include_router(students.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")

# Register CRUD routers
crud_routers = []

for router in crud_routers:
    app.include_router(router)

# WebSocket manager to handle connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, websocket: WebSocket, message: str):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.websocket("/interviews/upload")
async def create_file_upload(websocket: WebSocket):
    # Check if we're in production mode
    token = None
    if not os.getenv("AIMHEI_TEST_MODE", "true").lower() == "true":
        # Get the token from the query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        try:
            # Verify the token using python-jose
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except JWTError as e:
            print(f"JWT verification failed: {str(e)}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            data_json = json.loads(data)
            file_content = base64.b64decode(data_json["file_content"])
            json_info = data_json["json_info"]

            if not data_json["file_name"].endswith(".txt"):
                await manager.send_message(
                    websocket, json.dumps({"error": "Only .txt files are allowed"})
                )
                continue

            json_data = json.loads(json_info)
            text_file = BytesIO(file_content)

            aimhei = AIMHEI(
                json_data,
                text_file,
                file_name=data_json["file_name"],
                is_test_mode=is_test_mode,
            )

            result = None
            try:
                result = await aimhei.test_run() if is_test_mode else await aimhei.run()
            except Exception:
                await manager.send_message(
                    websocket, json.dumps({"error": "An error occurred."})
                )
                manager.disconnect(websocket)
                break

            response_data = {}
            for key, value in result.items():
                if value is not None:
                    if isinstance(value, bytes):
                        response_data[key] = base64.b64encode(value).decode("utf-8")
                    else:
                        response_data[key] = base64.b64encode(
                            value.encode("utf-8")
                        ).decode("utf-8")

            original_filename = os.path.splitext(data_json["file_name"])[0]
            new_filename = f"{original_filename}-AIMHEI-REPORT.pdf"
            response_data["filename"] = new_filename

            await manager.send_message(websocket, json.dumps(response_data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    """
    Simple health check endpoint to test API connectivity
    """
    logger.info("Health check request received")
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "production")
    }

@app.on_event("startup")
async def startup_event():
    print(f"Running in {'test' if is_test_mode else 'normal'} mode")
    logger.info("Application started", test_mode=is_test_mode)

    # Test SMTP connection on startup
    from .email_service import get_email_service
    email_service = get_email_service()

    if email_service.is_configured:
        logger.info("Testing SMTP connection to Mimecast relay...")
        connection_ok = await email_service.test_connection()
        if connection_ok:
            logger.info("✅ SMTP connection successful - Email service ready")
        else:
            logger.warning("⚠️ SMTP connection failed - Email sending will not work")
    else:
        logger.warning("⚠️ SMTP not configured - Email sending disabled")

# Class endpoints
@app.post("/api/classes/", response_model=schemas.Class)
def create_class(
    class_data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Ensures a student can't create classes
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty and admin members can create classes"
        )
    
    # Verify the faculty_id matches the current user (unless user is admin)
    if current_user.role != "admin" and class_data.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create class for another faculty member"
        )
    
    return crud.create_class(db=db, class_data=class_data)

@app.get("/api/classes/", response_model=List[schemas.Class])
def read_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    faculty_id: Optional[int] = None,
    is_active: Optional[bool] = None
):
    # For admins, if no faculty_id is provided, show all classes (faculty_id=None)
    # For non-admins, if no faculty_id is provided, use the current user's ID
    if faculty_id is None and current_user.role != "admin":
        faculty_id = current_user.id
    
    # Verify the user has permission to view these classes
    if current_user.role != "admin" and faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these classes"
        )
    
    classes = crud.get_classes(
        db=db,
        skip=skip,
        limit=limit,
        faculty_id=faculty_id,
        is_active=is_active
    )
    return classes

@app.get("/api/classes/{class_id}", response_model=schemas.ClassWithStudents)
def read_class(
    class_id: int = Path(..., title="The ID of the class to get"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to view this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this class"
        )
    
    return db_class

@app.put("/api/classes/{class_id}", response_model=schemas.Class)
def update_class(
    class_id: int,
    class_data: schemas.ClassUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to update this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this class"
        )
    
    return crud.update_class(db=db, class_id=class_id, class_data=class_data)

@app.delete("/api/classes/{class_id}")
def delete_class(
    class_id: int = Path(..., title="The ID of the class to delete"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to delete this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this class"
        )
    
    success = crud.delete_class(db=db, class_id=class_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete class")
    
    return {"message": "Class deleted successfully"}

# Class enrollment endpoints
@app.post("/api/classes/{class_id}/students/{student_id}")
def enroll_student(
    class_id: int = Path(..., title="The ID of the class"),
    student_id: int = Path(..., title="The ID of the student to enroll"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to manage this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this class"
        )
    
    success = crud.enroll_student_in_class(db=db, class_id=class_id, student_id=student_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to enroll student")
    
    return {"message": "Student enrolled successfully"}

@app.delete("/api/classes/{class_id}/students/{student_id}")
def unenroll_student(
    class_id: int = Path(..., title="The ID of the class"),
    student_id: int = Path(..., title="The ID of the student to unenroll"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to manage this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this class"
        )
    
    success = crud.unenroll_student_from_class(db=db, class_id=class_id, student_id=student_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to unenroll student")
    
    return {"message": "Student unenrolled successfully"}

@app.get("/api/classes/{class_id}/students", response_model=List[schemas.ClassStudentResponse])
def read_class_students(
    class_id: int = Path(..., title="The ID of the class"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to view this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this class"
        )
    
    return crud.get_class_students(db=db, class_id=class_id, skip=skip, limit=limit)

# Case assignment endpoints
@app.post("/api/classes/{class_id}/assignments", response_model=schemas.CaseAssignment)
def create_case_assignment(
    class_id: int,
    assignment_data: schemas.CaseAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to manage this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this class"
        )
    
    # Verify the assignment is for this class
    if assignment_data.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment class_id must match the URL class_id"
        )
    
    return crud.create_case_assignment(db=db, assignment_data=assignment_data)

@app.get("/api/classes/{class_id}/assignments", response_model=List[schemas.CaseAssignmentWithDetails])
def read_class_assignments(
    class_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to view this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this class"
        )
    
    return crud.get_class_assignments(
        db=db,
        class_id=class_id,
        skip=skip,
        limit=limit,
        status=status
    )

@app.put("/api/classes/{class_id}/assignments/{assignment_id}", response_model=schemas.CaseAssignment)
def update_case_assignment(
    class_id: int,
    assignment_id: int,
    assignment_data: schemas.CaseAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to manage this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this class"
        )
    
    db_assignment = crud.get_case_assignment(db=db, assignment_id=assignment_id)
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Verify the assignment belongs to this class
    if db_assignment.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment does not belong to this class"
        )
    
    return crud.update_case_assignment(
        db=db,
        assignment_id=assignment_id,
        assignment_data=assignment_data
    )

@app.delete("/api/classes/{class_id}/assignments/{assignment_id}")
def delete_case_assignment(
    class_id: int = Path(..., title="The ID of the class"),
    assignment_id: int = Path(..., title="The ID of the assignment to delete"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_class = crud.get_class(db=db, class_id=class_id)
    if db_class is None:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Verify the user has permission to manage this class
    if current_user.role != "admin" and db_class.faculty_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this class"
        )
    
    db_assignment = crud.get_case_assignment(db=db, assignment_id=assignment_id)
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Verify the assignment belongs to this class
    if db_assignment.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment does not belong to this class"
        )
    
    success = crud.delete_case_assignment(db=db, assignment_id=assignment_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete assignment")
    
    return {"message": "Assignment deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
