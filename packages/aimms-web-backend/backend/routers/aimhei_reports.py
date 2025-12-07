from fastapi import APIRouter, Depends, HTTPException, Security, status, Body, Query
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import func, or_
from typing import List, Optional
from .. import crud, schemas, models
from ..database import get_db
from ..auth import get_current_active_user
from datetime import datetime, timedelta
import secrets
import os

router = APIRouter(
    prefix="/api/aimhei-reports",
    tags=["aimhei-reports"],
    responses={404: {"description": "Not found"}},
)

def calculate_percentile_rank(db: Session, percentage_score: float) -> float:
    """
    Calculate the percentile rank for a given score across all AIMHEI reports.
    Returns the percentage of reports with a score less than or equal to the given score.
    """
    if percentage_score is None:
        return None

    # Count total reports with non-null scores
    total_reports = db.query(func.count(models.AIMHEIReport.id))\
        .filter(models.AIMHEIReport.percentage_score.isnot(None))\
        .scalar()

    if total_reports == 0:
        return None

    # Count reports with score less than or equal to this score
    reports_below_or_equal = db.query(func.count(models.AIMHEIReport.id))\
        .filter(models.AIMHEIReport.percentage_score <= percentage_score)\
        .filter(models.AIMHEIReport.percentage_score.isnot(None))\
        .scalar()

    # Calculate percentile (percentage of scores at or below this score)
    percentile = (reports_below_or_equal / total_reports) * 100
    return round(percentile, 1)

