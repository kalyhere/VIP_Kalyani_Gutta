# Token storage module for virtual patient launch tokens
# Uses case_assignments table directly - much simpler!

from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from .. import models

def store_token(token: str, data: dict, db: Session) -> None:
    """Store a launch token directly in the assignment record."""
    from datetime import timedelta, datetime
    
    assignment_id = data["assignment_id"]
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise ValueError(f"Assignment {assignment_id} not found")
    
    # Store the provided token (don't generate a new one!)
    assignment.current_launch_token = token
    assignment.token_created_at = datetime.utcnow()
    assignment.token_expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    
    # Clean up expired tokens while we're here
    cleanup_expired_tokens(db)
    
    print(f"🔐 TOKEN STORE SIMPLE: Stored token {token[:8]}... for assignment {assignment_id}")
    print(f"🔐 TOKEN STORE SIMPLE: Total active tokens: {get_token_count(db)}")

def get_token(token: str, db: Session) -> Optional[dict]:
    """Retrieve and validate a launch token from case_assignments."""
    
    # Clean up expired tokens first
    cleanup_expired_tokens(db)
    
    # Find assignment with this token that hasn't expired
    assignment = db.query(models.CaseAssignment).options(
        joinedload(models.CaseAssignment.case),
        joinedload(models.CaseAssignment.student)
    ).filter(
        models.CaseAssignment.current_launch_token == token,
        models.CaseAssignment.token_expires_at > datetime.utcnow()
    ).first()
    
    if not assignment:
        active_assignments = db.query(models.CaseAssignment).filter(
            models.CaseAssignment.current_launch_token.isnot(None),
            models.CaseAssignment.token_expires_at > datetime.utcnow()
        ).all()
        
        print(f"🔐 TOKEN GET SIMPLE: Token {token[:8]}... not found")
        print(f"🔐 TOKEN GET SIMPLE: Available tokens: {[a.current_launch_token[:8] + '...' for a in active_assignments if a.current_launch_token]}")
        return None
    
    print(f"🔐 TOKEN GET SIMPLE: Successfully retrieved token {token[:8]}...")
    
    # Check for existing virtual patient sessions
    existing_sessions = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.assignment_id == assignment.id
    ).order_by(models.VirtualPatientSession.last_activity.desc()).all()
    
    # Return all the data needed by the frontend
    return {
        "assignment_id": assignment.id,
        "case_id": assignment.case.id,
        "user_id": assignment.student.id,
        "student_name": assignment.student.name or assignment.student.email,
        "student_email": assignment.student.email,
        "case_title": assignment.case.title,
        "case_description": assignment.case.description,
        "case_learning_objectives": assignment.case.learning_objectives or [],
        "assignment_due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        "has_previous_sessions": len(existing_sessions) > 0,
        "latest_session_id": existing_sessions[0].session_id if existing_sessions else None,
        "reusable": True,
        "created_at": assignment.token_created_at,
        "expires_at": assignment.token_expires_at
    }

def remove_token(token: str, db: Session) -> bool:
    """Remove a token by clearing it from the assignment."""
    
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.current_launch_token == token
    ).first()
    
    if assignment:
        assignment.clear_launch_token(db)
        print(f"🔐 TOKEN REMOVE SIMPLE: Removed token {token[:8]}...")
        print(f"🔐 TOKEN REMOVE SIMPLE: Total active tokens: {get_token_count(db)}")
        return True
    
    return False

def cleanup_expired_tokens(db: Session) -> None:
    """Clean up expired tokens from assignments."""
    
    expired_assignments = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.current_launch_token.isnot(None),
        models.CaseAssignment.token_expires_at <= datetime.utcnow()
    ).all()
    
    for assignment in expired_assignments:
        assignment.clear_launch_token(db)
    
    if expired_assignments:
        print(f"🔐 TOKEN CLEANUP SIMPLE: Cleaned up {len(expired_assignments)} expired tokens")

def get_token_count(db: Session) -> int:
    """Get the number of active tokens."""
    return db.query(models.CaseAssignment).filter(
        models.CaseAssignment.current_launch_token.isnot(None),
        models.CaseAssignment.token_expires_at > datetime.utcnow()
    ).count() 