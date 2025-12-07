from pydantic import BaseModel, Field
from fastapi import UploadFile, File
from typing import List, Optional, Dict, Any, Union, ForwardRef
from datetime import datetime
from enum import Enum
import uuid # Import uuid

# Forward reference for Class schema
Class = ForwardRef('Class')
CaseAssignment = ForwardRef('CaseAssignment')

class UserRole(str, Enum):
    admin = "admin"
    faculty = "faculty"
    student = "student"

class VirtualPatientSessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    is_active: bool = True
    role: UserRole

class UserCreate(UserBase):
    password: str  # Plain-text password (will be hashed)

class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    name: Optional[str] = None
    is_active: bool
    role: UserRole
    faculty: Optional["User"] = None
    classes: List["Class"] = []
    faculty_assignments: Optional[List["CaseAssignment"]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    case_assignments: Optional[List[CaseAssignment]] = None

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            list: lambda v: v
        }

# Update the Class schema to resolve the forward reference
User.update_forward_refs(Class=Class, CaseAssignment=CaseAssignment)

class StudentBase(BaseModel):
    email: str


class StudentRegister(StudentBase):
    password: str # plain text password from user (raw password)

class StudentCreate(StudentBase):
    hashed_password: str


class StudentUpdate(StudentBase):
    id: int
    email: str
    is_active: bool


class Student(StudentBase):
    id: int
    is_active: bool
    classes: List[Class] = []
    assignments: List[CaseAssignment] = []

    class Config:
        orm_mode = True


# class Transcript(BaseModel):
#     id = int

#     class Config:
#         orm_mode = True
# title = str
# src = str

class DifficultyLevel(str, Enum):
    beginner = "Beginner"
    intermediate = "Intermediate"
    advanced = "Advanced"

class MedicalCaseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    learning_objectives: List[str] = Field(default_factory=list)
    content: Dict[str, Any]  # The full case JSON content

class MedicalCaseCreate(MedicalCaseBase):
    is_public: bool = Field(default=False)

class MedicalCaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    learning_objectives: Optional[List[str]] = Field(default_factory=list)
    content: Optional[Dict[str, Any]]
    is_public: Optional[bool]
    is_active: Optional[bool]

