from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
import os

from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(
    prefix="/admin/invitations",
    tags=["invitations"],
    responses={404: {"description": "Not found"}},
)

def generate_registration_url(token: str, role: str) -> str:
    """Generate the registration URL for the invitation."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return f"{frontend_url}/register/{role}?token={token}"


@router.post("", response_model=schemas.InvitationWithUrl, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invitation_data: schemas.InvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new user invitation.
    Only admins and faculty can create invitations.
    """
    # Authorization check
    if current_user.role not in [models.UserRole.admin, models.UserRole.faculty]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and faculty can create invitations"
        )

    # Faculty can only create student invitations
    if current_user.role == models.UserRole.faculty and invitation_data.role != models.UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only create student invitations"
        )

    # Check if user with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == invitation_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Check if there's an active (non-used, non-expired) invitation for this email
    existing_invitation = db.query(models.UserInvitationToken).filter(
        models.UserInvitationToken.email == invitation_data.email,
        models.UserInvitationToken.is_used == False,
        models.UserInvitationToken.expires_at > datetime.utcnow()
    ).first()

    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active invitation already exists for this email"
        )

    # Generate secure token
    token = secrets.token_urlsafe(32)

    # Create invitation
    new_invitation = models.UserInvitationToken(
        email=invitation_data.email,
        token=token,
        role=invitation_data.role,
        created_by_user_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=invitation_data.expires_in_days)
    )

    db.add(new_invitation)
    db.commit()
    db.refresh(new_invitation)

    # Generate registration URL
    registration_url = generate_registration_url(token, invitation_data.role.value)

    # Create response with URL
    response = schemas.InvitationWithUrl(
        id=new_invitation.id,
        email=new_invitation.email,
        role=new_invitation.role,
        token=new_invitation.token,
        created_at=new_invitation.created_at,
        expires_at=new_invitation.expires_at,
        is_used=new_invitation.is_used,
        used_at=new_invitation.used_at,
        created_by_user_id=new_invitation.created_by_user_id,
        registration_url=registration_url
    )

    return response


@router.get("", response_model=List[schemas.InvitationBase])
def list_invitations(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,  # "pending", "used", "expired"
    role_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    List all invitations.
    Admins see all, faculty see only their own.
    """
    if current_user.role not in [models.UserRole.admin, models.UserRole.faculty]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and faculty can view invitations"
        )

    # Base query
    query = db.query(models.UserInvitationToken)

    # Faculty can only see their own invitations
    if current_user.role == models.UserRole.faculty:
        query = query.filter(models.UserInvitationToken.created_by_user_id == current_user.id)

    # Apply status filter
    if status_filter == "pending":
        query = query.filter(
            models.UserInvitationToken.is_used == False,
            models.UserInvitationToken.expires_at > datetime.utcnow()
        )
    elif status_filter == "used":
        query = query.filter(models.UserInvitationToken.is_used == True)
    elif status_filter == "expired":
        query = query.filter(
            models.UserInvitationToken.is_used == False,
            models.UserInvitationToken.expires_at <= datetime.utcnow()
        )

    # Apply role filter
    if role_filter:
        try:
            role = models.UserRole(role_filter)
            query = query.filter(models.UserInvitationToken.role == role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role filter: {role_filter}"
            )

    # Order by created_at descending (newest first)
    query = query.order_by(models.UserInvitationToken.created_at.desc())

    # Apply pagination
    invitations = query.offset(skip).limit(limit).all()

    return invitations


@router.get("/{invitation_id}", response_model=schemas.InvitationWithUrl)
def get_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get details of a specific invitation."""
    if current_user.role not in [models.UserRole.admin, models.UserRole.faculty]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and faculty can view invitations"
        )

    invitation = db.query(models.UserInvitationToken).filter(
        models.UserInvitationToken.id == invitation_id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    # Faculty can only see their own invitations
    if current_user.role == models.UserRole.faculty and invitation.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own invitations"
        )

    # Generate registration URL
    registration_url = generate_registration_url(invitation.token, invitation.role.value)

    response = schemas.InvitationWithUrl(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        token=invitation.token,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        is_used=invitation.is_used,
        used_at=invitation.used_at,
        created_by_user_id=invitation.created_by_user_id,
        registration_url=registration_url
    )

    return response


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Revoke (delete) an invitation.
    Can only revoke unused invitations.
    """
    if current_user.role not in [models.UserRole.admin, models.UserRole.faculty]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and faculty can revoke invitations"
        )

    invitation = db.query(models.UserInvitationToken).filter(
        models.UserInvitationToken.id == invitation_id
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    # Faculty can only revoke their own invitations
    if current_user.role == models.UserRole.faculty and invitation.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only revoke your own invitations"
        )

    # Can't revoke already used invitations
    if invitation.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke an invitation that has already been used"
        )

    db.delete(invitation)
    db.commit()

    return None
