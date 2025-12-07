from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Dict
import os
from datetime import datetime, timedelta
import secrets
import uuid

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user
from ..models import UserRole
from .. import crud

router = APIRouter(
    prefix="/medical-cases",
    tags=["medical-cases"],
)

UPLOAD_DIR = "uploads/medical_cases"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Store temporary tokens with expiration (in memory for now)
_temp_tokens: Dict[str, tuple[int, datetime]] = {}

@router.get("/", response_model=List[schemas.MedicalCase])
async def list_medical_cases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    is_public: Optional[bool] = None,
    difficulty: Optional[str] = None,
    created_by: Optional[int] = None
):
    """
    List medical cases based on user role and filters:
    - Admins see all cases
    - Faculty see public cases and their own cases
    - Students see public cases and cases assigned to them
    """
    query = db.query(models.MedicalCase).filter(models.MedicalCase.is_active == True)

    # Apply role-based filtering
    if current_user.role != UserRole.admin:
        if current_user.role == UserRole.faculty:
            # Faculty sees public cases and their own cases
            query = query.filter(
                or_(
                    models.MedicalCase.is_public == True,
                    models.MedicalCase.created_by == current_user.id,
                    models.CaseAssignment.faculty_id == current_user.id
                )
            ).outerjoin(models.CaseAssignment).distinct()
        else:  # student
            # Students see public cases and cases assigned to them
            query = query.filter(
                or_(
                    models.MedicalCase.is_public == True,
                    models.CaseAssignment.student_id == current_user.id
                )
            ).outerjoin(models.CaseAssignment).distinct()

    # Apply filters
    if search:
        query = query.filter(
            or_(
                models.MedicalCase.title.ilike(f"%{search}%"),
                models.MedicalCase.description.ilike(f"%{search}%")
            )
        )
    if is_public is not None:
        query = query.filter(models.MedicalCase.is_public == is_public)
    if difficulty:
        query = query.filter(models.MedicalCase.difficulty == difficulty)
    if created_by:
        query = query.filter(models.MedicalCase.created_by == created_by)

    # Apply pagination
    total = query.count()
    cases = query.offset(skip).limit(limit).all()

    # Add total count to response headers
    return cases


@router.get("/admin/all", response_model=List[schemas.MedicalCase])
async def list_all_medical_cases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    include_inactive: bool = Query(False),
    include_private: bool = Query(True),
):
    """
    Admin-only: return all medical cases without role filtering.
    Optional query params let you include inactive and/or only public cases.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access the full case listing",
        )

    query = db.query(models.MedicalCase)

    if not include_inactive:
        query = query.filter(models.MedicalCase.is_active == True)

    if not include_private:
        query = query.filter(models.MedicalCase.is_public == True)

    return query.order_by(models.MedicalCase.created_at.desc()).all()

@router.post("/", response_model=schemas.MedicalCase)
async def create_medical_case(
    case: schemas.MedicalCaseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new medical case:
    - Admins can create public or private cases
    - Faculty can create private cases
    - Students cannot create cases
    """
    if current_user.role == UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot create medical cases"
        )

    # Only admins can create public cases
    if case.is_public and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create public cases"
        )

    db_case = models.MedicalCase(
        **case.dict(),
        created_by=current_user.id
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

@router.get("/{case_id}", response_model=schemas.MedicalCase)
async def get_medical_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific medical case if the user has access to it"""
    case = db.query(models.MedicalCase).filter(
        models.MedicalCase.id == case_id,
        models.MedicalCase.is_active == True
    ).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Medical case not found")
    
    if not case.can_access(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this case"
        )
    
    return case

@router.put("/{case_id}", response_model=schemas.MedicalCase)
async def update_medical_case(
    case_id: int,
    case_update: schemas.MedicalCaseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a medical case:
    - Admins can update any case
    - Faculty can update their own cases
    - Students cannot update cases
    """
    db_case = db.query(models.MedicalCase).filter(
        models.MedicalCase.id == case_id,
        models.MedicalCase.is_active == True
    ).first()
    
    if not db_case:
        raise HTTPException(status_code=404, detail="Medical case not found")
    
    # Check permissions
    if current_user.role == UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot update cases"
        )
    
    if current_user.role == UserRole.faculty and db_case.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own cases"
        )
    
    # Only admins can change public status
    if case_update.is_public is not None and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change case public status"
        )

    # Update fields
    for field, value in case_update.dict(exclude_unset=True).items():
        setattr(db_case, field, value)
    
    db.commit()
    db.refresh(db_case)
    return db_case

@router.delete("/{case_id}")
async def delete_medical_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Soft delete a medical case:
    - Admins can delete any case
    - Faculty can delete their own cases
    - Students cannot delete cases
    """
    db_case = db.query(models.MedicalCase).filter(
        models.MedicalCase.id == case_id,
        models.MedicalCase.is_active == True
    ).first()
    
    if not db_case:
        raise HTTPException(status_code=404, detail="Medical case not found")
    
    # Check permissions
    if current_user.role == UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot delete cases"
        )
    
    if current_user.role == UserRole.faculty and db_case.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own cases"
        )

    # Soft delete
    db_case.is_active = False
    db.commit()
    return {"message": "Case deleted successfully"}

@router.post("/assign", response_model=schemas.UserMedicalCase)
def assign_case_to_student(
    case_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty can assign cases")

    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")

    case = db.query(models.MedicalCase).filter(models.MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    assignment = models.UserMedicalCase(
        user_id=student_id,
        case_id=case_id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/{case_id}/get-token")
def get_case_token(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Generate a temporary token for accessing case content"""
    # Verify case exists and user has access
    case = db.query(models.MedicalCase).filter(models.MedicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if not case.can_access(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    
    # Generate token and store with 5 minute expiration
    token = secrets.token_urlsafe(32)
    _temp_tokens[token] = (case_id, datetime.utcnow() + timedelta(minutes=5))
    
    return {"token": token}

@router.get("/token/{token}/content")
def get_case_content_by_token(
    token: str,
    session_id: str = Query(None),  # Get session_id from query params
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get case content using a temporary token"""
    # Verify token exists and hasn't expired
    if token not in _temp_tokens:
        raise HTTPException(status_code=404, detail="Token not found")
    
    case_id, expiry = _temp_tokens[token]
    if datetime.utcnow() > expiry:
        del _temp_tokens[token]
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Get case and verify access
    case = db.query(models.MedicalCase).filter(models.MedicalCase.id == case_id).first()
    if not case or not case.can_access(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    
    # Remove used token
    del _temp_tokens[token]
    
    # Check if this is a virtual patient case and create session if needed
    response = {"content": case.content}
    
    # If we have a session_id, create a virtual patient session
    if session_id:
        try:
            # Create virtual patient session for tracking
            session = crud.create_virtual_patient_session(
                db=db,
                user_id=current_user.id,
                case_id=case.id,
                session_id=session_id,
                status="ACTIVE"
            )
            response["session_id"] = session_id
            response["session_status"] = session.status
        except Exception as e:
            # Log the error but don't fail the request
            print(f"Error creating virtual patient session: {e}")
    
    return response 