class MedicalCase(MedicalCaseBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    is_public: bool
    is_active: bool
    assignments: List[CaseAssignment] = []

    class Config:
        orm_mode = True

class UserMedicalCaseBase(BaseModel):
    case_id: int
    user_id: int

class UserMedicalCaseCreate(UserMedicalCaseBase):
    pass

class UserMedicalCase(UserMedicalCaseBase):
    id: int
    assigned_at: datetime

    class Config:
        orm_mode = True

class CaseAssignmentBase(BaseModel):
    case_id: int
    class_id: int
    student_id: int
    faculty_id: int
    due_date: Optional[datetime] = None
    status: str = "not_started"
    report_id: Optional[int] = None

class CaseAssignmentCreate(CaseAssignmentBase):
    pass

class CaseAssignmentUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    report_id: Optional[int] = None

class CaseAssignment(CaseAssignmentBase):
    id: int
    assigned_date: datetime

    class Config:
        orm_mode = True

class CaseAssignmentWithDetails(CaseAssignment):
    case: MedicalCase
    student: User
    faculty: User
    session_status: Optional[str] = None
    report_id: Optional[int] = None

    class Config:
        orm_mode = True

class CaseMetadata(BaseModel):
    id: int
    title: str

    class Config:
        orm_mode = True

class AssignmentCase(BaseModel):
    id: int
    title: str
    learning_objectives: List[str] = Field(default_factory=list)

    class Config:
        orm_mode = True

class AssignmentFaculty(BaseModel):
    id: int
    email: str

    class Config:
        orm_mode = True

class ImprovedStudentCaseAssignmentResponse(BaseModel):
    id: int
    case: MedicalCase
    faculty: User
    assigned_date: datetime
    due_date: Optional[datetime]
    status: Optional[str]
    report_id: Optional[int]

    class Config:
        orm_mode = True

class StudentCaseAssignmentResponse(CaseAssignment):
    student: User

    class Config:
        orm_mode = True

class FacultyCaseAssignmentResponse(CaseAssignment):
    student: User

    class Config:
        orm_mode = True

class ConversationMessage(BaseModel):
    sender: str  # 'bot' or 'user'
    text: str

class VirtualPatientTranscript(BaseModel):
    conversation: List[ConversationMessage]
    session_id: str
    patient_id: str

class SubmitVirtualPatientRequest(BaseModel):
    session_id: str  # Virtual Patient session ID
    conversation: List[ConversationMessage]  # The conversation messages
    patient_id: Optional[str] = None

class TranscriptResponse(BaseModel):
    success: bool
    report_id: int
    status: str
    message: str

    class Config:
        orm_mode = True

# Add an Enum for AIMHEI Report Status
class AIMHEIStatus(str, Enum):
    INITIATED = "INITIATED"
    ACTIVE = "ACTIVE"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"
    FAILED_VERIFICATION = "FAILED_VERIFICATION"

# Add an Enum for AIMHEI Report Type
class AIMHEIReportType(str, Enum):
    virtual_patient = "virtual_patient"
    standalone = "standalone"

class AIMHEIReportBase(BaseModel):
    # Analysis Configuration Fields
    report_name: Optional[str] = None
    ai_model: Optional[str] = None
    hcp_name: Optional[str] = None
    hcp_year: Optional[str] = None
    patient_id: Optional[str] = None
    interview_date: Optional[datetime] = None
    human_supervisor: Optional[str] = None
    aispe_location: Optional[str] = None
    
    # Score Fields
    total_points_earned: Optional[float] = None
    total_points_possible: Optional[float] = None
    percentage_score: Optional[float] = None
    information_section_score: Optional[float] = None
    skill_section_score: Optional[float] = None
    medical_terminology_score: Optional[float] = None
    politeness_score: Optional[float] = None
    empathy_score: Optional[float] = None
    unacceptable_areas: Optional[List[str]] = Field(default=None)
    improvement_areas: Optional[List[str]] = Field(default=None)
    section_summaries: Optional[Dict[str, Any]] = Field(default=None)
    strengths_weaknesses: Optional[Dict[str, Any]] = Field(default=None)
    report_type: AIMHEIReportType = AIMHEIReportType.virtual_patient

class AIMHEIReportCreate(AIMHEIReportBase):
    session_id: Optional[int] = None

class AIMHEIReportUpdate(BaseModel):
    """Schema for updating an AIMHEI report."""
    total_points_earned: Optional[float] = None
    total_points_possible: Optional[float] = None
    percentage_score: Optional[float] = None
    information_section_score: Optional[float] = None
    skill_section_score: Optional[float] = None
    medical_terminology_score: Optional[float] = None
    politeness_score: Optional[float] = None
    empathy_score: Optional[float] = None
    unacceptable_areas: Optional[List[str]] = None
    improvement_areas: Optional[List[str]] = None
    section_summaries: Optional[Dict[str, Any]] = None
    strengths_weaknesses: Optional[Dict[str, Any]] = None
    rubric_detail: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True

class AIMHEIReport(AIMHEIReportBase):
    id: int
    session_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    folder: Optional[str] = None

    class Config:
        orm_mode = True
        use_enum_values = True

# VirtualPatientSession schemas
class VirtualPatientSessionBase(BaseModel):
    user_id: int
    case_id: int
    assignment_id: int
    session_id: Optional[str] = None
    status: Optional[VirtualPatientSessionStatus] = VirtualPatientSessionStatus.ACTIVE
    interaction_count: Optional[int] = 0

class VirtualPatientSessionCreate(VirtualPatientSessionBase):
    pass

class VirtualPatientSessionUpdate(BaseModel):
    status: Optional[VirtualPatientSessionStatus] = None
    interaction_count: Optional[int] = None

class VirtualPatientSession(BaseModel):
    id: int
    user_id: int
    case_id: int
    assignment_id: int
    session_id: Optional[str] = None
    status: VirtualPatientSessionStatus = VirtualPatientSessionStatus.ACTIVE
    interaction_count: int = 0
    conversation_history: Optional[List[dict]] = []  # JSONB array of conversation messages
    last_activity: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    report: Optional[AIMHEIReport] = None
    expires_at: Optional[datetime] = None  # Computed property from assignment.due_date (not a DB column)

    class Config:
        orm_mode = True
        from_attributes = True

# --- Schemas for New API Endpoints ---

# /api/virtual-patient/initiate
class InitiateRequest(BaseModel):
    case_id: int
    session_id: str  # Session ID from Virtual Patient service

class InitiateResponse(BaseModel):
    aimms_session_attempt_id: uuid.UUID
    launch_token: str

# /api/virtual-patient/verify-launch
class VerifyLaunchRequest(BaseModel):
    launch_token: str

class VerifyLaunchResponse(BaseModel):
    success: bool
    message: str
    aimms_session_attempt_id: Optional[uuid.UUID] = None # Send back attempt ID on success
    case_id: Optional[int] = None # Send back case ID on success

# Schema for student dashboard data
class AIMHEIReportSummary(BaseModel):
    id: int
    aimms_session_attempt_id: uuid.UUID
    case_title: str
    completed_at: Optional[datetime]
    percentage_score: Optional[float]
    status: AIMHEIStatus

    class Config:
        orm_mode = True
        use_enum_values = True

class VirtualPatientSessionWithReport(BaseModel):
    id: int
    user_id: int
    case_id: int
    session_id: Optional[str]
    status: VirtualPatientSessionStatus
    created_at: datetime
    updated_at: datetime
    report: Optional[AIMHEIReportBase] = None
    case: MedicalCase

    class Config:
        from_attributes = True

# Schema for the new completed reports endpoint
class CompletedReportInfo(BaseModel):
    report_id: int
    session_id: int  # The ID of the VirtualPatientSession
    case_title: str
    updated_at: datetime # Or completion_date if AIMHEIReport has a specific field

    class Config:
        orm_mode = True
        from_attributes = True # For Pydantic v2

# Schema for the detailed completed reports endpoint response
class CompletedReportDetail(AIMHEIReportBase): # Inherit scores/feedback from base
    report_id: int
    session_id: Optional[int] = None  # Nullable for standalone reports
    case_title: str
    created_at: datetime # When the report was first created
    updated_at: datetime # Use updated_at from the report as completion time
    rubric_detail: Optional[List[Dict[str, Any]]] = None # <-- Add rubric_detail field
    # We use List[Dict[str, Any]] for flexibility, or define a specific RubricItem schema
    percentile_rank: Optional[float] = None  # Percentile rank across all reports

    class Config:
        orm_mode = True

# Paginated response for reports list
class PaginatedReportsResponse(BaseModel):
    data: List[CompletedReportDetail]
    total: int
    skip: int
    limit: int

class ClassBase(BaseModel):
    name: str
    code: str
    term: str
    is_active: bool = True

class ClassCreate(ClassBase):
    faculty_id: int

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    term: Optional[str] = None
    is_active: Optional[bool] = None

class Class(ClassBase):
    id: int
    faculty_id: int
    created_at: datetime
    updated_at: datetime
    student_count: int = 0

    class Config:
        orm_mode = True

class ClassWithStudents(Class):
    students: List[User]

    class Config:
        orm_mode = True

class ClassWithAssignments(Class):
    assignments: List[CaseAssignment]

    class Config:
        orm_mode = True

class ClassAssignmentResponse(BaseModel):
    id: int
    case_id: int
    class_id: int
    student_id: int
    faculty_id: int
    assigned_date: datetime
    due_date: Optional[datetime]
    status: str
    report_id: Optional[int]
    case: MedicalCase
    student: User
    faculty: User
    session_status: Optional[str] = None

    class Config:
        orm_mode = True

class ClassStudentResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: UserRole
    is_active: bool

    class Config:
        orm_mode = True

class CaseAssignmentSummary(BaseModel):
    caseId: int
    title: str

    class Config:
        orm_mode = True

class FacultyStudentResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    is_active: bool
    case_assignments: List[CaseAssignmentSummary] = []

    class Config:
        orm_mode = True

# === STUDENT-SPECIFIC SCHEMAS ===

class StudentStats(BaseModel):
    totalAssigned: int
    completed: int
    averageScore: float
    pendingReports: int

class StudentUser(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    stats: StudentStats

    class Config:
        orm_mode = True

class StudentClass(BaseModel):
    id: int
    name: str
    code: str
    term: str
    faculty_name: Optional[str] = None
    faculty_email: Optional[str] = None
    assignedCases: int
    completedCases: int
    pendingReports: int

    class Config:
        orm_mode = True

class StudentCaseAssignmentDetail(BaseModel):
    assignmentId: int
    caseId: int
    caseTitle: str
    classId: int
    className: str
    facultyName: Optional[str] = None
    dueDate: Optional[datetime] = None
    status: str
    reportId: Optional[int] = None
    score: Optional[float] = None
    assignedDate: datetime
    submittedDate: Optional[datetime] = None
    learning_objectives: List[str] = []
    description: Optional[str] = None

    class Config:
        orm_mode = True

class StudentProgress(BaseModel):
    student_id: int
    time_period: str
    completion_rate: float
    average_score: float
    total_cases: int
    completed_cases: int
    progress_over_time: List[Dict[str, Any]]

    class Config:
        orm_mode = True

# Report Share Link schemas
class CreateShareLinkRequest(BaseModel):
    days_valid: int = Field(default=30, ge=1, le=365, description="Number of days the link should be valid")

class CreateShareLinkResponse(BaseModel):
    success: bool
    share_url: str
    token: str
    expires_at: datetime
    message: str

class ShareLinkInfo(BaseModel):
    token: str
    share_url: str
    expires_at: datetime
    access_count: int
    last_accessed_at: Optional[datetime]
    created_at: datetime

class SendShareLinkEmailRequest(BaseModel):
    recipient_email: str = Field(..., description="Recipient email address (must be @arizona.edu)")
    custom_message: Optional[str] = Field(None, max_length=500, description="Optional custom message to include in email")

class SendShareLinkEmailResponse(BaseModel):
    success: bool
    message: str
    recipient_email: str

# User Invitation Schemas
class InvitationCreate(BaseModel):
    email: str
    role: UserRole
    expires_in_days: int = 7  # Default 7 days expiration

class InvitationBase(BaseModel):
    id: int
    email: str
    role: UserRole
    token: str
    created_at: datetime
    expires_at: datetime
    is_used: bool
    used_at: Optional[datetime]
    created_by_user_id: int

    class Config:
        orm_mode = True

class InvitationWithUrl(InvitationBase):
    registration_url: str  # Full URL for user to register

class UserRegisterWithInvite(BaseModel):
    token: str
    name: str
    password: str

class InviteTokenValidation(BaseModel):
    valid: bool
    email: Optional[str] = None
    role: Optional[UserRole] = None
    error: Optional[str] = None

# Report Organization Schemas
class ReportFolderRequest(BaseModel):
    folder: Optional[str] = None

class BulkFolderRequest(BaseModel):
    report_ids: List[int]
    folder: Optional[str] = None

class FoldersResponse(BaseModel):
    folders: List[str]

# Update forward references after all models are defined
Student.update_forward_refs(Class=Class, CaseAssignment=CaseAssignment)
MedicalCase.update_forward_refs(CaseAssignment=CaseAssignment)

User.update_forward_refs()
