from sqlalchemy import or_
from sqlalchemy.orm import Session, aliased, joinedload, contains_eager
from sqlalchemy.orm.query import Query as SAQuery
from sqlalchemy.orm.properties import ColumnProperty
from sqlalchemy.ext.declarative import DeclarativeMeta as Model
from sqlalchemy.inspection import inspect
from typing import Any, List, Type, Optional, Dict
from fastapi import Depends, HTTPException, Response, Query
from fastapi_crudrouter import SQLAlchemyCRUDRouter
from fastapi_crudrouter.core._types import PAGINATION, PYDANTIC_SCHEMA as SCHEMA
import json
from datetime import datetime, timedelta
import uuid
import secrets
from .models import User, AIMHEIReport, MedicalCase, VirtualPatientSession
from . import models, schemas


def get_col_names(model: Model, ignore_fields: List[str] = []) -> List[str]:
    """
    Returns all the column names of a model as an array of strings.
    Also returns related columns for relationships.
    """
    inspector = inspect(model)
    columns = [
        col.key
        for col in inspector.attrs
        if isinstance(col, ColumnProperty) and col.key not in ignore_fields
    ]

    # Check for relationships and include their columns if necessary
    for rel in inspector.relationships:
        related_model = rel.mapper.class_
        related_columns = [
            f"{rel.key}.{col.key}"
            for col in inspect(related_model).attrs
            if isinstance(col, ColumnProperty) and col.key not in ignore_fields
        ]
        columns.extend(related_columns)

    return columns


def apply_query_filter(query: SAQuery, model: Model, val: str) -> Any:
    """
    Perform a full-text search with any column being like val.
    """

    # model is a Student
    ignore_fields = ["hashed_password", "is_active"]
    col_names = get_col_names(model, ignore_fields=ignore_fields)
    columns = []

    # Aliases for joined tables to prevent ambiguous column names
    aliases = {}

    for col_name in col_names:
        # fixes the bug where searching for a student
        # by a query will also search in every column of interviews
        # since it is a related column
        if col_name in ignore_fields:
            continue

        if "." in col_name:
            # Handle related fields
            rel_name, rel_col_name = col_name.split(".", 1)
            if rel_name not in aliases:
                related_model = getattr(model, rel_name).mapper.class_
                aliases[rel_name] = aliased(related_model)
                query = query.outerjoin(aliases[rel_name], getattr(model, rel_name))
            column = getattr(aliases[rel_name], rel_col_name)
        else:
            column = getattr(model, col_name)

        columns.append(column)

    return query.filter(or_(*(column.like(val) for column in columns)))


class CustomSQLAlchemyCrudRouter(SQLAlchemyCRUDRouter):
    """
    Equivalent to SQLAlchemyCRUDRouter except this class
    returns a content-range header which represents the total number
    of objects in the table
    """

    def __init__(
        self,
        schema: Type[SCHEMA],
        db_model: Model,
        db: "Session",
        **kwargs: Any,
    ):
        super().__init__(
            schema=schema,
            db_model=db_model,
            db=db,
            **kwargs,
        )

    # TODO: support filters etc
    def _get_all(self, *args: Any, **kwargs: Any):
        def load_filters(filter_str: str) -> dict:
            """
            Converts a string of filters sent from react-admin to
            an object
            """
            try:
                parsed_filters = json.loads(filter_str) if filter_str else {}
                for key, val in parsed_filters.items():
                    if isinstance(val, str):
                        parsed_filters[key] = f"%{val}%"
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Error parsing filter")

            return parsed_filters

        def apply_filters(query: SAQuery, model: Model, filters: dict) -> Any:
            """
            Apply filters to the query.
            """
            for key, val in filters.items():
                if key == "q":
                    query = apply_query_filter(query, model, val)
                elif key == "ids":
                    query = get_users_by_ids_filter(query, model, val)
                elif key == "student":
                    query = get_student_by_email(query, val)
                else:
                    column = getattr(model, key, None)
                    if column:
                        query = query.filter(
                            column.like(val) if isinstance(val, str) else column == val
                        )
            return query

        def get_student_by_email(query, val: str) -> Any:
            return query.filter(User.email.like(val), User.role == "student")

        def get_users_by_ids_filter(query, model: Model, ids: List[int]) -> Any:
            return query.filter(getattr(model, "id").in_(ids))

        def route(
            response: Response,
            db: Session = Depends(self.db_func),
            pagination: PAGINATION = self.pagination,
            filter: Optional[str] = Query(None),
        ) -> List[Model]:
            parsed_filters = load_filters(filter)
            skip, limit = pagination.get("skip"), pagination.get("limit")

            query = db.query(self.db_model)
            query = apply_filters(query, self.db_model, parsed_filters)

            total_count = query.count()

            db_models: List[Model] = (
                query.order_by(getattr(self.db_model, self._pk))
                .limit(limit)
                .offset(skip)
                .all()
            )

            response.headers["content-range"] = str(total_count)

            return db_models

        return route


