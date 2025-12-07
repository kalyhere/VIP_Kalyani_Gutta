from fastapi import APIRouter, Depends, HTTPException, Security, Header
from sqlalchemy.orm import Session, joinedload, contains_eager
from datetime import datetime
from sqlalchemy import or_, desc
from .. import crud, schemas, models
from ..database import get_db
from ..auth import get_current_active_user
from .token_storage import get_token, remove_token

router = APIRouter(
    prefix="/api/virtual-patient",
    tags=["virtual-patient"],
    responses={404: {"description": "Not found"}},
)

@router.get("/active-session/{case_id}", response_model=schemas.VirtualPatientSession)
async def get_active_session(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get the active session for a case if one exists.
    Returns 404 if no active session is found.
    Scoped to the most recent valid assignment to prevent cross-assignment session sharing.
    """
    # Find the most recent valid assignment for this case and user
    current_utc = datetime.utcnow()
    case_assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.case_id == case_id,
        models.CaseAssignment.student_id == current_user.id,
        or_(
            models.CaseAssignment.due_date == None,  # Include assignments with no due date
            models.CaseAssignment.due_date > current_utc  # Only include non-expired assignments
        )
    ).order_by(desc(models.CaseAssignment.assigned_date)).first()

    if not case_assignment:
        raise HTTPException(status_code=404, detail="No valid assignment found for this case")

    # Look for active session scoped to this specific assignment
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.user_id == current_user.id,
        models.VirtualPatientSession.case_id == case_id,
        models.VirtualPatientSession.assignment_id == case_assignment.id,
        models.VirtualPatientSession.status == models.VirtualPatientSessionStatus.ACTIVE
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    
    return session

@router.post("/initiate", response_model=schemas.VirtualPatientSession)
async def initiate_virtual_patient_session(
    initiate_request: schemas.InitiateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Initiates or reactivates a virtual patient session attempt.
    If any session exists (active or not), reactivates that session.
    Only creates a new session if none exists for this case.
    """
    medical_case = crud.get_medical_case(db, case_id=initiate_request.case_id)
    if not medical_case:
        raise HTTPException(status_code=404, detail="Medical case not found")

    if not medical_case.can_access(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    # Check if the case is expired by finding the most recent non-expired assignment
    current_utc = datetime.utcnow()
    case_assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.case_id == initiate_request.case_id,
        models.CaseAssignment.student_id == current_user.id,
        or_(
            models.CaseAssignment.due_date == None,  # Include assignments with no due date
            models.CaseAssignment.due_date > current_utc  # Only include non-expired assignments
        )
    ).order_by(desc(models.CaseAssignment.assigned_date)).first()  # Get the most recent valid assignment

    if not case_assignment:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Cannot start a new session - no valid assignment found for this case",
                "debug_info": {
                    "current_utc": current_utc.isoformat(),
                    "case_id": initiate_request.case_id,
                    "student_id": current_user.id
                }
            }
        )

    if case_assignment.due_date and current_utc > case_assignment.due_date:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Cannot start a new session for an expired case",
                "debug_info": {
                    "current_utc": current_utc.isoformat(),
                    "due_date_utc": case_assignment.due_date.isoformat(),
                    "is_expired": True,
                    "assignment_id": case_assignment.id
                }
            }
        )


    # Create new session
    try:
        session = crud.create_virtual_patient_session(
            db=db,
            user_id=current_user.id,
            case_id=initiate_request.case_id,
            assignment_id=case_assignment.id,
            session_id=initiate_request.session_id
        )
    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate session")

    return session

