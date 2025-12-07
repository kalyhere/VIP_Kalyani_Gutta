from pydantic import BaseModel
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON, DateTime, Enum, Float, ARRAY, Table, Text, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy_utils import UUIDType
from sqlalchemy.orm import relationship, backref
from datetime import datetime
import enum
import uuid

class UserRole(str, enum.Enum):
    admin = "admin"
    faculty = "faculty"
    student = "student"

    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive lookup"""
        for member in cls:
            if member.value.lower() == value.lower():
                return member
        return None

class VirtualPatientSessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"  # Manually ended by student/faculty

try:
    from backend.database import Base
except ImportError:
    from database import Base

# Association table for many-to-many relationship between classes and students
class_enrollment = Table(
    'class_enrollment',
    Base.metadata,
    Column('class_id', Integer, ForeignKey('classes.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),  # Changed from student_id to user_id
    Column('enrolled_at', DateTime, default=datetime.utcnow),
    Column('is_active', Boolean, default=True)
)

# App and UserApp tables removed - using role-based access only

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)

    # Relationships
    created_cases = relationship("MedicalCase", back_populates="creator")
    faculty_assignments = relationship(
        "CaseAssignment",
        foreign_keys="[CaseAssignment.faculty_id]",
        back_populates="faculty"
    )
    student_assignments = relationship(
        "CaseAssignment",
        foreign_keys="[CaseAssignment.student_id]",
        back_populates="student"
    )
    classes = relationship(
        "Class",
        secondary=class_enrollment,
        back_populates="students",
        primaryjoin="and_(User.id==class_enrollment.c.user_id, User.role=='student')"
    )
    sessions = relationship("VirtualPatientSession", back_populates="user")

class JsonInfo(BaseModel):
    model: str
    formatting_process: str
    HCP_name: str
    HCP_year: int
    patient_ID: str
    human_supervisor: str
    interview_date: str
    aispe_location: str


class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    learning_objectives = Column(ARRAY(String), nullable=True, default=list)
    content = Column(JSONB, nullable=False)  # The full case JSON content
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_public = Column(Boolean, nullable=False, default=False, server_default="false")
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    # Relationships
    creator = relationship("User", back_populates="created_cases")
    assignments = relationship("CaseAssignment", back_populates="case", cascade="all, delete-orphan")
    sessions = relationship("VirtualPatientSession", back_populates="case")

    @property
    def assigned_students(self):
        """Get list of students this case is assigned to"""
        return [assignment.student for assignment in self.assignments]

    @property
    def assigned_faculties(self):
        """Get list of faculties who have assigned this case"""
        return [assignment.faculty for assignment in self.assignments]

    def can_access(self, user: User) -> bool:
        """Check if a user can access this case"""
        if user.role == UserRole.admin:
            return True
        if self.is_public:
            return True
        if self.created_by == user.id:
            return True
        # Check if user is a student assigned to this case
        if user.role == UserRole.student:
            return any(assignment.student_id == user.id for assignment in self.assignments)
        # Check if user is a faculty who assigned this case
        if user.role == UserRole.faculty:
            return any(assignment.faculty_id == user.id for assignment in self.assignments)
        return False

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)
    term = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    faculty_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    faculty = relationship("User", foreign_keys=[faculty_id], back_populates="classes")
    students = relationship(
        "User",
        secondary=class_enrollment,
        back_populates="classes",
        primaryjoin="and_(Class.id==class_enrollment.c.class_id, User.role=='student')"
    )
    assignments = relationship("CaseAssignment", back_populates="class_")

class CaseAssignment(Base):
    __tablename__ = "case_assignments"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey('medical_cases.id'), nullable=False)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    faculty_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    status = Column(Enum('not_started', 'in_progress', 'pending_review', 'reviewed', 'late', name='assignment_status'), default='not_started')
    report_id = Column(Integer, ForeignKey('aimhei_reports.id'), nullable=True)
    
    # Launch token fields
    current_launch_token = Column(String, nullable=True, index=True, unique=True)
    token_created_at = Column(DateTime, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    # Relationships with explicit foreign keys
    case = relationship("MedicalCase", back_populates="assignments")
    class_ = relationship("Class", back_populates="assignments")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_assignments")
    faculty = relationship("User", foreign_keys=[faculty_id], back_populates="faculty_assignments")
    report = relationship("AIMHEIReport", back_populates="assignment", uselist=False)
    
    @property
    def is_token_expired(self):
        """Check if current launch token has expired"""
        if not self.token_expires_at:
            return True
        return datetime.utcnow() > self.token_expires_at
    
    def generate_launch_token(self, db_session):
        """Generate a new launch token for this assignment"""
        import secrets
        from datetime import timedelta
        
        self.current_launch_token = secrets.token_urlsafe(32)
        self.token_created_at = datetime.utcnow()
        self.token_expires_at = datetime.utcnow() + timedelta(minutes=30)
        db_session.commit()
        return self.current_launch_token
    
    def clear_launch_token(self, db_session):
        """Clear the current launch token"""
        self.current_launch_token = None
        self.token_created_at = None
        self.token_expires_at = None
        db_session.commit()

class VirtualPatientSession(Base):
    __tablename__ = "virtual_patient_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # TODO: ARCHITECTURAL DEBT - user_id and case_id are redundant with assignment relationship
    # These could be removed in future refactor by updating 15+ endpoints to use:
    # - session.assignment.student_id instead of session.user_id  
    # - session.assignment.case_id instead of session.case_id
    # Currently kept for security filtering and backward compatibility
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(Integer, ForeignKey("medical_cases.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("case_assignments.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, nullable=True, index=True)
    status = Column(Enum(VirtualPatientSessionStatus), nullable=False, default=VirtualPatientSessionStatus.ACTIVE)
    interaction_count = Column(Integer, nullable=False, default=0)
    conversation_history = Column(JSONB, nullable=True)  # Store entire conversation as JSONB
    last_activity = Column(DateTime, nullable=True)  # Track when session was last active
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sessions")
    case = relationship("MedicalCase", back_populates="sessions")
    assignment = relationship("CaseAssignment", foreign_keys=[assignment_id])
    report = relationship("AIMHEIReport", back_populates="session", uselist=False)
    
    @property
    def expires_at(self):
        """Get expiry time from assignment due_date"""
        return self.assignment.due_date if self.assignment else None

    @property
    def is_expired(self):
        """Check if session has expired based on assignment due date"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    def check_and_update_expiry(self, db_session):
        """Check if session is expired and update status if needed"""
        if self.is_expired and self.status == VirtualPatientSessionStatus.ACTIVE:
            self.status = VirtualPatientSessionStatus.EXPIRED
            self.updated_at = datetime.utcnow()
            db_session.commit()
            return True
        return False

    @property
    def effective_status(self):
        """Get status with automatic expiry check (read-only)"""
        if self.is_expired and self.status == VirtualPatientSessionStatus.ACTIVE:
            return VirtualPatientSessionStatus.EXPIRED
        return self.status