def create_initial_aimhei_report(db: Session, user_id: int, case_id: int) -> models.AIMHEIReport:
    """
    Creates the initial AIMHEIReport record when a session is launched.
    Generates the persistent attempt ID and a short-lived launch token.
    """
    launch_token = secrets.token_urlsafe(32)  # Generate a secure random token
    token_expiry_minutes = 5  # Set token lifespan (e.g., 5 minutes)
    token_expires_at = datetime.utcnow() + timedelta(minutes=token_expiry_minutes)

    db_report = models.AIMHEIReport(
        user_id=user_id,
        case_id=case_id,
        launch_token=launch_token,
        token_expires_at=token_expires_at,
        status=schemas.AIMHEIStatus.INITIATED
        # aimms_session_attempt_id will use the default uuid.uuid4 factory
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def verify_launch_token(db: Session, launch_token: str) -> models.AIMHEIReport | None:
    """
    Finds a report by launch token, verifies it's valid (not expired, not used),
    and marks the token as used.
    Returns the report object on success, None otherwise.
    """
    db_report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.launch_token == launch_token).first()

    if not db_report:
        print(f"Verify Token: Token not found: {launch_token}")
        return None # Token not found

    if db_report.token_used_at:
        print(f"Verify Token: Token already used at {db_report.token_used_at}")
        return None # Token already used

    if db_report.token_expires_at and db_report.token_expires_at < datetime.utcnow():
        print(f"Verify Token: Token expired at {db_report.token_expires_at}")
        db_report.status = schemas.AIMHEIStatus.FAILED_VERIFICATION
        db.commit()
        return None # Token expired

    # Verification successful: Mark token as used and set status to ACTIVE
    db_report.token_used_at = datetime.utcnow()
    db_report.status = schemas.AIMHEIStatus.ACTIVE
    # db_report.launch_token = None # Optionally clear the token after use
    db.commit()
    db.refresh(db_report)
    print(f"Verify Token: Success for attempt {db_report.aimms_session_attempt_id}")
    return db_report

def get_aimhei_report_by_attempt_id(db: Session, attempt_id: uuid.UUID) -> models.AIMHEIReport | None:
    """Gets an AIMHEIReport by its persistent aimms_session_attempt_id."""
    return db.query(models.AIMHEIReport).filter(models.AIMHEIReport.aimms_session_attempt_id == attempt_id).first()

def update_aimhei_report(db: Session, db_report: models.AIMHEIReport, update_data: schemas.AIMHEIReportUpdate) -> models.AIMHEIReport:
    """Updates an existing AIMHEIReport record using a Pydantic schema."""
    update_data_dict = update_data.dict(exclude_unset=True)
    for key, value in update_data_dict.items():
        setattr(db_report, key, value)

    # Ensure updated_at is set
    db_report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_report)
    return db_report

