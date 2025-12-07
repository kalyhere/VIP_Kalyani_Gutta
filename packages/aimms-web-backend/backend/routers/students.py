from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, case
from typing import List, Optional
from datetime import datetime, timedelta
import os
import secrets

from ..database import get_db
from ..models import User, Class, CaseAssignment, MedicalCase, AIMHEIReport, VirtualPatientSession, class_enrollment
from ..auth import get_current_user
from ..schemas import (
    StudentProgress,
    StudentUser,
    StudentStats, 
    StudentClass,
    StudentCaseAssignmentDetail,
    CaseAssignmentUpdate
)
from .. import crud
from .token_storage import store_token, get_token_count

router = APIRouter(
    prefix="/students",
    tags=["students"]
)

@router.get("/stats", response_model=StudentUser)
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get student statistics and profile information.
    

    Parameters:
    - current_user: The currently authenticated user that using the system.
    - db: The database session that is being used.

    
    Returns:
    - StudentUser: Student profile with statistics including:
        - id: The ID of the student.
        - email: The email of the student.
        - name: The name of the student.
        - hashed_password: The hashed password of the student (not returned in response).
        - is_active: Whether the student is active or not.
        - role: The role of the student.
        - stats: A dictionary containing statistics about the student's performance including:
            - total_assignments: Total number of assignments the student has.
            - completed_assignments: Number of assignments the student has completed with reports.
            - average_ score: Average score from the student's reports.
            - pending_reports: Number of assignments with pending (completed but not in review/finalized yet) reports.


    Raises:
    - HTTPException: 403 Forbidden if the user is not a student.

    
    Example Response:
        {
            "id": 1,
            "email": "student@example.com",
            "name": "John Doe",
            "role": "student",
            "stats": {
          }
        }
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    stats = crud.get_student_stats(db, current_user.id)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name or current_user.email.split('@')[0],
        "role": current_user.role.value,
        "stats": stats
    }

@router.get("/classes", response_model=List[StudentClass])
async def get_student_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all of the student's current classes.
    

    Parameters:
    - current_user: The currently authenticated user that using the system.
    - db: The database session that is being used.

    
    Returns:
    - List[StudentClass]: A list of classes that the student is enrolled in, including:
        "id": The ID of the class.
        "name": The name of the class.
        "code": The code of the class.
        "term": The term the student is enrolled in.
        "faculty_name": The name of the faculty member for the class.
        "faculty_email": The email of the faculty member for the class.
        "assignedCases": The number of cases assigned to the student in this class.
        "completedCases": The number of cases the student has completed in this class.
        "pendingReports": The number of assignments with pending reports in this class.

        
    Raises:
    - HTTPException: 403 Forbidden if the user is not a student.

    
    Example Response:
            {
                "id": 1
                "name": "Class A"
                "code": "CA101"
                "term": "Fall 2025"
                "faculty_name": "Dr. Smith",
                "faculty_email": drsmith@example.com
                "assignedCases": 10
                "completedCases": 4
                "pendingReports": 5
            }
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    classes = crud.get_student_classes(db, current_user.id)
    
    result = []
    for class_obj in classes:
        # Count assignments for this class
        class_assignments = crud.get_student_assignments(db, current_user.id, class_obj.id)
        
        assigned_cases = len(class_assignments)
        completed_cases = sum(1 for a in class_assignments if a.report_id is not None)
        actionable_assignments = sum(1 for a in class_assignments if a.status in ["not_started", "in_progress"])
        
        student_class = {
            "id": class_obj.id,
            "name": class_obj.name,
            "code": class_obj.code,
            "term": class_obj.term,
            "faculty_name": class_obj.faculty.name if class_obj.faculty else None,
            "faculty_email": class_obj.faculty.email if class_obj.faculty else None,
            "assignedCases": assigned_cases,
            "completedCases": completed_cases,
            "pendingReports": actionable_assignments,
        }
        result.append(student_class)
    
    return result

