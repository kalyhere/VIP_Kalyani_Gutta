from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, case, distinct, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import csv
import io
import shutil
from pathlib import Path
import xlsxwriter

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user
from ..models import UserRole, VirtualPatientSessionStatus

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

@router.get("/stats")
async def get_admin_stats(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive system statistics for admin dashboard."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access system statistics"
        )
    
    # Get total users by role
    total_users = db.query(func.count(models.User.id)).filter(
        models.User.is_active == True
    ).scalar()
    
    total_faculty = db.query(func.count(models.User.id)).filter(
        models.User.role == UserRole.faculty,
        models.User.is_active == True
    ).scalar()
    
    total_students = db.query(func.count(models.User.id)).filter(
        models.User.role == UserRole.student,
        models.User.is_active == True
    ).scalar()
    
    # Get active users (logged in within last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    # Note: This would require a last_login field in the User model
    # For now, we'll use a placeholder calculation
    active_users = db.query(func.count(distinct(models.VirtualPatientSession.user_id))).filter(
        models.VirtualPatientSession.created_at >= week_ago
    ).scalar()
    
    # Get total medical cases
    total_cases = db.query(func.count(models.MedicalCase.id)).filter(
        models.MedicalCase.is_active == True
    ).scalar()
    
    public_cases = db.query(func.count(models.MedicalCase.id)).filter(
        models.MedicalCase.is_active == True,
        models.MedicalCase.is_public == True
    ).scalar()
    
    # Get active sessions (within last 24 hours)
    day_ago = datetime.utcnow() - timedelta(days=1)
    active_sessions = db.query(func.count(models.VirtualPatientSession.id)).filter(
        models.VirtualPatientSession.created_at >= day_ago,
        models.VirtualPatientSession.status == VirtualPatientSessionStatus.ACTIVE
    ).scalar()
    
    # Get total assignments
    total_assignments = db.query(func.count(models.CaseAssignment.id)).scalar()
    
    # Get completed assignments (with reports)
    completed_assignments = db.query(func.count(models.CaseAssignment.id)).filter(
        models.CaseAssignment.report_id.isnot(None)
    ).scalar()
    
    # Get total classes
    total_classes = db.query(func.count(models.Class.id)).scalar()
    
    # Get recent activity (last 24 hours)
    recent_logins = db.query(func.count(models.VirtualPatientSession.id)).filter(
        models.VirtualPatientSession.created_at >= day_ago
    ).scalar()
    
    # Calculate system health (placeholder logic)
    system_status = "healthy"
    if active_sessions == 0 and recent_logins == 0:
        system_status = "warning"
    elif total_users == 0:
        system_status = "error"
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalFaculty": total_faculty,
        "totalStudents": total_students,
        "totalCases": total_cases,
        "publicCases": public_cases,
        "activeSessions": active_sessions,
        "totalAssignments": total_assignments,
        "completedAssignments": completed_assignments,
        "totalClasses": total_classes,
        "recentLogins": recent_logins,
        "systemStatus": system_status,
        "trends": {
            "userGrowth": 12,  # Placeholder - would calculate from historical data
            "caseGrowth": 3,   # Placeholder
            "activeUsersGrowth": 5  # Placeholder
        }
    }