def get_completed_reports_for_user(db: Session, user_id: int) -> list[models.AIMHEIReport]:
    """Gets all completed AIMHEI reports for a specific user, joining session and case data."""
    # Query AIMHEIReport
    query = db.query(models.AIMHEIReport)
    query = query.join(models.AIMHEIReport.session) # Join the related VirtualPatientSession
    query = query.options(
        # Eager load the session along with the report
        contains_eager(models.AIMHEIReport.session)
        # Eager load the case associated with the session
        .joinedload(models.VirtualPatientSession.case)
    )
    # TODO: ARCHITECTURAL DEBT - This filter by user_id is redundant
    # Could be replaced with: .join(models.VirtualPatientSession.assignment).filter(models.CaseAssignment.student_id == user_id)
    # Requires updating ~15+ endpoints for security filtering migration
    query = query.filter(models.VirtualPatientSession.user_id == user_id)
    query = query.filter(models.AIMHEIReport.status == 'COMPLETED') # Use the actual status string or enum value
    query = query.order_by(models.AIMHEIReport.updated_at.desc())
    return query.all()

def get_aimhei_report(db: Session, report_id: int) -> Optional[models.AIMHEIReport]:
    """
    Get an AIMHEI report by its integer ID.
    """
    return db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()

def get_aimhei_reports_by_session(db: Session, session_id: str) -> List[models.AIMHEIReport]:
    """
    Get all AIMHEI reports for a specific virtual patient session_id.
    Note: session_id is nullable now, so this only finds reports after VP submission.
    """
    return db.query(models.AIMHEIReport).filter(models.AIMHEIReport.session_id == session_id).all()

def update_aimhei_report_status(db: Session, report_id: int, status: schemas.AIMHEIStatus) -> Optional[models.AIMHEIReport]:
    """
    Update the status of an AIMHEI report using its integer ID.
    Uses the AIMHEIStatus enum.
    """
    db_report = get_aimhei_report(db, report_id)
    if db_report:
        db_report.status = status # Assign enum directly
        db_report.updated_at = datetime.utcnow() # Ensure updated_at is set
        db.commit()
        db.refresh(db_report)
    return db_report

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_medical_case(db: Session, case_id: int) -> Optional[models.MedicalCase]:
    return db.query(models.MedicalCase).filter(models.MedicalCase.id == case_id).first()

def create_virtual_patient_session(
    db: Session, 
    user_id: int,  # TODO: ARCHITECTURAL DEBT - redundant with assignment.student_id
    case_id: int,  # TODO: ARCHITECTURAL DEBT - redundant with assignment.case_id  
    assignment_id: int,
    session_id: str = None, 
    status: str = "ACTIVE"
) -> VirtualPatientSession:
    # NOTE: user_id and case_id could be removed in future refactor
    # All data available via: assignment.student_id, assignment.case_id
    db_session = VirtualPatientSession(
        user_id=user_id,
        case_id=case_id,
        assignment_id=assignment_id,
        session_id=session_id,
        status=status
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_virtual_patient_session(db: Session, session_id: str) -> Optional[VirtualPatientSession]:
    return db.query(VirtualPatientSession).filter(VirtualPatientSession.session_id == session_id).first()

def get_virtual_patient_session_with_history(db: Session, session_id: str) -> Optional[VirtualPatientSession]:
    """Get a virtual patient session with its complete conversation history"""
    return db.query(VirtualPatientSession).filter(VirtualPatientSession.session_id == session_id).first()

def update_virtual_patient_session_status(db: Session, session_id: str, status: str) -> Optional[VirtualPatientSession]:
    db_session = get_virtual_patient_session(db, session_id)
    if db_session:
        db_session.status = status
        db.commit()
        db.refresh(db_session)
    return db_session

def update_virtual_patient_session_interaction_count(db: Session, session_id: str, interaction_count: int) -> Optional[VirtualPatientSession]:
    """Update the interaction count for a virtual patient session"""
    db_session = get_virtual_patient_session(db, session_id)
    if db_session:
        db_session.interaction_count = interaction_count
        db.commit()
        db.refresh(db_session)
    return db_session

def save_conversation_history(
    db: Session, 
    session_db_id: int, 
    conversation_history: List[dict]
) -> bool:
    """Save entire conversation history as JSONB."""
    try:
        session = db.query(VirtualPatientSession).filter(
            VirtualPatientSession.id == session_db_id
        ).first()
        
        if session:
            session.conversation_history = conversation_history
            session.last_activity = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"Error saving conversation history: {e}")
        return False