@router.get("/assignments", response_model=dict)
@router.get("/assignments/{class_id}", response_model=dict)
async def get_student_assignments(
    class_id: Optional[int] = None,
    page: int = Query(0, ge=0, description="Page number (0-indexed)"),
    limit: int = Query(5, ge=1, le=100, description="Number of items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by status: not_started, in_progress, pending_review, reviewed, actionable"),
    due_date_filter: Optional[str] = Query(None, description="Filter by due date: future, past"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get assignments for the current student, optionally filtered by class, with pagination support.

    Parameters:
    - class_id: Optional class ID to filter assignments by class.
    - page: Page number (0-indexed), defaults to 0
    - limit: Number of items per page (1-100), defaults to 5
    - current_user: The currently authenticated user that using the system.
    - db: The database session that is being used.


    Returns:
    - dict: Paginated response containing:
        - data: List of StudentCaseAssignmentDetail objects
        - total: Total number of assignments (before pagination)
        - page: Current page number
        - limit: Items per page

    Each assignment in the data list includes:
        - assignmentId: The ID of the assignment.
        - caseId: The ID of the case.
        - caseTitle: The title of the case.
        - classId: The ID of the class.
        - className: The name of the class.
        - facultyName: The name of the faculty member.
        - dueDate: The due date of the assignment.
        - status: The status of the assignment (e.g., not_started, in_progress, reviewed).
        - reportId: The ID of the report associated with the assignment.
        - score: The score received on the report.
        - assignedDate: The date the assignment was made.
        - submittedDate: The date the report was submitted.
        - learning_objectives: A list of learning objectives for the case.
        - description: A description of the case.

        
    Raises:
    - HTTPException: 403 Forbidden if the user is not a student.

    
    Example Response:
        [
            {
                "assignmentId": 1,
                "caseId": 1,
                "caseTitle": "Case A",
                "classId": 1,
                "className": "Class A",
                "facultyName": "Dr. Smith",
                "dueDate": "2025-12-01T00:00:00Z",
                "status": "not_started",
                "reportId": null,
                "score": null,
                "assignedDate": "2025-11-01T00:00:00Z",
                "submittedDate": null,
                "learning_objectives": ["Objective 1", "Objective 2"],
                "description": "Description of Case A"
            }
        ]
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )

    # Get all assignments with filters applied
    all_assignments = crud.get_student_assignments(db, current_user.id, class_id)

    # Apply status filter
    if status_filter and status_filter != "all":
        if status_filter == "actionable":
            # Actionable = not_started or pending_review
            all_assignments = [a for a in all_assignments if a.status in ["not_started", "pending_review"]]
        else:
            all_assignments = [a for a in all_assignments if a.status == status_filter]

    # Apply due date filter
    if due_date_filter and due_date_filter != "all":
        from datetime import datetime
        now = datetime.utcnow()
        if due_date_filter == "future":
            all_assignments = [a for a in all_assignments if a.due_date and a.due_date > now]
        elif due_date_filter == "past":
            all_assignments = [a for a in all_assignments if a.due_date and a.due_date < now]

    total = len(all_assignments)

    # Apply pagination
    offset = page * limit
    paginated_assignments = all_assignments[offset:offset + limit]

    result = []
    for assignment in paginated_assignments:
        student_assignment = {
            "assignmentId": assignment.id,
            "caseId": assignment.case_id,
            "caseTitle": assignment.case.title if assignment.case else "Unknown Case",
            "classId": assignment.class_id,
            "className": assignment.class_.name if assignment.class_ else "Unknown Class",
            "facultyName": assignment.faculty.name if assignment.faculty else None,
            "dueDate": assignment.due_date.isoformat() if assignment.due_date else None,
            "status": assignment.status,
            "reportId": assignment.report_id,
            "score": assignment.report.percentage_score if assignment.report else None,
            "assignedDate": assignment.assigned_date.isoformat(),
            "submittedDate": assignment.report.created_at.isoformat() if assignment.report else None,
            "learning_objectives": assignment.case.learning_objectives if assignment.case else [],
            "description": assignment.case.description if assignment.case else None,
        }
        result.append(student_assignment)

    return {
        "data": result,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.post("/assignments/{assignment_id}/launch")
async def launch_virtual_patient(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Launch virtual patient for a specific assignment using reusable token-based approach."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can launch virtual patients"
        )
    
    # Get the assignment and verify it belongs to the student
    assignment = crud.get_student_assignment(db, assignment_id, current_user.id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found or not assigned to you"
        )
    
    # Check if assignment is already completed or past due date
    if assignment.status in ["reviewed", "pending_review"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is already completed"
        )
    
    # Check if assignment is past due date
    if assignment.due_date and datetime.utcnow() > assignment.due_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is past due date"
        )
    
    # DO NOT update assignment status here - it should only be updated when a session is actually created
    # The assignment status will be updated to "in_progress" in the register-session endpoint
    # when the Virtual Patient backend creates and registers a session
    
    # Generate new reusable token for this assignment
    launch_token = secrets.token_urlsafe(32)
    token_expires = assignment.due_date or datetime.utcnow() + timedelta(days=365)  # No expiry if no due date
    
    # Store token with assignment and case information using the new token storage
    launch_data = {
        "assignment_id": assignment_id,
        "case_id": assignment.case_id,
        "user_id": current_user.id,
        "student_name": current_user.name or current_user.email,
        "student_email": current_user.email,
        "case_title": assignment.case.title if assignment.case else "Unknown Case",
        "case_description": assignment.case.description if assignment.case else "",
        "case_learning_objectives": assignment.case.learning_objectives if assignment.case else [],
        "reusable": True,  # Indicates this token can be used multiple times
        "assignment_due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        "has_previous_sessions": False,  # Will be updated if sessions exist
        "latest_session_id": None  # Will be updated if sessions exist
    }
    
    # Check for existing ACTIVE virtual patient sessions for this assignment
    # Only ACTIVE sessions should trigger resumption - COMPLETED sessions should start fresh
    try:
        existing_active_session = db.query(VirtualPatientSession).filter(
            VirtualPatientSession.assignment_id == assignment_id,
            VirtualPatientSession.user_id == current_user.id,
            VirtualPatientSession.status == "ACTIVE"  # Only look for active sessions
        ).order_by(VirtualPatientSession.last_activity.desc()).first()
        
        if existing_active_session:
            launch_data["has_previous_sessions"] = True
            launch_data["latest_session_id"] = existing_active_session.session_id
    except Exception as e:
        print(f"Error checking for existing active sessions: {e}")
    
    # Store the token using the database-backed storage system
    store_token(launch_token, launch_data, db)
    
    # DEBUG: Log token creation
    print(f"🚀 DEBUG launch: Created token: {launch_token}")
    print(f"🚀 DEBUG launch: Total tokens now: {get_token_count(db)}")
    
    # Get the virtual patient URL from environment or use default
    virtual_patient_url = os.getenv("VIRTUAL_PATIENT_URL", "http://localhost:5174")
    
    launch_url = f"{virtual_patient_url}/?token={launch_token}"
    print(f"🚀 DEBUG: Generated launch URL: {launch_url}")
    print(f"🔑 DEBUG: Launch token: {launch_token}")
    
    return {
        "launchUrl": launch_url,
        "token": launch_token,
        "expiresAt": token_expires.isoformat() if token_expires else None,
        "canResume": True,
        "assignmentStatus": assignment.status
    }

@router.get("/sessions/{session_id}/status")
async def get_session_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status of a virtual patient session."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access session status"
        )
    
    session = crud.get_student_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    return {
        "status": session.status,
        "reportId": session.report.id if session.report else None,
        "score": session.report.percentage_score if session.report else None,
    }

