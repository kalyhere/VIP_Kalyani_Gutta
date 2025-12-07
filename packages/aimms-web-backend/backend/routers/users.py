from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user, hash_password, get_current_active_user

# App-based permissions removed - using role-based access only

# Add new request model for POST request
class FacultyStudentsRequest(BaseModel):
    class_id: Optional[int] = None

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/register", response_model=schemas.User)
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Register a new user directly (admin-only).
    Regular users should use the invitation-based registration flow.
    """
    # Only admins can directly create users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can directly create users. Please use the invitation link sent to your email."
        )

    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password before storing it
    hashed_pw = hash_password(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pw,
        is_active=user_data.is_active,
        role=user_data.role,
        name=user_data.name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # App-based permissions removed - using role-based access only

    return new_user

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/list", response_model=List[schemas.User])
def list_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(models.User).all()
    return users

# App management endpoints removed - using role-based access only

@router.get("/student/stats")
async def get_user_student_stats(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get student statistics for the current user."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    # Get total assignments
    total_assigned = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == current_user.id
    ).count()
    
    # Get completed assignments (with reports)
    completed = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == current_user.id,
        models.CaseAssignment.report_id.isnot(None)
    ).count()
    
    # Get average score from reports
    avg_score_result = db.query(
        func.avg(models.AIMHEIReport.percentage_score)
    ).join(
        models.CaseAssignment, models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == current_user.id,
        models.AIMHEIReport.percentage_score.isnot(None)
    ).scalar()
    
    average_score = round(avg_score_result or 0.0, 1)
    
    # Get pending reports (reports that are completed but not yet reviewed/finalized)
    pending_reports = db.query(models.CaseAssignment).join(
        models.AIMHEIReport, models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == current_user.id,
        models.CaseAssignment.status == "pending_review"
    ).count()
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name or current_user.email.split('@')[0],
        "role": current_user.role.value,
        "stats": {
            "totalAssigned": total_assigned,
            "completed": completed,
            "averageScore": average_score,
            "pendingReports": pending_reports,
        }
    }

@router.get("/faculty/students", response_model=List[schemas.FacultyStudentResponse])
@router.post("/faculty/students", response_model=List[schemas.FacultyStudentResponse])
async def get_faculty_students(
    request: Optional[FacultyStudentsRequest] = Body(None),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    class_id: Optional[int] = None
):
    """Get all students assigned to the current faculty member."""
    if current_user.role != "faculty" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can access this endpoint"
        )
    
    # Get class_id from either POST body or query parameter
    class_id = request.class_id if request else class_id
    
    # Get students through class enrollment instead of faculty_id
    if class_id is not None:
        # Verify the class exists and belongs to the faculty
        class_exists = db.query(models.Class).filter(
            models.Class.id == class_id,
            models.Class.faculty_id == current_user.id
        ).first()
        
        if not class_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found or not authorized"
            )
        
        # Get students enrolled in this specific class
        enrolled_student_ids = db.execute(
            models.class_enrollment.select().where(
                models.class_enrollment.c.class_id == class_id,
                models.class_enrollment.c.is_active == True
            )
        ).fetchall()
        
        student_ids = [enrollment.user_id for enrollment in enrolled_student_ids]
        
        students = db.query(models.User).filter(
            models.User.id.in_(student_ids),
            models.User.role == "student"
        ).all()
    else:
        # Get students from ALL classes taught by this faculty member
        faculty_classes = db.query(models.Class).filter(
            models.Class.faculty_id == current_user.id,
            models.Class.is_active == True
        ).all()
        
        # Get students enrolled in any of those classes
        all_student_ids = []
        for cls in faculty_classes:
            enrolled = db.execute(
                models.class_enrollment.select().where(
                    models.class_enrollment.c.class_id == cls.id,
                    models.class_enrollment.c.is_active == True
                )
            ).fetchall()
            all_student_ids.extend([enrollment.user_id for enrollment in enrolled])
        
        # Remove duplicates and query students
        unique_student_ids = list(set(all_student_ids))
        
        if not unique_student_ids:
            students = []
        else:
            students = db.query(models.User).filter(
                models.User.id.in_(unique_student_ids),
                models.User.role == "student"
            ).all()
    
    # For each student, get their active case assignments for the current class
    result = []
    current_time = datetime.utcnow()
    for student in students:
        # Get active assignments for the current class
        assignments = db.query(models.CaseAssignment).filter(
            models.CaseAssignment.student_id == student.id,
            models.CaseAssignment.class_id == class_id,
            or_(
                models.CaseAssignment.due_date == None,  # No due date
                models.CaseAssignment.due_date > current_time  # Not expired
            )
        ).all()
        
        # Create the student response with simplified case assignments
        student_response = {
            "id": student.id,
            "email": student.email,
            "name": student.name,
            "is_active": student.is_active,
            "case_assignments": [
                {
                    "caseId": assignment.case_id,
                    "title": assignment.case.title
                }
                for assignment in assignments
            ]
        }
        result.append(student_response)
    
    return result

# DEPRECATED: Direct faculty-student assignment endpoints
# These endpoints are no longer used since students are now related to faculty through class enrollment
# rather than direct faculty_id assignment. Class enrollment provides more flexibility for students
# to be in multiple classes with different faculty members.

# @router.post("/faculty/students/{student_id}", status_code=status.HTTP_200_OK)
# async def assign_student_to_faculty(
#     student_id: int,
#     current_user: models.User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """Assign a student to the current faculty member."""
#     if current_user.role != "faculty":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only faculty members can assign students"
#         )
#     
#     student = db.query(models.User).filter(
#         models.User.id == student_id,
#         models.User.role == "student"
#     ).first()
#     
#     if not student:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Student not found"
#         )
#     
#     if student.faculty_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Student is already assigned to a faculty member"
#         )
#     
#     student.faculty_id = current_user.id
#     db.commit()
#     return {"message": "Student assigned successfully"}

# @router.delete("/faculty/students/{student_id}", status_code=status.HTTP_200_OK)
# async def unassign_student_from_faculty(
#     student_id: int,
#     current_user: models.User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """Remove a student from the current faculty member."""
#     if current_user.role != "faculty":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only faculty members can unassign students"
#         )
#     
#     student = db.query(models.User).filter(
#         models.User.id == student_id,
#         models.User.faculty_id == current_user.id
#     ).first()
#     
#     if not student:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Student not found or not assigned to you"
#         )
#     
#     student.faculty_id = None
#     db.commit()
#     return {"message": "Student unassigned successfully"}

@router.get("/faculty/stats")
async def get_faculty_stats(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get statistics for the current faculty member."""
    if current_user.role != "faculty" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can access this endpoint"
        )
    
    # Get total students from classes taught by this faculty
    faculty_classes = db.query(models.Class).filter(
        models.Class.faculty_id == current_user.id,
        models.Class.is_active == True
    ).all()
    
    # Get unique students enrolled in any of those classes
    all_student_ids = []
    for cls in faculty_classes:
        enrolled = db.execute(
            models.class_enrollment.select().where(
                models.class_enrollment.c.class_id == cls.id,
                models.class_enrollment.c.is_active == True
            )
        ).fetchall()
        all_student_ids.extend([enrollment.user_id for enrollment in enrolled])
    
    # Remove duplicates to get total unique students
    total_students = len(set(all_student_ids))
    
    # Get active cases (assignments with due dates in the future)
    active_cases = db.query(func.count(models.CaseAssignment.id)).filter(
        models.CaseAssignment.faculty_id == current_user.id,
        or_(
            models.CaseAssignment.due_date == None,
            models.CaseAssignment.due_date > datetime.utcnow()
        )
    ).scalar()
    
    # Get total cases (all assignments)
    total_cases = db.query(func.count(models.CaseAssignment.id)).filter(
        models.CaseAssignment.faculty_id == current_user.id
    ).scalar()
    
    # Calculate average completion rate
    completed_cases = db.query(func.count(models.CaseAssignment.id)).join(
        models.VirtualPatientSession,
        and_(
            models.VirtualPatientSession.user_id == models.CaseAssignment.student_id,
            models.VirtualPatientSession.case_id == models.CaseAssignment.case_id
        )
    ).filter(
        models.CaseAssignment.faculty_id == current_user.id,
        models.VirtualPatientSession.status == models.VirtualPatientSessionStatus.COMPLETED
    ).scalar()
    
    average_completion = 0
    if total_cases > 0:
        average_completion = round((completed_cases / total_cases) * 100)
    
    return {
        "name": current_user.name or current_user.email,
        "email": current_user.email,
        "department": "Medical Education",  # This could be added to the User model if needed
        "role": "Clinical Instructor",  # This could be added to the User model if needed
        "stats": {
            "totalStudents": total_students,
            "activeCases": active_cases,
            "totalCases": total_cases,
            "averageCompletion": average_completion
        }
    } 