def get_conversation_history(db: Session, session_db_id: int) -> List[dict]:
    """Get conversation history for a session."""
    session = db.query(VirtualPatientSession).filter(
        VirtualPatientSession.id == session_db_id
    ).first()
    
    if session and session.conversation_history:
        return session.conversation_history
    return []

def clear_conversation_history(db: Session, session_db_id: int) -> bool:
    """Clear conversation history for a session."""
    try:
        session = db.query(VirtualPatientSession).filter(
            VirtualPatientSession.id == session_db_id
        ).first()
        
        if session:
            session.conversation_history = []
            session.last_activity = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"Error clearing conversation history: {e}")
        return False

def create_aimhei_report(db: Session, session_id: Optional[int], report_data: schemas.AIMHEIReportCreate) -> models.AIMHEIReport:
    db_report = models.AIMHEIReport(
        session_id=session_id,
        **report_data.dict()
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def update_aimhei_report(db: Session, db_report: models.AIMHEIReport, update_data: schemas.AIMHEIReportUpdate) -> models.AIMHEIReport:
    update_data_dict = update_data.dict(exclude_unset=True)
    for key, value in update_data_dict.items():
        setattr(db_report, key, value)
    db_report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_report)
    return db_report

# Class CRUD operations
def get_class(db: Session, class_id: int) -> Optional[models.Class]:
    """Get a class by its ID."""
    return db.query(models.Class).filter(models.Class.id == class_id).first()

def get_classes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    faculty_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> List[models.Class]:
    """Get a list of classes with optional filtering."""
    query = db.query(models.Class)
    
    if faculty_id is not None:
        query = query.filter(models.Class.faculty_id == faculty_id)
    if is_active is not None:
        query = query.filter(models.Class.is_active == is_active)
    
    classes = query.offset(skip).limit(limit).all()
    
    # Add student count to each class
    for class_obj in classes:
        class_obj.student_count = len(class_obj.students)
    
    return classes

def create_class(db: Session, class_data: schemas.ClassCreate) -> models.Class:
    """Create a new class."""
    db_class = models.Class(
        name=class_data.name,
        code=class_data.code,
        term=class_data.term,
        faculty_id=class_data.faculty_id,
        is_active=class_data.is_active
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def update_class(
    db: Session,
    class_id: int,
    class_data: schemas.ClassUpdate
) -> Optional[models.Class]:
    """Update a class."""
    db_class = get_class(db, class_id)
    if not db_class:
        return None
    
    update_data = class_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_class, field, value)
    
    db_class.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_class)
    return db_class

def delete_class(db: Session, class_id: int) -> bool:
    """Delete a class."""
    db_class = get_class(db, class_id)
    if not db_class:
        return False
    
    db.delete(db_class)
    db.commit()
    return True

# Class Enrollment operations
def enroll_student_in_class(
    db: Session,
    class_id: int,
    student_id: int
) -> bool:
    db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not db_class:
        raise ValueError("Class not found")

    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == "student"
    ).first()
    if not student:
        raise ValueError("Student not found")

    # Check if enrollment already exists in the junction table
    existing_enrollment = db.execute(
        models.class_enrollment.select().where(
            models.class_enrollment.c.class_id == class_id,
            models.class_enrollment.c.user_id == student_id
        )
    ).first()
    
    if existing_enrollment:
        return True  # Already enrolled, return success
    
    try:
        # Insert directly into the junction table
        db.execute(
            models.class_enrollment.insert().values(
                class_id=class_id,
                user_id=student_id,
                enrolled_at=datetime.utcnow(),
                is_active=True
            )
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        # Check if it's a duplicate key error
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            return True  # Already enrolled
        raise e

def unenroll_student_from_class(
    db: Session,
    class_id: int,
    student_id: int
) -> bool:
    # First check if class exists
    db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not db_class:
        return False

    # Check if student exists
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == "student"
    ).first()
    if not student:
        return False

    # Check if enrollment exists before trying to delete
    existing_enrollment = db.execute(
        models.class_enrollment.select().where(
            models.class_enrollment.c.class_id == class_id,
            models.class_enrollment.c.user_id == student_id
        )
    ).first()
    
    if not existing_enrollment:
        return True  # Already unenrolled, return success
    
    try:
        # Delete from the junction table directly
        db.execute(
            models.class_enrollment.delete().where(
                models.class_enrollment.c.class_id == class_id,
                models.class_enrollment.c.user_id == student_id
            )
        )
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error unenrolling student: {e}")
        return False