@router.get("/recent-activity")
async def get_recent_activity(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
):
    """Get recent system activity for admin dashboard."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access system activity"
        )
    
    activities = []
    
    # Get recent case assignments (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_assignments = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.assigned_date >= week_ago
    ).order_by(models.CaseAssignment.assigned_date.desc()).limit(limit // 2).all()
    
    for assignment in recent_assignments:
        activities.append({
            "id": f"assignment_{assignment.id}",
            "type": "assignment",
            "user": assignment.student.email,
            "action": f"Assigned case: '{assignment.case.title}'",
            "timestamp": assignment.assigned_date.isoformat(),
            "status": "success"
        })
    
    # Get recent virtual patient sessions
    recent_sessions = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.created_at >= week_ago
    ).order_by(models.VirtualPatientSession.created_at.desc()).limit(limit // 2).all()
    
    for session in recent_sessions:
        activities.append({
            "id": f"session_{session.id}",
            "type": "login",
            "user": session.user.email,
            "action": f"Started virtual patient session",
            "timestamp": session.created_at.isoformat(),
            "status": "success"
        })
    
    # Get recent case creations
    recent_cases = db.query(models.MedicalCase).filter(
        models.MedicalCase.created_at >= week_ago
    ).order_by(models.MedicalCase.created_at.desc()).limit(limit // 4).all()
    
    for case in recent_cases:
        activities.append({
            "id": f"case_{case.id}",
            "type": "case_created",
            "user": case.creator.email,
            "action": f"Created medical case: '{case.title}'",
            "timestamp": case.created_at.isoformat(),
            "status": "success"
        })
    
    # Sort all activities by timestamp (newest first)
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:limit]

@router.get("/users")
async def get_all_users(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    role: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all users with optional role filtering and inactive users."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access user list"
        )

    query = db.query(models.User)

    # Only filter by is_active if include_inactive is False
    if not include_inactive:
        query = query.filter(models.User.is_active == True)

    if role:
        query = query.filter(models.User.role == role)

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "created_cases": len(user.created_cases) if hasattr(user, 'created_cases') else 0,
                "is_active": user.is_active
            }
            for user in users
        ]
    }

@router.get("/system-health")
async def get_system_health(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get system health metrics."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access system health"
        )
    
    # Database connectivity check
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "error"
    
    # Check for any error sessions in the last hour
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    error_sessions = db.query(func.count(models.VirtualPatientSession.id)).filter(
        models.VirtualPatientSession.created_at >= hour_ago,
        models.VirtualPatientSession.status == VirtualPatientSessionStatus.ERROR
    ).scalar()
    
    session_health = "healthy" if error_sessions == 0 else "warning" if error_sessions < 5 else "error"
    
    return {
        "database": db_status,
        "sessions": session_health,
        "overall": "healthy" if db_status == "healthy" and session_health == "healthy" else "warning",
        "error_count": error_sessions,
        "last_check": datetime.utcnow().isoformat()
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user details (admin only)."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update users"
        )

    # Get the user to update
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user fields
    if user_update.name is not None:
        user.name = user_update.name
    if user_update.role is not None:
        user.role = UserRole(user_update.role)
    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "is_active": user.is_active
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    hard_delete: bool = Query(False, description="Permanently delete user from database (only works for inactive users)"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only).

    - If hard_delete=False or user is active: Soft delete (set is_active to False)
    - If hard_delete=True and user is inactive: Permanently remove from database
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )

    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Get the user to delete
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Hard delete only works for inactive users
    if hard_delete and not user.is_active:
        try:
            # Check for relationships that would prevent deletion
            # Delete related records that don't cascade automatically

            # Delete class enrollments
            db.execute(
                text("DELETE FROM class_enrollment WHERE user_id = :user_id"),
                {"user_id": user.id}
            )

            # Delete case assignments (both as student and faculty)
            db.query(models.CaseAssignment).filter(
                or_(models.CaseAssignment.student_id == user.id, models.CaseAssignment.faculty_id == user.id)
            ).delete(synchronize_session=False)

            # Delete classes where user is faculty
            db.query(models.Class).filter(models.Class.faculty_id == user.id).delete(synchronize_session=False)

            # Delete invitation tokens created by or used by this user
            if hasattr(models, 'UserInvitationToken'):
                db.query(models.UserInvitationToken).filter(
                    or_(
                        models.UserInvitationToken.created_by_user_id == user.id,
                        models.UserInvitationToken.used_by_user_id == user.id
                    )
                ).delete(synchronize_session=False)

            # Medical cases and sessions have CASCADE delete, so they'll be handled automatically

            # Now delete the user
            db.delete(user)
            db.commit()
            return {"message": "User permanently deleted"}
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user: {str(e)}"
            )
    else:
        # Soft delete by setting is_active to False
        user.is_active = False
        db.commit()
        return {"message": "User deactivated"}

@router.get("/case-assignments")
async def get_admin_case_assignments(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    class_id: Optional[int] = Query(None)
):
    """Get case assignments for admin dashboard."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access case assignments"
        )

    # Build the query for case assignments
    query = db.query(models.CaseAssignment)

    # Add joins to get related data
    query = query.options(
        joinedload(models.CaseAssignment.case),
        joinedload(models.CaseAssignment.student),
        joinedload(models.CaseAssignment.faculty)
    )

    # Filter by class_id if provided
    if class_id:
        query = query.filter(models.CaseAssignment.class_id == class_id)

    assignments = query.all()

    # Transform to match frontend expectations
    result = []
    for assignment in assignments:
        result.append({
            "id": assignment.id,
            "case_id": assignment.case_id,
            "student_id": assignment.student_id,
            "faculty_id": assignment.faculty_id,
            "class_id": assignment.class_id,
            "due_date": assignment.due_date,
            "assigned_date": assignment.assigned_date,
            "status": assignment.status,
            "report_id": assignment.report_id,
            "case": {
                "id": assignment.case.id,
                "title": assignment.case.title,
                "learning_objectives": assignment.case.learning_objectives,
                "description": assignment.case.description
            } if assignment.case else None,
            "student": {
                "id": assignment.student.id,
                "name": assignment.student.name,
                "email": assignment.student.email
            } if assignment.student else None,
            "faculty": {
                "id": assignment.faculty.id,
                "name": assignment.faculty.name,
                "email": assignment.faculty.email
            } if assignment.faculty else None
        })

    return result