class AIMHEIReport(Base):
    __tablename__ = "aimhei_reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("virtual_patient_sessions.id", ondelete="CASCADE"), nullable=True)
    report_type = Column(Enum('virtual_patient', 'standalone', name='report_type'), nullable=False, default='virtual_patient')

    # Analysis Configuration Fields (for both standalone and VP reports)
    report_name = Column(String, nullable=True)  # User-defined name for the analysis
    ai_model = Column(String, nullable=True)  # AI model used (gpt-4o, gpt-4o-mini, etc.)
    hcp_name = Column(String, nullable=True)  # Healthcare Provider Name
    hcp_year = Column(String, nullable=True)  # Academic Year
    patient_id = Column(String, nullable=True)  # Patient ID
    interview_date = Column(DateTime, nullable=True)  # Interview Date & Time
    human_supervisor = Column(String, nullable=True)  # Clinical Supervisor
    aispe_location = Column(String, nullable=True)  # Interview Location

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String)  # ACTIVE, COMPLETED, ERROR

    # Scores
    total_points_earned = Column(Float)
    total_points_possible = Column(Float)
    percentage_score = Column(Float)
    information_section_score = Column(Float)
    skill_section_score = Column(Float)
    medical_terminology_score = Column(Float)
    politeness_score = Column(Float)
    empathy_score = Column(Float)

    # Feedback
    unacceptable_areas = Column(JSONB, nullable=True)
    improvement_areas = Column(JSONB, nullable=True)
    section_summaries = Column(JSONB, nullable=True)
    rubric_detail = Column(JSONB, nullable=True)
    strengths_weaknesses = Column(JSONB, nullable=True)

    # Report Organization Fields (admin only)
    folder = Column(String, nullable=True, index=True)  # Single folder name

    # Relationships
    session = relationship("VirtualPatientSession", back_populates="report")
    assignment = relationship("CaseAssignment", back_populates="report", uselist=False)


class AIMHEIFolder(Base):
    __tablename__ = "aimhei_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReportShareToken(Base):
    __tablename__ = "report_share_tokens"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("aimhei_reports.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)  # Secure random token
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)  # Token expiration
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who created the link
    access_count = Column(Integer, default=0)  # Track how many times link was accessed
    last_accessed_at = Column(DateTime, nullable=True)  # Last access timestamp
    is_active = Column(Boolean, default=True)  # Can be deactivated without deleting

    # Relationships
    report = relationship("AIMHEIReport")
    created_by = relationship("User")


class UserInvitationToken(Base):
    __tablename__ = "user_invitation_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    used_by = relationship("User", foreign_keys=[used_by_user_id])