@router.get("/reports/{report_id}")
async def get_student_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a student's report (read-only)."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access their reports"
        )
    
    report = crud.get_student_report(db, report_id, current_user.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or not owned by you"
        )
    
    return {
        "id": report.id,
        "totalPointsEarned": report.total_points_earned,
        "totalPointsPossible": report.total_points_possible,
        "percentageScore": report.percentage_score,
        "informationSectionScore": report.information_section_score,
        "skillSectionScore": report.skill_section_score,
        "medicalTerminologyScore": report.medical_terminology_score,
        "politenessScore": report.politeness_score,
        "empathyScore": report.empathy_score,
        "unacceptableAreas": report.unacceptable_areas,
        "improvementAreas": report.improvement_areas,
        "sectionSummaries": report.section_summaries,
        "rubricDetail": report.rubric_detail,
        "createdAt": report.created_at.isoformat(),
        "status": report.status,
    }

@router.get("/cases/{case_id}")
async def get_student_case_details(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get case details for a student (only if they're assigned to it)."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access case details"
        )
    
    # Verify the student has an assignment for this case
    assignment = db.query(CaseAssignment).filter(
        CaseAssignment.case_id == case_id,
        CaseAssignment.student_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found or not assigned to you"
        )
    
    # Get the case details
    case = crud.get_medical_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    return {
        "id": case.id,
        "title": case.title,
        "description": case.description,
        "learning_objectives": case.learning_objectives,
        "content": case.content,
        "assignmentId": assignment.id,
        "assignmentStatus": assignment.status,
        "dueDate": assignment.due_date.isoformat() if assignment.due_date else None,
    }

@router.get("/progress", response_model=StudentProgress)
async def get_student_progress(
    time_period: str = Query("month", regex="^(week|month|year)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    '''Get student progress over time'''
    try:
        progress = crud.get_student_progress(db, current_user.id, time_period)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