@router.post("/report", response_model=schemas.AIMHEIReport)
async def create_aimhei_report(
    report_data: schemas.AIMHEIReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Create an AIMHEI report for a given session.
    """
    # Check session exists and belongs to user
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == report_data.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    report = crud.create_aimhei_report(db, session_id=session.session_id, report_data=report_data)
    return report

@router.get("/session-status/{session_id}", response_model=schemas.VirtualPatientSession)
async def get_session_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get the status of a virtual patient session by session ID.
    """
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    return session

@router.post("/update-activity/{session_id}", response_model=schemas.VirtualPatientSession)
async def update_session_activity(
    session_id: str,
    status: str = "ACTIVE",
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Update the status/activity of a session.
    """
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    
    session.status = status
    db.commit()
    db.refresh(session)
    return session

@router.get("/case-history", response_model=list[schemas.VirtualPatientSessionWithReport])
async def get_case_history(
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
) -> list[schemas.VirtualPatientSessionWithReport]:
    """
    Get the case history for the current user, including completed, active, and expired sessions.
    Returns a list of sessions with their associated reports and case information.
    """
    # Query sessions with eager loading (as before)
    db_sessions = db.query(models.VirtualPatientSession).options(
        joinedload(models.VirtualPatientSession.report),
        joinedload(models.VirtualPatientSession.case)
    ).filter(
        models.VirtualPatientSession.user_id == current_user.id,
        models.VirtualPatientSession.status.in_([
            models.VirtualPatientSessionStatus.ACTIVE, 
            models.VirtualPatientSessionStatus.COMPLETED, 
            models.VirtualPatientSessionStatus.EXPIRED
        ])
    ).order_by(models.VirtualPatientSession.updated_at.desc()).all()

    # Manually construct the response list using the Pydantic schema
    response_list: list[schemas.VirtualPatientSessionWithReport] = []
    for session in db_sessions:
        # Ensure case data is loaded (should be handled by joinedload)
        if session.case is None:
            print(f"Warning: Session ID {session.id} missing associated case data.")
            continue
            
        # Manually convert nested ORM objects to Pydantic schemas first
        report_schema = None
        if session.report:
            try:
                # Assuming Pydantic v1 or v2 with from_attributes enabled
                report_schema = schemas.AIMHEIReportBase.from_orm(session.report)
            except Exception as e:
                print(f"Error converting report for session {session.id}: {e}")
                # Decide how to handle: skip, return partial, etc.
                # For now, we might allow it to proceed without the report
                report_schema = None 
        
        case_schema = None
        try:
            case_schema = schemas.MedicalCase.from_orm(session.case)
        except Exception as e:
             print(f"Error converting case for session {session.id}: {e}")
             # This is more critical, maybe skip this session entirely
             continue

        # Now construct the final response item using the Pydantic schemas
        try:
            response_item = schemas.VirtualPatientSessionWithReport(
                id=session.id,
                user_id=session.user_id,
                case_id=session.case_id,
                session_id=session.session_id,
                status=session.status,
                created_at=session.created_at,
                updated_at=session.updated_at,
                report=report_schema, # Pass the converted Pydantic schema or None
                case=case_schema      # Pass the converted Pydantic schema
            )
            response_list.append(response_item)
        except Exception as e:
            # Catch potential validation errors during final object creation
            print(f"Error creating VirtualPatientSessionWithReport for session {session.id}: {e}")

    return response_list

# --- New Endpoint for Completed Reports ---

@router.get("/aimhei-reports/completed", response_model=list[schemas.CompletedReportDetail])
async def get_my_completed_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get a list of completed AIMHEI reports for the current user, including full report details.
    """
    completed_reports = crud.get_completed_reports_for_user(db, user_id=current_user.id)

    # Manually construct response to fit CompletedReportDetail schema
    response_list: list[schemas.CompletedReportDetail] = []
    for report in completed_reports:
        if not report.session or not report.session.case:
            print(f"Warning: Report ID {report.id} missing session or case data during response construction.")
            continue
            
        try:
            # Manually instantiate the schema, passing all required fields
            response_item = schemas.CompletedReportDetail(
                # Analysis Configuration Fields (metadata) - inherited from AIMHEIReportBase
                report_name=report.report_name,
                ai_model=report.ai_model,
                hcp_name=report.hcp_name,
                hcp_year=report.hcp_year,
                patient_id=report.patient_id,
                interview_date=report.interview_date,
                human_supervisor=report.human_supervisor,
                aispe_location=report.aispe_location,
                # Score Fields - inherited from AIMHEIReportBase
                total_points_earned=report.total_points_earned,
                total_points_possible=report.total_points_possible,
                percentage_score=report.percentage_score,
                information_section_score=report.information_section_score,
                skill_section_score=report.skill_section_score,
                medical_terminology_score=report.medical_terminology_score,
                politeness_score=report.politeness_score,
                empathy_score=report.empathy_score,
                # Feedback Fields - inherited from AIMHEIReportBase  
                unacceptable_areas=report.unacceptable_areas,
                improvement_areas=report.improvement_areas,
                section_summaries=report.section_summaries,
                # Report Status and Type
                status=report.status, # This will be 'COMPLETED' due to the query filter
                report_type=report.report_type,
                # Additional fields specific to CompletedReportDetail
                report_id=report.id,
                session_id=report.session.id,
                case_title=report.session.case.title,
                created_at=report.created_at, # Field from AIMHEIReport
                updated_at=report.updated_at # Field from AIMHEIReport
            )
            response_list.append(response_item)
        except Exception as e:
            # Catch potential validation errors during manual creation
            print(f"Error creating CompletedReportDetail for report {report.id}: {e}")

    return response_list

@router.get("/aimhei-reports/{report_id}", response_model=schemas.CompletedReportDetail)
async def get_single_completed_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get the full details of a single completed AIMHEI report by its ID.
    Ensures the report belongs to the current user.
    """
    # Query the specific report, joining session and case, and filtering by user
    report = db.query(models.AIMHEIReport)\
        .join(models.AIMHEIReport.session)\
        .options(
            contains_eager(models.AIMHEIReport.session)
            .joinedload(models.VirtualPatientSession.case)
        )\
        .filter(models.AIMHEIReport.id == report_id)\
        .filter(models.VirtualPatientSession.user_id == current_user.id)\
        .filter(models.AIMHEIReport.status == 'COMPLETED')\
        .first()
    
    # TODO: ARCHITECTURAL DEBT - user_id filtering above is redundant with assignment relationship
    # Future refactor could use: .join(assignment).filter(CaseAssignment.student_id == current_user.id)

    if not report:
        raise HTTPException(status_code=404, detail="Completed report not found or not accessible")

    # Manually construct the response to ensure all fields are included
    try:
        response_item = schemas.CompletedReportDetail(
            # Analysis Configuration Fields (metadata) - inherited from AIMHEIReportBase
            report_name=report.report_name,
            ai_model=report.ai_model,
            hcp_name=report.hcp_name,
            hcp_year=report.hcp_year,
            patient_id=report.patient_id,
            interview_date=report.interview_date,
            human_supervisor=report.human_supervisor,
            aispe_location=report.aispe_location,
            # Score Fields - inherited from AIMHEIReportBase
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
            rubric_detail=report.rubric_detail, # Include the rubric detail
            status=report.status,
            report_type=report.report_type,
            # Additional fields specific to CompletedReportDetail
            report_id=report.id,
            session_id=report.session.id,
            case_title=report.session.case.title,
            created_at=report.created_at,
            updated_at=report.updated_at
        )
        return response_item
    except Exception as e:
        # Catch potential validation errors during manual creation
        print(f"Error creating CompletedReportDetail for single report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Error processing report data")

@router.put("/aimhei-reports/{report_id}", response_model=schemas.CompletedReportDetail)
async def update_aimhei_report(
    report_id: int,
    report_data: schemas.AIMHEIReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Update an existing AIMHEI report. Only faculty and admin can update reports.
    """
    # Check if user is faculty or admin
    if current_user.role not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and admin can update reports")

    # Get the report
    report = db.query(models.AIMHEIReport)\
        .join(models.AIMHEIReport.session)\
        .options(
            contains_eager(models.AIMHEIReport.session)
            .joinedload(models.VirtualPatientSession.case)
        )\
        .filter(models.AIMHEIReport.id == report_id)\
        .first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update the report
    updated_report = crud.update_aimhei_report(db, report, report_data)
    return updated_report

@router.post("/session-complete", response_model=dict)
async def report_session_complete(
    session_data: dict,
    db: Session = Depends(get_db)
):
    """
    Called by virtual patient when a session is completed.
    Creates a virtual patient session record in AIMMS for tracking.
    """
    assignment_id = session_data.get("assignmentId")
    vp_session_id = session_data.get("sessionId")
    
    if not assignment_id or not vp_session_id:
        raise HTTPException(status_code=400, detail="assignmentId and sessionId are required")
    
    # Get the assignment
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Create a virtual patient session record for tracking
    session = crud.create_virtual_patient_session(
        db=db,
        user_id=assignment.student_id,
        case_id=assignment.case_id,
        session_id=vp_session_id,
        status="COMPLETED"
    )
    
    # Update assignment status
    assignment.status = "completed"
    db.commit()
    
    return {
        "status": "success",
        "message": "Session completion recorded",
        "aimms_session_id": session.id
    }

@router.get("/assignment/{assignment_id}/case", response_model=dict)
async def get_case_by_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    """
    Get case data for a virtual patient assignment.
    This endpoint is called by the virtual patient simulation to get case information.
    Requires API key authentication for service-to-service security.
    """
    # Get the assignment and verify it exists and is not completed
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == assignment_id,
        models.CaseAssignment.status.in_(["not_started", "in_progress"])
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or already completed")
    
    # Get the case data
    case = db.query(models.MedicalCase).filter(
        models.MedicalCase.id == assignment.case_id
    ).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return {
        "assignment_id": assignment_id,
        "case_id": case.id,
        "title": case.title,
        "description": case.description,
        "content": case.content,
        "learning_objectives": case.learning_objectives,
        "user_id": assignment.student_id,
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None
    }

@router.post("/verify-launch", response_model=dict)
async def verify_launch_token(
    verify_request: schemas.VerifyLaunchRequest,
    db: Session = Depends(get_db)
):
    """
    Verify a launch token and return case data with session resumption support.
    Supports reusable tokens that remain valid until assignment due date.
    Virtual Patient backend will manage session creation.
    """
    # Use the database-backed token storage system
    launch_data = get_token(verify_request.launch_token, db)
    
    # DEBUG: Log what tokens we have
    print(f"🔍 DEBUG verify-launch: Looking for token: {verify_request.launch_token}")
    print(f"🔍 DEBUG verify-launch: Token found: {launch_data is not None}")
    
    if not launch_data:
        raise HTTPException(status_code=404, detail="Invalid launch token")
    
    # Get the assignment and verify it's still valid
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == launch_data["assignment_id"],
        models.CaseAssignment.student_id == launch_data["user_id"],
        models.CaseAssignment.status.in_(["not_started", "in_progress"])
    ).first()
    
    if not assignment:
        # Remove invalid token
        if not launch_data.get("reusable"):
            remove_token(verify_request.launch_token, db)
        raise HTTPException(status_code=404, detail="Assignment not found or already completed")
    
    # Get the case data
    case = db.query(models.MedicalCase).filter(
        models.MedicalCase.id == launch_data["case_id"]
    ).first()
    
    if not case:
        # Remove invalid token
        if not launch_data.get("reusable"):
            remove_token(verify_request.launch_token, db)
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check for existing ACTIVE virtual patient sessions only
    # Only ACTIVE sessions should be resumed - COMPLETED sessions should not be resumed
    # IMPORTANT: Filter by assignment_id to ensure sessions are isolated per assignment
    existing_sessions = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.user_id == launch_data["user_id"],
        models.VirtualPatientSession.case_id == launch_data["case_id"],
        models.VirtualPatientSession.assignment_id == launch_data["assignment_id"],
        models.VirtualPatientSession.status == "ACTIVE"
    ).order_by(models.VirtualPatientSession.updated_at.desc()).all()
    
    response_data = {
        "success": True,
        "assignment_id": launch_data["assignment_id"],
        "case_id": case.id,
        "title": case.title,
        "description": case.description,
        "content": case.content,
        "learning_objectives": case.learning_objectives,
        "user_id": launch_data["user_id"],
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        # Provide info about existing sessions for Virtual Patient to decide resumption
        "has_previous_sessions": len(existing_sessions) > 0 or launch_data.get("has_previous_sessions", False),
        "latest_session_id": existing_sessions[0].session_id if existing_sessions else launch_data.get("latest_session_id"),
        "session_count": len(existing_sessions)
    }
    
    # Don't remove the token - it's reusable until assignment due date
    # This allows multiple launches of the same assignment
    
    return response_data 