def get_class_students(
    db: Session,
    class_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not db_class:
        raise ValueError("Class not found")
    
    # Query students with their relationships
    return db.query(models.User).join(
        models.class_enrollment,
        models.User.id == models.class_enrollment.c.user_id
    ).filter(
        models.class_enrollment.c.class_id == class_id,
        models.User.role == "student"
    ).offset(skip).limit(limit).all()

# Case Assignment operations
def create_case_assignment(
    db: Session,
    assignment_data: schemas.CaseAssignmentCreate
) -> models.CaseAssignment:
    db_assignment = models.CaseAssignment(**assignment_data.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_case_assignment(
    db: Session,
    assignment_id: int
) -> Optional[models.CaseAssignment]:
    return db.query(models.CaseAssignment).filter(
        models.CaseAssignment.id == assignment_id
    ).first()

def get_class_assignments(
    db: Session,
    class_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
) -> List[models.CaseAssignment]:
    """Get assignments for a class with student data in a single query."""
    query = db.query(models.CaseAssignment).options(
        joinedload(models.CaseAssignment.case),
        joinedload(models.CaseAssignment.student),
        joinedload(models.CaseAssignment.faculty)
    ).filter(
        models.CaseAssignment.class_id == class_id
    )
    
    if status:
        query = query.filter(models.CaseAssignment.status == status)
    
    assignments = query.order_by(models.CaseAssignment.assigned_date.desc()).offset(skip).limit(limit).all()
    
    # Add session status and report info to each assignment
    for assignment in assignments:
        # Get the session for this assignment - MUST filter by assignment_id for proper isolation
        session = db.query(models.VirtualPatientSession).filter(
            models.VirtualPatientSession.user_id == assignment.student_id,
            models.VirtualPatientSession.case_id == assignment.case_id,
            models.VirtualPatientSession.assignment_id == assignment.id
        ).first()
        
        if session:
            assignment.session_status = session.status
            
            # If the assignment has a report_id, get the score from that report
            if assignment.report_id:
                report = db.query(models.AIMHEIReport).filter(
                    models.AIMHEIReport.id == assignment.report_id
                ).first()
                if report:
                    assignment.score = report.percentage_score
            else:
                assignment.score = None
        else:
            assignment.session_status = None
            assignment.score = None
    
    return assignments

def update_case_assignment(
    db: Session,
    assignment_id: int,
    assignment_data: schemas.CaseAssignmentUpdate
) -> Optional[models.CaseAssignment]:
    db_assignment = get_case_assignment(db, assignment_id)
    if not db_assignment:
        return None
    
    update_data = assignment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def delete_case_assignment(
    db: Session,
    assignment_id: int
) -> bool:
    db_assignment = get_case_assignment(db, assignment_id)
    if not db_assignment:
        return False
    
    db.delete(db_assignment)
    db.commit()
    return True

# === STUDENT CRUD FUNCTIONS ===

def get_student_classes(db: Session, student_id: int) -> List[models.Class]:
    """Get all classes that a student is enrolled in."""
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == models.UserRole.student
    ).first()
    
    if not student:
        return []
    
    return student.classes

def get_student_assignments(
    db: Session, 
    student_id: int, 
    class_id: Optional[int] = None
) -> List[models.CaseAssignment]:
    """Get all assignments for a student, optionally filtered by class."""
    query = db.query(models.CaseAssignment).options(
        joinedload(models.CaseAssignment.case),
        joinedload(models.CaseAssignment.class_),
        joinedload(models.CaseAssignment.faculty),
        joinedload(models.CaseAssignment.report)
    ).filter(
        models.CaseAssignment.student_id == student_id
    )
    
    if class_id:
        query = query.filter(models.CaseAssignment.class_id == class_id)
    
    return query.order_by(models.CaseAssignment.assigned_date.desc()).all()

def get_student_assignment(
    db: Session, 
    assignment_id: int, 
    student_id: int
) -> Optional[models.CaseAssignment]:
    """Get a specific assignment for a student."""
    return db.query(models.CaseAssignment).options(
        joinedload(models.CaseAssignment.case),
        joinedload(models.CaseAssignment.class_),
        joinedload(models.CaseAssignment.faculty),
        joinedload(models.CaseAssignment.report)
    ).filter(
        models.CaseAssignment.id == assignment_id,
        models.CaseAssignment.student_id == student_id
    ).first()

def get_student_report(
    db: Session, 
    report_id: int, 
    student_id: int
) -> Optional[models.AIMHEIReport]:
    """Get a report for a student (via their assignment), only if assignment status is 'reviewed'."""
    return db.query(models.AIMHEIReport).join(
        models.CaseAssignment,
        models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.AIMHEIReport.id == report_id,
        models.CaseAssignment.student_id == student_id,
        models.CaseAssignment.status == "reviewed"  # Only allow access when reviewed
    ).first()

def get_student_session(
    db: Session, 
    session_id: str, 
    student_id: int
) -> Optional[VirtualPatientSession]:
    """Get a virtual patient session for a student."""
    return db.query(VirtualPatientSession).filter(
        VirtualPatientSession.session_id == session_id,
        VirtualPatientSession.user_id == student_id
    ).first()

def get_student_stats(
    db: Session, 
    student_id: int
) -> Dict[str, Any]:
    """Get statistics for a student dashboard."""
    from sqlalchemy import func
    
    # Total assignments
    total_assigned = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == student_id
    ).count()
    
    # Completed assignments (with reports)
    completed = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == student_id,
        models.CaseAssignment.report_id.isnot(None)
    ).count()
    
    # Average score from reports
    avg_score_result = db.query(
        func.avg(models.AIMHEIReport.percentage_score)
    ).join(
        models.CaseAssignment, 
        models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == student_id,
        models.AIMHEIReport.percentage_score.isnot(None)
    ).scalar()
    
    average_score = round(avg_score_result or 0.0, 1)
    
    # Pending reports (reports that are completed but not yet reviewed/finalized)
    pending_reports = db.query(models.CaseAssignment).join(
        models.AIMHEIReport, 
        models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == student_id,
        models.CaseAssignment.status == "pending_review"
    ).count()
    
    return {
        "totalAssigned": total_assigned,
        "completed": completed,
        "averageScore": average_score,
        "pendingReports": pending_reports,
    }