@router.get("/", response_model=schemas.PaginatedReportsResponse)
async def list_aimhei_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user),
    report_type: str = Query(None, description="Filter by report type: 'standalone' or 'virtual_patient'"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search_term: str = Query(None, description="Search term to filter reports"),
    search_field: str = Query("all", description="Field to search in: all, case_title, hcp_name, patient_id, ai_model, aispe_location, human_supervisor"),
    ai_model: str = Query(None, description="Filter by AI model"),
    date_filter: str = Query(None, description="Filter by date: today, week, month"),
    start_date: str = Query(None, description="Filter by start date (ISO format: YYYY-MM-DD)"),
    end_date: str = Query(None, description="Filter by end date (ISO format: YYYY-MM-DD)"),
    folder: str = Query(None, description="Filter by folder (admin only)")
):
    """
    List AIMHEI reports with optional filtering by type, search, and other criteria.
    Returns paginated results with total count.
    Faculty and admin can see all reports. Students cannot access standalone reports.
    """
    # if current_user.role == "student":
    #     raise HTTPException(status_code=403, detail="Students cannot list reports")

    # Build base query with proper loading of related data
    query = db.query(models.AIMHEIReport).options(
        joinedload(models.AIMHEIReport.session).joinedload(models.VirtualPatientSession.case)
    )

    # Apply report_type filter if specified
    if report_type:
        if report_type not in ['standalone', 'virtual_patient']:
            raise HTTPException(status_code=400, detail="Invalid report_type. Must be 'standalone' or 'virtual_patient'")
        query = query.filter(models.AIMHEIReport.report_type == report_type)

    # Apply search filter if specified
    if search_term:
        search_pattern = f"%{search_term}%"
        if search_field == "all":
            # Search across all fields
            query = query.filter(
                or_(
                    models.AIMHEIReport.report_name.ilike(search_pattern),
                    models.AIMHEIReport.hcp_name.ilike(search_pattern),
                    models.AIMHEIReport.patient_id.ilike(search_pattern),
                    models.AIMHEIReport.ai_model.ilike(search_pattern),
                    models.AIMHEIReport.aispe_location.ilike(search_pattern),
                    models.AIMHEIReport.human_supervisor.ilike(search_pattern)
                )
            )
        elif search_field == "case_title":
            query = query.filter(models.AIMHEIReport.report_name.ilike(search_pattern))
        elif search_field == "hcp_name":
            query = query.filter(models.AIMHEIReport.hcp_name.ilike(search_pattern))
        elif search_field == "patient_id":
            query = query.filter(models.AIMHEIReport.patient_id.ilike(search_pattern))
        elif search_field == "ai_model":
            query = query.filter(models.AIMHEIReport.ai_model.ilike(search_pattern))
        elif search_field == "aispe_location":
            query = query.filter(models.AIMHEIReport.aispe_location.ilike(search_pattern))
        elif search_field == "human_supervisor":
            query = query.filter(models.AIMHEIReport.human_supervisor.ilike(search_pattern))

    # Apply AI model filter if specified
    if ai_model and ai_model != "all":
        query = query.filter(models.AIMHEIReport.ai_model == ai_model)

    # Apply date filter if specified
    from datetime import datetime, timedelta

    # Handle macro date filters (today, week, month)
    if date_filter and date_filter != "all":
        now = datetime.now()

        if date_filter == "today":
            filter_start_date = datetime(now.year, now.month, now.day)
            query = query.filter(models.AIMHEIReport.updated_at >= filter_start_date)
        elif date_filter == "week":
            filter_start_date = now - timedelta(days=7)
            query = query.filter(models.AIMHEIReport.updated_at >= filter_start_date)
        elif date_filter == "month":
            filter_start_date = now - timedelta(days=30)
            query = query.filter(models.AIMHEIReport.updated_at >= filter_start_date)

    # Handle custom date range (start_date and/or end_date)
    if start_date or end_date:
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                # Set to start of day
                start_dt = datetime(start_dt.year, start_dt.month, start_dt.day, 0, 0, 0)
                query = query.filter(models.AIMHEIReport.updated_at >= start_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                # Set to end of day (23:59:59)
                end_dt = datetime(end_dt.year, end_dt.month, end_dt.day, 23, 59, 59)
                query = query.filter(models.AIMHEIReport.updated_at <= end_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

    # Apply folder filter if specified (admin only)
    if folder is not None:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only administrators can filter by folder")
        # Special handling for unorganized reports (reports with no folder)
        if folder == "__unorganized__":
            # Filter for reports with null folder
            query = query.filter(models.AIMHEIReport.folder == None)
        else:
            # Normal folder filtering
            query = query.filter(models.AIMHEIReport.folder == folder)

    # Get total count before pagination
    total = query.count()

    # Get reports with pagination
    reports = query.order_by(models.AIMHEIReport.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response for each report
    response_list = []
    for report in reports:
        try:
            if report.report_type == 'standalone':
                # Handle standalone reports
                response_item = schemas.CompletedReportDetail(
                    # Analysis Configuration Fields (metadata)
                    report_name=report.report_name,
                    ai_model=report.ai_model,
                    hcp_name=report.hcp_name,
                    hcp_year=report.hcp_year,
                    patient_id=report.patient_id,
                    interview_date=report.interview_date,
                    human_supervisor=report.human_supervisor,
                    aispe_location=report.aispe_location,
                    # Score Fields
                    total_points_earned=report.total_points_earned,
                    total_points_possible=report.total_points_possible,
                    percentage_score=report.percentage_score,
                    information_section_score=report.information_section_score,
                    skill_section_score=report.skill_section_score,
                    medical_terminology_score=report.medical_terminology_score,
                    politeness_score=report.politeness_score,
                    empathy_score=report.empathy_score,
                    # Feedback Fields
                    unacceptable_areas=report.unacceptable_areas,
                    improvement_areas=report.improvement_areas,
                    section_summaries=report.section_summaries,
                    rubric_detail=report.rubric_detail,
                    # Report Type and Status
                    status=report.status,
                    report_type=report.report_type,
                    # Response-specific fields
                    report_id=report.id,
                    session_id=None,  # No session for standalone reports
                    case_title=report.report_name,
                    created_at=report.created_at,
                    updated_at=report.updated_at
                )
            else:
                # Handle virtual patient reports (need to load session and case data)
                if not report.session or not report.session.case:
                    print(f"Warning: VP Report ID {report.id} missing session or case data")
                    continue
                
                response_item = schemas.CompletedReportDetail(
                    # Analysis Configuration Fields (metadata)
                    report_name=report.report_name,
                    ai_model=report.ai_model,
                    hcp_name=report.hcp_name,
                    hcp_year=report.hcp_year,
                    patient_id=report.patient_id,
                    interview_date=report.interview_date,
                    human_supervisor=report.human_supervisor,
                    aispe_location=report.aispe_location,
                    # Score Fields
                    total_points_earned=report.total_points_earned,
                    total_points_possible=report.total_points_possible,
                    percentage_score=report.percentage_score,
                    information_section_score=report.information_section_score,
                    skill_section_score=report.skill_section_score,
                    medical_terminology_score=report.medical_terminology_score,
                    politeness_score=report.politeness_score,
                    empathy_score=report.empathy_score,
                    # Feedback Fields
                    unacceptable_areas=report.unacceptable_areas,
                    improvement_areas=report.improvement_areas,
                    section_summaries=report.section_summaries,
                    rubric_detail=report.rubric_detail,
                    # Report Type and Status
                    status=report.status,
                    report_type=report.report_type,
                    # Additional fields for VP reports
                    report_id=report.id,
                    session_id=report.session.id,
                    case_title=report.session.case.title,
                    created_at=report.created_at,
                    updated_at=report.updated_at
                )
            
            response_list.append(response_item)
        except Exception as e:
            print(f"Error processing report {report.id}: {e}")
            continue

    return schemas.PaginatedReportsResponse(
        data=response_list,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/folders")
def get_all_folders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all folders. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can view folders")

    # Get folders from the folders table, not from reports
    folders = db.query(models.AIMHEIFolder).order_by(models.AIMHEIFolder.name).all()
    folder_names = [folder.name for folder in folders]
    return {"folders": folder_names}

@router.get("/folders/counts")
def get_folder_counts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get counts of reports per folder. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can view folder counts")

    # Get all standalone reports (no session_id)
    reports = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.session_id.is_(None)
    ).all()

    # Count reports by folder
    folder_counts = {}
    total_reports = len(reports)
    organized_count = 0

    for report in reports:
        if report.folder:
            organized_count += 1
            folder_counts[report.folder] = folder_counts.get(report.folder, 0) + 1

    unorganized_count = total_reports - organized_count

    return {
        "folder_counts": folder_counts,
        "total_reports": total_reports,
        "unorganized_count": unorganized_count
    }

@router.post("/folders/create")
async def create_folder(
    name: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """Create a new folder. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can create folders")

    # Check if folder already exists
    existing = db.query(models.AIMHEIFolder).filter(models.AIMHEIFolder.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Folder '{name}' already exists")

    # Create new folder
    folder = models.AIMHEIFolder(name=name)
    db.add(folder)
    db.commit()
    db.refresh(folder)

    return {
        "message": f"Folder '{name}' created successfully",
        "folder": {"id": folder.id, "name": folder.name}
    }

@router.post("/folders/rename")
async def rename_folder(
    old_name: str = Body(..., embed=True),
    new_name: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """Rename a folder by updating all reports with the old folder name and the folder record. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can rename folders")

    # Update the folder record
    folder = db.query(models.AIMHEIFolder).filter(models.AIMHEIFolder.name == old_name).first()
    if folder:
        folder.name = new_name
        folder.updated_at = datetime.utcnow()

    # Update all reports with the old folder name
    reports = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.folder == old_name
    ).all()

    count = 0
    for report in reports:
        report.folder = new_name
        count += 1

    db.commit()

    return {
        "message": f"Successfully renamed folder from '{old_name}' to '{new_name}'",
        "reports_updated": count
    }

@router.delete("/folders/{folder_name}")
async def delete_folder(
    folder_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """Delete a folder. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete folders")

    # Delete the folder record
    folder = db.query(models.AIMHEIFolder).filter(models.AIMHEIFolder.name == folder_name).first()
    if folder:
        db.delete(folder)
        db.commit()

    return {"message": f"Folder '{folder_name}' deleted successfully"}

@router.get("/{report_id}", response_model=schemas.CompletedReportDetail)
async def get_aimhei_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get the full details of a single AIMHEI report by its ID.
    Handles both virtual patient reports (with sessions) and standalone reports.
    Students can only access their own reports.
    Faculty can only access reports from students in their classes.
    """
    # First, get the report to check its type
    report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Handle standalone reports
    if report.report_type == 'standalone':
        # For standalone reports, admin and faculty can access all, students cannot access any
        # if current_user.role == "student":
        #     raise HTTPException(status_code=403, detail="Students cannot access standalone reports")

        # Calculate percentile rank
        percentile_rank = calculate_percentile_rank(db, report.percentage_score)

        # Return standalone report data
        response_item = schemas.CompletedReportDetail(
            # Analysis Configuration Fields (metadata)
            report_name=report.report_name,
            ai_model=report.ai_model,
            hcp_name=report.hcp_name,
            hcp_year=report.hcp_year,
            patient_id=report.patient_id,
            interview_date=report.interview_date,
            human_supervisor=report.human_supervisor,
            aispe_location=report.aispe_location,
            # Score Fields
            total_points_earned=report.total_points_earned,
            total_points_possible=report.total_points_possible,
            percentage_score=report.percentage_score,
            information_section_score=report.information_section_score,
            skill_section_score=report.skill_section_score,
            medical_terminology_score=report.medical_terminology_score,
            politeness_score=report.politeness_score,
            empathy_score=report.empathy_score,
            # Feedback Fields
            unacceptable_areas=report.unacceptable_areas,
            improvement_areas=report.improvement_areas,
            section_summaries=report.section_summaries,
            strengths_weaknesses=report.strengths_weaknesses,
            rubric_detail=report.rubric_detail,
            # Report Type and Status
            status=report.status,
            report_type=report.report_type,
            # Response-specific fields
            report_id=report.id,
            session_id=None,  # No session for standalone reports
            case_title=report.report_name,
            created_at=report.created_at,
            updated_at=report.updated_at,
            percentile_rank=percentile_rank
        )
        return response_item
    
    # Handle virtual patient reports (existing logic with joins)
    query = db.query(models.AIMHEIReport)\
        .join(models.AIMHEIReport.session)\
        .join(models.VirtualPatientSession.case)\
        .join(models.CaseAssignment, models.CaseAssignment.case_id == models.VirtualPatientSession.case_id)\
        .join(models.Class, models.Class.id == models.CaseAssignment.class_id)\
        .options(
            contains_eager(models.AIMHEIReport.session)
            .joinedload(models.VirtualPatientSession.case)
        )\
        .filter(models.AIMHEIReport.id == report_id)

    # If user is a student, only allow access to their own reports
    if current_user.role == "student":
        query = query.filter(models.VirtualPatientSession.user_id == current_user.id)
    # If user is faculty, only allow access to reports from students in their classes
    elif current_user.role == "faculty":
        query = query.filter(models.Class.faculty_id == current_user.id)
    # If user is admin, allow access to all reports (no additional filtering)
    elif current_user.role == "admin":
        pass  # No filtering needed for admin users
    else:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    vp_report = query.first()

    if not vp_report:
        raise HTTPException(status_code=404, detail="Report not found or not accessible")

    # Calculate percentile rank
    percentile_rank = calculate_percentile_rank(db, vp_report.percentage_score)

    # Manually construct the response to ensure all fields are included
    try:
        response_item = schemas.CompletedReportDetail(
            # Analysis Configuration Fields (metadata)
            report_name=vp_report.report_name,
            ai_model=vp_report.ai_model,
            hcp_name=vp_report.hcp_name,
            hcp_year=vp_report.hcp_year,
            patient_id=vp_report.patient_id,
            interview_date=vp_report.interview_date,
            human_supervisor=vp_report.human_supervisor,
            aispe_location=vp_report.aispe_location,
            # Score Fields
            total_points_earned=vp_report.total_points_earned,
            total_points_possible=vp_report.total_points_possible,
            percentage_score=vp_report.percentage_score,
            information_section_score=vp_report.information_section_score,
            skill_section_score=vp_report.skill_section_score,
            medical_terminology_score=vp_report.medical_terminology_score,
            politeness_score=vp_report.politeness_score,
            empathy_score=vp_report.empathy_score,
            # Feedback Fields
            unacceptable_areas=vp_report.unacceptable_areas,
            improvement_areas=vp_report.improvement_areas,
            section_summaries=vp_report.section_summaries,
            rubric_detail=vp_report.rubric_detail,
            # Report Type and Status
            status=vp_report.status,
            report_type=vp_report.report_type,
            # Additional fields specific to CompletedReportDetail
            report_id=vp_report.id,
            session_id=vp_report.session.id,
            case_title=vp_report.session.case.title,
            created_at=vp_report.created_at,
            updated_at=vp_report.updated_at,
            percentile_rank=percentile_rank
        )
        return response_item
    except Exception as e:
        print(f"Error creating CompletedReportDetail for single report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Error processing report data")

@router.put("/{report_id}", response_model=schemas.CompletedReportDetail)
async def update_aimhei_report(
    report_id: int,
    report_data: schemas.AIMHEIReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Update an existing AIMHEI report. Only faculty and admin can update reports.
    Handles both standalone and virtual patient reports.
    """
    # Check if user is faculty or admin
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can update reports")

    # First, get the report to check its type
    report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Handle standalone reports
    if report.report_type == 'standalone':
        # For standalone reports, admin and faculty can update
        if current_user.role == "student":
            raise HTTPException(status_code=403, detail="Students cannot update standalone reports")
        
        # Update the report
        updated_report = crud.update_aimhei_report(db, report, report_data)
        
        # Return standalone report response
        response_item = schemas.CompletedReportDetail(
            # Analysis Configuration Fields (metadata)
            report_name=updated_report.report_name,
            ai_model=updated_report.ai_model,
            hcp_name=updated_report.hcp_name,
            hcp_year=updated_report.hcp_year,
            patient_id=updated_report.patient_id,
            interview_date=updated_report.interview_date,
            human_supervisor=updated_report.human_supervisor,
            aispe_location=updated_report.aispe_location,
            # Score Fields
            total_points_earned=updated_report.total_points_earned,
            total_points_possible=updated_report.total_points_possible,
            percentage_score=updated_report.percentage_score,
            information_section_score=updated_report.information_section_score,
            skill_section_score=updated_report.skill_section_score,
            medical_terminology_score=updated_report.medical_terminology_score,
            politeness_score=updated_report.politeness_score,
            empathy_score=updated_report.empathy_score,
            # Feedback Fields
            unacceptable_areas=updated_report.unacceptable_areas,
            improvement_areas=updated_report.improvement_areas,
            section_summaries=updated_report.section_summaries,
            rubric_detail=updated_report.rubric_detail,
            # Report Type and Status
            status=updated_report.status,
            report_type=updated_report.report_type,
            # Response-specific fields
            report_id=updated_report.id,
            session_id=None,  # No session for standalone reports
            case_title=updated_report.report_name,
            created_at=updated_report.created_at,
            updated_at=updated_report.updated_at
        )
        return response_item

    # Handle virtual patient reports (existing logic with joins)
    vp_report = db.query(models.AIMHEIReport)\
        .join(models.AIMHEIReport.session)\
        .options(
            contains_eager(models.AIMHEIReport.session)
            .joinedload(models.VirtualPatientSession.case)
        )\
        .filter(models.AIMHEIReport.id == report_id)\
        .first()

    if not vp_report:
        raise HTTPException(status_code=404, detail="Virtual patient report not found")

    # Update the report
    updated_report = crud.update_aimhei_report(db, vp_report, report_data)
    
    # Construct the response with all required fields
    response_item = schemas.CompletedReportDetail(
        # Analysis Configuration Fields (metadata)
        report_name=updated_report.report_name,
        ai_model=updated_report.ai_model,
        hcp_name=updated_report.hcp_name,
        hcp_year=updated_report.hcp_year,
        patient_id=updated_report.patient_id,
        interview_date=updated_report.interview_date,
        human_supervisor=updated_report.human_supervisor,
        aispe_location=updated_report.aispe_location,
        # Score Fields
        total_points_earned=updated_report.total_points_earned,
        total_points_possible=updated_report.total_points_possible,
        percentage_score=updated_report.percentage_score,
        information_section_score=updated_report.information_section_score,
        skill_section_score=updated_report.skill_section_score,
        medical_terminology_score=updated_report.medical_terminology_score,
        politeness_score=updated_report.politeness_score,
        empathy_score=updated_report.empathy_score,
        # Feedback Fields
        unacceptable_areas=updated_report.unacceptable_areas,
        improvement_areas=updated_report.improvement_areas,
        section_summaries=updated_report.section_summaries,
        rubric_detail=updated_report.rubric_detail,
        # Report Type and Status
        status=updated_report.status,
        report_type=updated_report.report_type,
        # Additional fields specific to CompletedReportDetail
        report_id=updated_report.id,
        session_id=updated_report.session.id,
        case_title=updated_report.session.case.title,
        created_at=updated_report.created_at,
        updated_at=updated_report.updated_at
    )
    return response_item

@router.post("/{report_id}/finalize", response_model=schemas.CompletedReportDetail)
async def finalize_aimhei_report(
    report_id: int,
    report_update: schemas.AIMHEIReportUpdate = Body(None),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user),
):
    # Only faculty and admin can finalize
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can finalize reports.")

    # First, get the report to check its type
    report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Update rubric and scores if provided
    if report_update:
        for field, value in report_update.dict(exclude_unset=True).items():
            setattr(report, field, value)
    db.add(report)

    # Find and update the assignment status
    assignment = db.query(models.CaseAssignment).filter(models.CaseAssignment.report_id == report_id).first()
    if assignment:
        assignment.status = "reviewed"
        db.add(assignment)
    else:
        print(f"No assignment found for report_id={report_id}")

    db.commit()

    # Handle standalone reports
    if report.report_type == 'standalone':
        # Return standalone report response
        response_item = schemas.CompletedReportDetail(
            # Analysis Configuration Fields (metadata)
            report_name=report.report_name,
            ai_model=report.ai_model,
            hcp_name=report.hcp_name,
            hcp_year=report.hcp_year,
            patient_id=report.patient_id,
            interview_date=report.interview_date,
            human_supervisor=report.human_supervisor,
            aispe_location=report.aispe_location,
            # Score Fields
            total_points_earned=report.total_points_earned,
            total_points_possible=report.total_points_possible,
            percentage_score=report.percentage_score,
            information_section_score=report.information_section_score,
            skill_section_score=report.skill_section_score,
            medical_terminology_score=report.medical_terminology_score,
            politeness_score=report.politeness_score,
            empathy_score=report.empathy_score,
            # Feedback Fields
            unacceptable_areas=report.unacceptable_areas,
            improvement_areas=report.improvement_areas,
            section_summaries=report.section_summaries,
            strengths_weaknesses=report.strengths_weaknesses,
            rubric_detail=report.rubric_detail,
            # Report Type and Status
            status=report.status,
            report_type=report.report_type,
            # Response-specific fields
            report_id=report.id,
            session_id=None,  # No session for standalone reports
            case_title=report.report_name,
            created_at=report.created_at,
            updated_at=report.updated_at
        )
        return response_item

    # Handle virtual patient reports - get the report with session details
    vp_report = db.query(models.AIMHEIReport)\
        .join(models.AIMHEIReport.session)\
        .options(
            contains_eager(models.AIMHEIReport.session)
            .joinedload(models.VirtualPatientSession.case)
        )\
        .filter(models.AIMHEIReport.id == report_id)\
        .first()

    # Return the updated report in the same format as GET/PUT
    response_item = schemas.CompletedReportDetail(
        # Analysis Configuration Fields (metadata)
        report_name=vp_report.report_name,
        ai_model=vp_report.ai_model,
        hcp_name=vp_report.hcp_name,
        hcp_year=vp_report.hcp_year,
        patient_id=vp_report.patient_id,
        interview_date=vp_report.interview_date,
        human_supervisor=vp_report.human_supervisor,
        aispe_location=vp_report.aispe_location,
        # Score Fields
        total_points_earned=vp_report.total_points_earned,
        total_points_possible=vp_report.total_points_possible,
        percentage_score=vp_report.percentage_score,
        information_section_score=vp_report.information_section_score,
        skill_section_score=vp_report.skill_section_score,
        medical_terminology_score=vp_report.medical_terminology_score,
        politeness_score=vp_report.politeness_score,
        empathy_score=vp_report.empathy_score,
        # Feedback Fields
        unacceptable_areas=vp_report.unacceptable_areas,
        improvement_areas=vp_report.improvement_areas,
        section_summaries=vp_report.section_summaries,
        rubric_detail=vp_report.rubric_detail,
        # Report Type and Status
        status=vp_report.status,
        report_type=vp_report.report_type,
        # Response-specific fields
        report_id=vp_report.id,
        session_id=vp_report.session.id,
        case_title=vp_report.session.case.title,
        created_at=vp_report.created_at,
        updated_at=vp_report.updated_at
    )
    return response_item 

@router.delete("/{report_id}")
async def delete_aimhei_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Delete an AIMHEI report. Permission rules:
    - Students cannot delete any reports
    - Faculty can delete reports from students in their classes
    - Admin can delete any report
    """
    # Students cannot delete reports
    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot delete reports")
    
    # First, get the report to check its type and existence
    report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Handle standalone reports
    if report.report_type == 'standalone':
        # For standalone reports, admin and faculty can delete
        if current_user.role not in ["faculty", "admin"]:
            raise HTTPException(status_code=403, detail="Only faculty and admin can delete standalone reports")
        
        # Delete the report
        db.delete(report)
        db.commit()
        return {"message": "Report deleted successfully"}
    
    # Handle virtual patient reports - check class permissions for faculty
    if current_user.role == "faculty":
        # Verify the report belongs to a student in faculty's class
        assignment = db.query(models.CaseAssignment)\
            .join(models.Class, models.Class.id == models.CaseAssignment.class_id)\
            .filter(models.CaseAssignment.report_id == report_id)\
            .filter(models.Class.faculty_id == current_user.id)\
            .first()
        
        if not assignment:
            raise HTTPException(
                status_code=403, 
                detail="Cannot delete report: not from your class"
            )
    
    # Delete the report (also handles cascade deletion of related assignments)
    db.delete(report)
    db.commit()

    return {"message": "Report deleted successfully"}

@router.post("/{report_id}/share-link", response_model=schemas.CreateShareLinkResponse)
async def create_report_share_link(
    report_id: int,
    request: schemas.CreateShareLinkRequest = Body(default=schemas.CreateShareLinkRequest()),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Generate a secure, time-limited link for sharing an AIMHEI report.
    Only admins and faculty can create share links.
    """
    # Only admins and faculty can create share links
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and faculty can create share links"
        )

    # Get the report
    report = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Generate secure random token
    token = secrets.token_urlsafe(32)

    # Calculate expiration date
    expires_at = datetime.utcnow() + timedelta(days=request.days_valid)

    # Create share token record
    share_token = models.ReportShareToken(
        report_id=report_id,
        token=token,
        expires_at=expires_at,
        created_by_user_id=current_user.id
    )
    db.add(share_token)
    db.commit()
    db.refresh(share_token)

    # Build share URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    share_url = f"{frontend_url}/shared-report/{token}"

    return schemas.CreateShareLinkResponse(
        success=True,
        share_url=share_url,
        token=token,
        expires_at=expires_at,
        message=f"Share link created successfully. Valid for {request.days_valid} days."
    )

@router.get("/{report_id}/share-links", response_model=List[schemas.ShareLinkInfo])
async def get_report_share_links(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get existing share links for a report.
    Returns active, non-expired links only.
    """
    # Only admins and faculty can view share links
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and faculty can view share links"
        )

    # Get the report to ensure it exists
    report = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Query for active, non-expired share links
    share_links = db.query(models.ReportShareToken).filter(
        models.ReportShareToken.report_id == report_id,
        models.ReportShareToken.is_active == True,
        models.ReportShareToken.expires_at > datetime.utcnow()
    ).order_by(models.ReportShareToken.created_at.desc()).all()

    # Build share URLs
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    result = []
    for link in share_links:
        share_url = f"{frontend_url}/shared-report/{link.token}"
        result.append(schemas.ShareLinkInfo(
            token=link.token,
            share_url=share_url,
            expires_at=link.expires_at,
            access_count=link.access_count,
            last_accessed_at=link.last_accessed_at,
            created_at=link.created_at
        ))

    return result

@router.delete("/{report_id}/share-links/{token}")
async def delete_report_share_link(
    report_id: int,
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Delete a share link for a report.
    Only admins and faculty can delete share links.
    """
    # Only admins and faculty can delete share links
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and faculty can delete share links"
        )

    # Get the report to ensure it exists
    report = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Find the share token
    share_token = db.query(models.ReportShareToken).filter(
        models.ReportShareToken.report_id == report_id,
        models.ReportShareToken.token == token
    ).first()

    if not share_token:
        raise HTTPException(status_code=404, detail="Share link not found")

    # Delete the share token
    db.delete(share_token)
    db.commit()

    return {"message": "Share link deleted successfully"}

@router.post("/{report_id}/share-links/{token}/send-email", response_model=schemas.SendShareLinkEmailResponse)
async def send_share_link_email(
    report_id: int,
    token: str,
    request: schemas.SendShareLinkEmailRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Send a share link via email to a recipient.
    Only admins and faculty can send share link emails.
    Recipient must have @arizona.edu email address.
    """
    from ..email_service import get_email_service
    from ..rate_limiter import get_rate_limiter
    from email_validator import validate_email, EmailNotValidError

    # Only admins and faculty can send share link emails
    if current_user.role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators and faculty can send share link emails"
        )

    # Check rate limiting
    rate_limiter = get_rate_limiter()
    is_allowed, error_msg = rate_limiter.check_rate_limit(current_user.id)

    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=error_msg
        )

    # Validate email format
    try:
        validation = validate_email(request.recipient_email, check_deliverability=False)
        normalized_email = validation.normalized
    except EmailNotValidError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid email address: {str(e)}"
        )

    # Verify email is @arizona.edu
    if not normalized_email.endswith("@arizona.edu"):
        raise HTTPException(
            status_code=400,
            detail="Email must be a @arizona.edu address"
        )

    # Get the report
    report = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Verify the share token exists and belongs to this report
    share_token = db.query(models.ReportShareToken).filter(
        models.ReportShareToken.report_id == report_id,
        models.ReportShareToken.token == token
    ).first()

    if not share_token:
        raise HTTPException(status_code=404, detail="Share link not found")

    # Check if token is expired
    if share_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Share link has expired")

    # Build share URL
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    share_url = f"{frontend_url}/shared-report/{token}"

    # Format expiration date
    expires_at_str = share_token.expires_at.strftime("%B %d, %Y at %I:%M %p UTC")

    # Get report name and score
    report_name = report.report_name or f"Report #{report.id}"
    report_score = report.percentage_score

    # Get sender name
    sender_name = current_user.name or current_user.email

    # Send email via email service
    email_service = get_email_service()

    if not email_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Email service is not configured. Please contact system administrator."
        )

    success = await email_service.send_share_link_email(
        to_email=normalized_email,
        report_name=report_name,
        report_score=report_score,
        share_link=share_url,
        expires_at=expires_at_str,
        sender_name=sender_name,
        custom_message=request.custom_message
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please try again or copy the link manually."
        )

    return schemas.SendShareLinkEmailResponse(
        success=True,
        message=f"Email sent successfully to {normalized_email}",
        recipient_email=normalized_email
    )

@router.get("/shared/{token}", response_model=schemas.CompletedReportDetail)
async def get_shared_report(
    token: str,
    db: Session = Depends(get_db),
    increment_view: bool = Query(False, description="Whether to increment the view counter")
):
    """
    Get a report using a secure share token.
    No authentication required - public endpoint.
    Set increment_view=true to count as a new view (only on initial page load).
    """
    # Find the share token
    share_token = db.query(models.ReportShareToken).filter(
        models.ReportShareToken.token == token
    ).first()

    if not share_token:
        raise HTTPException(status_code=404, detail="Share link not found or invalid")

    # Check if token is active
    if not share_token.is_active:
        raise HTTPException(status_code=403, detail="This share link has been deactivated")

    # Check if token has expired
    if share_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=403, detail="This share link has expired")

    # Update access tracking only if explicitly requested
    if increment_view:
        share_token.access_count += 1
        share_token.last_accessed_at = datetime.utcnow()
        db.commit()

    # Get the report
    report = db.query(models.AIMHEIReport).filter(
        models.AIMHEIReport.id == share_token.report_id
    ).options(
        joinedload(models.AIMHEIReport.session).joinedload(models.VirtualPatientSession.case)
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Build response based on report type
    if report.report_type == 'standalone':
        response_item = schemas.CompletedReportDetail(
            report_name=report.report_name,
            ai_model=report.ai_model,
            hcp_name=report.hcp_name,
            hcp_year=report.hcp_year,
            patient_id=report.patient_id,
            interview_date=report.interview_date,
            human_supervisor=report.human_supervisor,
            aispe_location=report.aispe_location,
            total_points_earned=report.total_points_earned,
            total_points_possible=report.total_points_possible,
            percentage_score=report.percentage_score,
            information_section_score=report.information_section_score,
            skill_section_score=report.skill_section_score,
            medical_terminology_score=report.medical_terminology_score,
            politeness_score=report.politeness_score,
            empathy_score=report.empathy_score,
            unacceptable_areas=report.unacceptable_areas,
            improvement_areas=report.improvement_areas,
            section_summaries=report.section_summaries,
            strengths_weaknesses=report.strengths_weaknesses,
            rubric_detail=report.rubric_detail,
            status=report.status,
            report_type=report.report_type,
            report_id=report.id,
            session_id=None,
            case_title=report.report_name,
            created_at=report.created_at,
            updated_at=report.updated_at
        )
    else:
        # Virtual patient report
        if not report.session or not report.session.case:
            raise HTTPException(status_code=500, detail="Report data incomplete")

        response_item = schemas.CompletedReportDetail(
            report_name=report.report_name,
            ai_model=report.ai_model,
            hcp_name=report.hcp_name,
            hcp_year=report.hcp_year,
            patient_id=report.patient_id,
            interview_date=report.interview_date,
            human_supervisor=report.human_supervisor,
            aispe_location=report.aispe_location,
            total_points_earned=report.total_points_earned,
            total_points_possible=report.total_points_possible,
            percentage_score=report.percentage_score,
            information_section_score=report.information_section_score,
            skill_section_score=report.skill_section_score,
            medical_terminology_score=report.medical_terminology_score,
            politeness_score=report.politeness_score,
            empathy_score=report.empathy_score,
            unacceptable_areas=report.unacceptable_areas,
            improvement_areas=report.improvement_areas,
            section_summaries=report.section_summaries,
            strengths_weaknesses=report.strengths_weaknesses,
            rubric_detail=report.rubric_detail,
            status=report.status,
            report_type=report.report_type,
            report_id=report.id,
            session_id=report.session.id,
            case_title=report.session.case.title,
            created_at=report.created_at,
            updated_at=report.updated_at
        )

    return response_item

# === Report Organization Endpoints ===

@router.patch("/{report_id}/folder", response_model=schemas.AIMHEIReport)
async def update_report_folder(
    report_id: int,
    request: schemas.ReportFolderRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """Update folder for a report. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update folder")

    report = crud.update_report_folder(db, report_id, request.folder)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report

@router.post("/bulk-set-folder")
async def bulk_set_folder_to_reports(
    request: schemas.BulkFolderRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """Set folder for multiple reports. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can perform bulk operations")

    count = crud.bulk_set_folder(db, request.report_ids, request.folder)
    return {"message": f"Successfully set folder for {count} reports", "count": count} 