@router.post("/register-session", response_model=dict)
async def register_virtual_patient_session(
    session_data: dict,
    db: Session = Depends(get_db)
):
    """
    Register a new virtual patient session created by the Virtual Patient backend.
    Called when Virtual Patient creates a new session so AIMMS can track it for resumption.
    Validates assignment ownership for security.
    """
    print(f"🔍 DEBUG: register-session called with data: {session_data}")
    assignment_id = session_data.get("assignment_id")
    session_id = session_data.get("session_id")
    user_id = session_data.get("user_id")  # Add user_id for verification
    
    if not assignment_id or not session_id or not user_id:
        raise HTTPException(status_code=400, detail="assignment_id, session_id, and user_id are required")
    
    # Get the assignment and verify ownership
    assignment = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == assignment_id,
        models.CaseAssignment.student_id == user_id,  # Verify ownership
        models.CaseAssignment.status.in_(["not_started", "in_progress"])
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found, not owned by user, or not active")
    
    # Check if session already exists
    existing_session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == session_id
    ).first()
    
    if existing_session:
        # Verify existing session belongs to the same user
        if existing_session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Session belongs to different user")
        
        return {
            "status": "success",
            "message": "Session already registered",
            "session_id": session_id,
            "aimms_session_id": existing_session.id
        }
    
    # Create new session record
    try:
        vp_session = crud.create_virtual_patient_session(
            db=db,
            user_id=user_id,
            case_id=assignment.case_id,
            assignment_id=assignment_id,
            session_id=session_id,
            status="ACTIVE"
        )
        
        # Update assignment status to in_progress if not already
        if assignment.status == "not_started":
            assignment.status = "in_progress"
            db.commit()
        
        return {
            "status": "success",
            "message": "Session registered successfully",
            "session_id": session_id,
            "aimms_session_id": vp_session.id
        }
        
    except Exception as e:
        print(f"Error registering session: {e}")
        raise HTTPException(status_code=500, detail="Failed to register session") 