def get_student_progress(db: Session, student_id: int, time_period: str) -> Dict[str, Any]:
    """Get a student's progress from a given time period (week, month, year)."""
    from sqlalchemy import func

    # Determine the estimated start date based on the given time period
    valid_periods = {"week", "month", "year"}
    if time_period not in valid_periods:
        raise ValueError(f"Invalid time_period: '{time_period}'. Must be one of {valid_periods}.")

    today = datetime.utcnow()
    match time_period:
        case "month":
            start_date = today - timedelta(days=30)
        case "week":
            start_date = today - timedelta(weeks=1)
        case "year":
            start_date = today - timedelta(days=365)

    # Total Assignments
    total_assigned = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == student_id,
        models.CaseAssignment.assigned_date >= start_date
    ).count()

    # Completed Assignments
    completed_status = ['pending_review', 'reviewed']
    total_completed = db.query(models.CaseAssignment).filter(
        models.CaseAssignment.student_id == student_id,
        models.CaseAssignment.assigned_date >= start_date,
        models.CaseAssignment.status.in_(completed_status)
    ).count()

    # Student Average Score Filtered By time_period
    report_query = db.query(func.avg(models.AIMHEIReport.percentage_score)
    ).join(
        models.CaseAssignment,
        models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == student_id,
        models.AIMHEIReport.percentage_score.isnot(None)
    )

    report_query = report_query.filter(
            models.AIMHEIReport.status == "COMPLETED",
            models.AIMHEIReport.updated_at >= start_date)
    average_score = round(report_query.scalar() or 0.0, 1)

    # Get The Progress Over Time
    trend_reports = db.query(models.AIMHEIReport).join(
        models.CaseAssignment,
        models.CaseAssignment.report_id == models.AIMHEIReport.id
    ).filter(
        models.CaseAssignment.student_id == student_id,
        models.AIMHEIReport.status == "COMPLETED",
        models.AIMHEIReport.updated_at >= start_date,
        models.AIMHEIReport.percentage_score.isnot(None)
    ).order_by(models.AIMHEIReport.updated_at).all()

    progress_over_time = [
        {"date": report.updated_at.isoformat(), "score": report.percentage_score}
        for report in trend_reports
    ]

    completion_rate = round((total_completed / total_assigned),
                            2) if total_assigned > 0 else 0.0

    return {
        "student_id": student_id,
        "time_period": time_period,
        "completion_rate": completion_rate,
        "average_score": average_score,
        "total_cases": total_assigned,
        "completed_cases": total_completed,
        "progress_over_time": progress_over_time
    }