@router.get("/aimhei/reports/export/csv")
async def export_reports_csv(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    report_ids: Optional[str] = Query(None, description="Comma-separated list of report IDs, or omit for all reports")
):
    """Export AIMHEI reports as CSV (admin only).

    Query params:
    - report_ids: Comma-separated list of IDs (e.g., "1,2,3") or omit for all reports
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can export reports"
        )

    try:
        # Query reports - no need to joinedload case_assignment for standalone reports
        query = db.query(models.AIMHEIReport)

        if report_ids:
            # Parse comma-separated IDs
            try:
                id_list = [int(id.strip()) for id in report_ids.split(',')]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid report IDs format. Must be comma-separated integers."
                )

            reports = query.filter(models.AIMHEIReport.id.in_(id_list)).all()
            if not reports:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No reports found with IDs: {report_ids}"
                )
        else:
            reports = query.all()

        if not reports:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No reports found"
            )

        # Create Excel workbook with xlsxwriter (Google Sheets compatible)
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True,
            'strings_to_numbers': False,
            'strings_to_urls': False,
            'remove_timezone': False
        })

        for report in reports:
            if not report:
                continue

            # Create sheet name (max 31 chars for Excel)
            # Always include report ID to ensure uniqueness
            if report.report_name:
                # Clean sheet name - remove invalid characters
                clean_name = "".join(c for c in report.report_name if c not in ['[', ']', '*', '?', ':', '/', '\\'])
                # Reserve space for " (ID)" suffix to ensure uniqueness
                max_name_length = 31 - len(f" ({report.id})")
                truncated_name = clean_name[:max_name_length] if len(clean_name) > max_name_length else clean_name
                sheet_name = f"{truncated_name} ({report.id})"
            else:
                sheet_name = f"Report {report.id}"

            worksheet = workbook.add_worksheet(sheet_name)

            # Write header row with scores
            info_score = f"{report.information_section_score:.2f}" if report.information_section_score else "N/A"
            skill_score = f"{report.skill_section_score:.2f}" if report.skill_section_score else "N/A"
            header = f"INFO: {info_score} | SKILL: {skill_score}"

            row_idx = 0
            worksheet.write_string(row_idx, 0, header)
            worksheet.write_string(row_idx, 1, "OUTPUT")
            worksheet.write_string(row_idx, 2, "CRITERIA")
            worksheet.write_string(row_idx, 3, "EXPLANATION")
            worksheet.write_string(row_idx, 4, "SOURCE #s")
            worksheet.write_string(row_idx, 5, "SOURCE LINES")
            worksheet.write_string(row_idx, 6, "SECTION")
            row_idx += 1

            # Write detailed rubric data
            if report.rubric_detail:
                try:
                    rubric = report.rubric_detail if isinstance(report.rubric_detail, list) else json.loads(report.rubric_detail)
                    for item in rubric:
                        # Get the score value (10, 0, or special format)
                        output_val = str(item.get("output", ""))
                        if output_val.upper() == "YES":
                            score = "10"
                        elif output_val.upper() == "NO":
                            score = "0"
                        else:
                            score = output_val

                        worksheet.write_string(row_idx, 0, score)
                        worksheet.write_string(row_idx, 1, output_val)
                        worksheet.write_string(row_idx, 2, str(item.get("criteria", "")))
                        worksheet.write_string(row_idx, 3, str(item.get("explanation", "")))
                        worksheet.write_string(row_idx, 4, str(item.get("line_nums", [])))
                        worksheet.write_string(row_idx, 5, str(item.get("lines", [])))
                        worksheet.write_string(row_idx, 6, str(item.get("section_title", "")))
                        row_idx += 1
                except Exception as e:
                    logger.error(f"Error parsing rubric_detail for report {report.id}: {str(e)}")

        workbook.close()
        output.seek(0)

        # Prepare response
        if report_ids:
            filename = f"aimhei_reports_{len(reports)}_selected.xlsx"
        else:
            filename = "aimhei_reports_all.xlsx"

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export reports: {str(e)}"
        )