@router.post("/save-conversation", response_model=dict)
async def save_conversation_history(
    conversation_data: dict,
    db: Session = Depends(get_db)
):
    """
    Save conversation history for a virtual patient session.
    Called by Virtual Patient backend to persist conversation state.
    """
    session_id = conversation_data.get("session_id")
    conversation_history = conversation_data.get("conversation_history", [])
    interaction_count = conversation_data.get("interaction_count", 0)
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Get the session
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update interaction count
    session.interaction_count = interaction_count
    
    # Save conversation history
    success = crud.save_conversation_history(
        db=db,
        session_db_id=session.id,
        conversation_history=conversation_history
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save conversation history")
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Conversation history saved",
        "session_id": session_id,
        "exchanges_saved": len(conversation_history)  # conversation exchanges
    }

@router.get("/conversation-history/{session_id}", response_model=dict)
async def get_conversation_history(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Get conversation history for a virtual patient session.
    Returns conversation in the format expected by Virtual Patient frontend.
    """
    # Get the session with conversation history
    session = crud.get_virtual_patient_session_with_history(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify session ownership
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    
    # Get conversation history directly from JSONB field
    conversation_history = session.conversation_history or []
    
    # Convert to previous_messages format for compatibility
    previous_messages = []
    if conversation_history:
        for i, msg in enumerate(conversation_history):
            if isinstance(msg, dict):
                if 'doctor' in msg and msg['doctor']:
                    previous_messages.append({
                        "id": f"doctor-{i}",
                        "type": "user",
                        "content": msg['doctor'],
                        "timestamp": f"{i * 2}"
                    })
                if 'patient' in msg and msg['patient']:
                    previous_messages.append({
                        "id": f"patient-{i}",
                        "type": "assistant", 
                        "content": msg['patient'],
                        "timestamp": f"{i * 2 + 1}"
                    })
    
    return {
        "status": "success",
        "session_id": session_id,
        "interaction_count": session.interaction_count,
        "conversation_history": conversation_history,
        "previous_messages": previous_messages,
        "session_status": session.status
    }

@router.post("/update-session-data", response_model=dict)
async def update_session_data(
    session_update: dict,
    db: Session = Depends(get_db)
):
    """
    Update session data including conversation history and interaction count.
    Called by Virtual Patient backend during chat interactions.
    """
    session_id = session_update.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Get the session
    session = db.query(models.VirtualPatientSession).filter(
        models.VirtualPatientSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update fields if provided
    if "interaction_count" in session_update:
        session.interaction_count = session_update["interaction_count"]
    
    if "status" in session_update:
        session.status = session_update["status"]
    
    # Update conversation history if provided
    if "conversation_history" in session_update:
        session.conversation_history = session_update["conversation_history"]
        session.last_activity = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Session data updated",
        "session_id": session_id
    }

@router.get("/conversation-history-internal/{session_id}", response_model=dict)
async def get_conversation_history_internal(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get conversation history for a virtual patient session.
    Internal endpoint for service-to-service calls (no authentication required).
    """
    # Get the session with conversation history and related case data
    session = crud.get_virtual_patient_session_with_history(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get conversation history directly from JSONB field
    conversation_history = session.conversation_history or []
    
    # Convert to previous_messages format for compatibility
    previous_messages = []
    if conversation_history:
        for i, msg in enumerate(conversation_history):
            if isinstance(msg, dict):
                if 'doctor' in msg and msg['doctor']:
                    previous_messages.append({
                        "id": f"doctor-{i}",
                        "type": "user",
                        "content": msg['doctor'],
                        "timestamp": f"{i * 2}"
                    })
                if 'patient' in msg and msg['patient']:
                    previous_messages.append({
                        "id": f"patient-{i}",
                        "type": "assistant", 
                        "content": msg['patient'],
                        "timestamp": f"{i * 2 + 1}"
                    })
    
    # Get case data from the medical case content
    case_data = {}
    if session.case and session.case.content:
        case_data = session.case.content
    
    return {
        "status": "success",
        "session_id": session_id,
        "interaction_count": session.interaction_count,
        "conversation_history": conversation_history,
        "previous_messages": previous_messages,
        "session_status": session.status,
        "case_data": case_data,  # Return case data from MedicalCase.content instead of session_data
        "expires_at": session.expires_at.isoformat() if session.expires_at else None
    } 

@router.post("/expire-outdated-sessions", response_model=dict)
async def expire_outdated_sessions_endpoint(
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_active_user)
):
    """
    Manually trigger expiry of outdated sessions (admin only).
    This endpoint can be called by a cron job or scheduled task.
    """
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Only administrators can expire sessions")
    
    expired_count = crud.expire_outdated_sessions(db)
    
    return {
        "success": True,
        "message": f"Expired {expired_count} outdated sessions",
        "expired_count": expired_count
    } 