def expire_outdated_sessions(db: Session) -> int:
    """
    Find and expire sessions that are past their assignment due date.
    Returns number of sessions expired.
    """
    from datetime import datetime
    
    # Find active sessions where assignment due_date has passed
    expired_sessions = db.query(VirtualPatientSession)\
        .join(VirtualPatientSession.assignment)\
        .filter(VirtualPatientSession.status == models.VirtualPatientSessionStatus.ACTIVE)\
        .filter(models.CaseAssignment.due_date < datetime.utcnow())\
        .all()
    
    expired_count = 0
    for session in expired_sessions:
        session.status = models.VirtualPatientSessionStatus.EXPIRED
        session.updated_at = datetime.utcnow()
        expired_count += 1
    
    if expired_count > 0:
        db.commit()
        print(f"Expired {expired_count} outdated virtual patient sessions")
    
    return expired_count

def get_virtual_patient_session_with_expiry_check(db: Session, session_id: str) -> Optional[VirtualPatientSession]:
    """Get session and automatically update expiry status if needed."""
    session = db.query(VirtualPatientSession).filter(VirtualPatientSession.session_id == session_id).first()
    if session:
        session.check_and_update_expiry(db)
    return session

# === Report Organization Functions ===

def update_report_folder(db: Session, report_id: int, folder: Optional[str]) -> Optional[models.AIMHEIReport]:
    """Update folder for a report."""
    report = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id == report_id).first()
    if report:
        report.folder = folder
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
    return report

def bulk_set_folder(db: Session, report_ids: List[int], folder: Optional[str]) -> int:
    """Set folder for multiple reports. Returns count of updated reports."""
    reports = db.query(models.AIMHEIReport).filter(models.AIMHEIReport.id.in_(report_ids)).all()
    updated_count = 0
    for report in reports:
        report.folder = folder
        report.updated_at = datetime.utcnow()
        updated_count += 1
    db.commit()
    return updated_count

def get_standalone_reports(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    archived: Optional[bool] = None,
    folder: Optional[str] = None,
    search: Optional[str] = None
) -> tuple[List[models.AIMHEIReport], int]:
    """
    Get standalone reports with optional filters for archive status, folder, and search.
    Returns tuple of (reports, total_count).
    """
    query = db.query(models.AIMHEIReport)\
        .filter(models.AIMHEIReport.report_type == 'standalone')

    # Filter by archive status
    if archived is not None:
        query = query.filter(models.AIMHEIReport.is_archived == archived)

    # Filter by folder
    if folder is not None:
        query = query.filter(models.AIMHEIReport.folder == folder)

    # Search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.AIMHEIReport.report_name.ilike(search_pattern),
                models.AIMHEIReport.hcp_name.ilike(search_pattern),
                models.AIMHEIReport.patient_id.ilike(search_pattern)
            )
        )

    # Get total count before pagination
    total = query.count()

    # Apply pagination and ordering
    reports = query.order_by(
        models.AIMHEIReport.is_archived.asc(),  # Active reports first
        models.AIMHEIReport.created_at.desc()
    ).offset(skip).limit(limit).all()

    return reports, total