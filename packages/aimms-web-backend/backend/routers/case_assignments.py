from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from sqlalchemy import or_, select, outerjoin
from pydantic import BaseModel

from ..database import get_db
from ..models import CaseAssignment, MedicalCase, User as UserModel, VirtualPatientSession, AIMHEIReport
from ..auth import get_current_user
from ..schemas import (
    CaseAssignmentCreate,
    StudentCaseAssignmentResponse,
    FacultyCaseAssignmentResponse,
    ImprovedStudentCaseAssignmentResponse,
    User,
    CaseMetadata
)

router = APIRouter(
    prefix="/case-assignments",
    tags=["case assignments"]
)

# New schema for bulk assignments
class BulkCaseAssignmentCreate(BaseModel):
    case_id: int
    class_id: int
    student_ids: List[int]
    due_date: Optional[datetime]

# New schema for bulk assignment response
class BulkCaseAssignmentResponse(BaseModel):
    success: bool
    message: str
    assignments: List[FacultyCaseAssignmentResponse]
    errors: Optional[List[dict]] = None

@router.post("/", response_model=FacultyCaseAssignmentResponse)
def assign_case(
    assignment: CaseAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Verify current user is faculty
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can assign cases"
        )
    
    # Verify case exists
    case = db.query(MedicalCase).filter(MedicalCase.id == assignment.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Verify student exists and has student role
    student = db.query(UserModel).filter(
        UserModel.id == assignment.student_id,
        UserModel.role == "student"
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Create assignment
    db_assignment = CaseAssignment(
        case_id=assignment.case_id,
        student_id=assignment.student_id,
        faculty_id=current_user.id,
        due_date=assignment.due_date
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    # Fetch the complete assignment with relationships
    complete_assignment = db.query(CaseAssignment).options(
        joinedload(CaseAssignment.case),
        joinedload(CaseAssignment.student),
        joinedload(CaseAssignment.faculty)
    ).filter(CaseAssignment.id == db_assignment.id).first()
    
    return complete_assignment

@router.get("/student", response_model=List[ImprovedStudentCaseAssignmentResponse])
async def get_student_assignments(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get all case assignments for the current student.
    Only returns active (non-expired) assignments.
    """
    # Verify current user is a student
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their assignments"
        )
    
    current_utc = datetime.utcnow()
    
    # Get all assignments for the student with only necessary relationships
    assignments = db.query(CaseAssignment).options(
        joinedload(CaseAssignment.case).load_only(
            MedicalCase.id,
            MedicalCase.title,
            MedicalCase.learning_objectives
        ),
        joinedload(CaseAssignment.faculty).load_only(
            UserModel.id,
            UserModel.email
        )
    ).filter(
        CaseAssignment.student_id == current_user.id,
        or_(
            CaseAssignment.due_date == None,  # Include assignments with no due date
            CaseAssignment.due_date > current_utc  # Only include non-expired assignments
        )
    ).order_by(CaseAssignment.assigned_date.desc()).all()
    
    return assignments

class OptimizedFacultyCaseAssignmentResponse(BaseModel):
    id: int
    due_date: Optional[datetime]
    assigned_date: datetime
    case: CaseMetadata
    student: User
    faculty: Optional[User]
    status: Optional[str]
    report_id: Optional[int]

    class Config:
        orm_mode = True

@router.get("/faculty/", response_model=List[OptimizedFacultyCaseAssignmentResponse])
def get_faculty_assignments(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Verify current user is faculty
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can view their assignments"
        )
    
    # Get all assignments created by the faculty with only necessary relationships and fields
    assignments = db.query(
        CaseAssignment,
        VirtualPatientSession.status.label('session_status'),
        AIMHEIReport.id.label('report_id')
    ).options(
        joinedload(CaseAssignment.case).load_only(
            MedicalCase.id,
            MedicalCase.title
        ),
        joinedload(CaseAssignment.student).load_only(
            UserModel.id,
            UserModel.email,
            UserModel.name
        ),
        joinedload(CaseAssignment.faculty).load_only(
            UserModel.id,
            UserModel.email,
            UserModel.name
        )
    ).outerjoin(
        VirtualPatientSession,
        (VirtualPatientSession.user_id == CaseAssignment.student_id) & 
        (VirtualPatientSession.case_id == CaseAssignment.case_id)
    ).outerjoin(
        AIMHEIReport,
        AIMHEIReport.session_id == VirtualPatientSession.id
    ).filter(
        CaseAssignment.faculty_id == current_user.id
    ).order_by(CaseAssignment.assigned_date.desc()).all()
    
    # Transform the results to match the response model
    return [
        OptimizedFacultyCaseAssignmentResponse(
            id=assignment.CaseAssignment.id,
            due_date=assignment.CaseAssignment.due_date,
            assigned_date=assignment.CaseAssignment.assigned_date,
            case=assignment.CaseAssignment.case,
            student=assignment.CaseAssignment.student,
            faculty=assignment.CaseAssignment.faculty,
            status=assignment.session_status,
            report_id=assignment.report_id
        )
        for assignment in assignments
    ]

@router.get("/users/{user_id}/details", response_model=User)
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.post("/bulk", response_model=BulkCaseAssignmentResponse)
def bulk_assign_case(
    assignment: BulkCaseAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Assign a case to multiple students at once.
    Returns a list of successful assignments and any errors that occurred.
    """
    # Verify current user is faculty
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can assign cases"
        )
    
    # Verify case exists
    case = db.query(MedicalCase).filter(MedicalCase.id == assignment.case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Get all students in one query
    students = db.query(UserModel).filter(
        UserModel.id.in_(assignment.student_ids),
        UserModel.role == "student"
    ).all()
    
    # Create a set of found student IDs for quick lookup
    found_student_ids = {student.id for student in students}
    
    # Track successful assignments and errors
    successful_assignments = []
    errors = []
    
    # Process each student
    for student_id in assignment.student_ids:
        try:
            if student_id not in found_student_ids:
                errors.append({
                    "student_id": student_id,
                    "error": "Student not found or not a student"
                })
                continue
            
            # Create assignment (no duplicate check - allow reassignment)
            db_assignment = CaseAssignment(
                case_id=assignment.case_id,
                class_id=assignment.class_id,
                student_id=student_id,
                faculty_id=current_user.id,
                due_date=assignment.due_date
            )
            db.add(db_assignment)
            successful_assignments.append(db_assignment)
            
        except Exception as e:
            errors.append({
                "student_id": student_id,
                "error": str(e)
            })
    
    # Commit all successful assignments
    if successful_assignments:
        db.commit()
        
        # After commit, fetch the complete assignments with relationships
        complete_assignments = []
        for assignment in successful_assignments:
            complete_assignment = db.query(CaseAssignment).options(
                joinedload(CaseAssignment.case),
                joinedload(CaseAssignment.student),
                joinedload(CaseAssignment.faculty)
            ).filter(CaseAssignment.id == assignment.id).first()
            if complete_assignment:
                complete_assignments.append(complete_assignment)
    
    return BulkCaseAssignmentResponse(
        success=len(successful_assignments) > 0,
        message=f"Successfully assigned case to {len(successful_assignments)} students. {len(errors)} errors occurred.",
        assignments=complete_assignments if successful_assignments else [],
        errors=errors if errors else None
    ) 