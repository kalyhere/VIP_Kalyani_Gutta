import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Grid2 as Grid,
  Chip,
  Avatar,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  CardActionArea,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
  useTheme,
  Theme,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from "@mui/material"
import { SxProps } from "@mui/system"
import {
  People as PeopleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  LocalHospital as CasesIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  PersonRemove as PersonRemoveIcon,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserManagement,
  ClassManagement,
  CaseManagement,
  AssignmentManagement,
} from "@/pages/admin/components"
import { adminApiClient } from "@/services/adminApiClient"
import { AssignmentsDataGrid } from "@/features/assignments"
import { ClassAssignmentStatus } from "@/types/faculty-types"
import { AssignmentStatus } from "@/constants/assignmentStatus"

// Create motion-compatible Box
const MotionBox = motion.create(Box)

// Fade animation variants (from FacultyDashboard)
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Mock data types
interface ClassData {
  id: number
  name: string
  code: string
  facultyName: string
  studentCount: number
  assignmentCount: number
  status: "active" | "inactive"
  description: string
  facultyId: number
  term?: string
  students?: any[]
}

interface StudentAssignment {
  id?: number
  assignmentId?: number
  caseId?: number
  caseTitle: string
  studentId?: number
  studentName: string
  classId?: number
  className?: string
  facultyName?: string
  dueDate: string | null
  status: AssignmentStatus
  reportId?: number | null
  score: number | null
  assignedDate?: string
  submittedDate?: string | null
  learning_objectives?: string[]
  description?: string | null
  attempts?: number
  timeSpent?: number
}

interface FacultyData {
  id: number
  name: string
  email: string
  department: string
}

interface StudentData {
  id: number
  name: string
  email: string
}

interface CreateClassForm {
  name: string
  code: string
  term: string
  description: string
  facultyId: number | null
}

// Mock faculty data
const mockFaculty: FacultyData[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    department: "Internal Medicine",
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    email: "michael.chen@university.edu",
    department: "Emergency Medicine",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@university.edu",
    department: "Pediatrics",
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    email: "james.wilson@university.edu",
    department: "Internal Medicine",
  },
  {
    id: 5,
    name: "Dr. Lisa Thompson",
    email: "lisa.thompson@university.edu",
    department: "Surgery",
  },
]

// Mock student data
const mockStudents: StudentData[] = [
  { id: 1, name: "Alice Johnson", email: "alice.j@student.edu" },
  { id: 2, name: "Bob Smith", email: "bob.s@student.edu" },
  { id: 3, name: "Carol Davis", email: "carol.d@student.edu" },
  { id: 4, name: "David Wilson", email: "david.w@student.edu" },
  { id: 5, name: "Eva Martinez", email: "eva.m@student.edu" },
  { id: 6, name: "Frank Brown", email: "frank.b@student.edu" },
  { id: 7, name: "Grace Taylor", email: "grace.t@student.edu" },
  { id: 8, name: "Henry Lee", email: "henry.l@student.edu" },
  { id: 9, name: "Iris Wang", email: "iris.w@student.edu" },
  { id: 10, name: "Jack Davis", email: "jack.d@student.edu" },
]

// Mock classes data
const mockClasses: ClassData[] = [
  {
    id: 1,
    name: "Advanced Clinical Medicine",
    code: "ACM",
    facultyName: "Dr. Sarah Johnson",
    facultyId: 1,
    studentCount: 24,
    assignmentCount: 8,
    status: "active",
    description: "Advanced clinical case studies and patient management",
  },
  {
    id: 2,
    name: "Emergency Medicine",
    code: "EMD",
    facultyName: "Dr. Michael Chen",
    facultyId: 2,
    studentCount: 18,
    assignmentCount: 12,
    status: "active",
    description: "Emergency department scenarios and critical care",
  },
  {
    id: 3,
    name: "Pediatric Medicine",
    code: "PED",
    facultyName: "Dr. Emily Rodriguez",
    facultyId: 3,
    studentCount: 22,
    assignmentCount: 6,
    status: "active",
    description: "Pediatric patient care and family medicine",
  },
  {
    id: 4,
    name: "Internal Medicine",
    code: "INT",
    facultyName: "Dr. James Wilson",
    facultyId: 4,
    studentCount: 20,
    assignmentCount: 10,
    status: "inactive",
    description: "Internal medicine cases and diagnostic reasoning",
  },
]

// Mock student assignments data
const mockAssignments: StudentAssignment[] = [
  {
    id: 1,
    studentName: "Alice Johnson",
    caseTitle: "Chest Pain Evaluation",
    status: "completed",
    score: 92,
    dueDate: "2024-01-15",
    submittedDate: "2024-01-14",
    attempts: 2,
    timeSpent: 45,
  },
  {
    id: 2,
    studentName: "Bob Smith",
    caseTitle: "Chest Pain Evaluation",
    status: "completed",
    score: 87,
    dueDate: "2024-01-15",
    submittedDate: "2024-01-15",
    attempts: 3,
    timeSpent: 52,
  },
  {
    id: 3,
    studentName: "Carol Davis",
    caseTitle: "Diabetes Management",
    status: "pending",
    score: null,
    dueDate: "2024-01-20",
    attempts: 0,
  },
  {
    id: 4,
    studentName: "David Wilson",
    caseTitle: "Hypertension Workup",
    status: "overdue",
    score: null,
    dueDate: "2024-01-18",
    attempts: 1,
  },
  {
    id: 5,
    studentName: "Eva Martinez",
    caseTitle: "Chest Pain Evaluation",
    status: "completed",
    score: 95,
    dueDate: "2024-01-15",
    submittedDate: "2024-01-13",
    attempts: 1,
    timeSpent: 38,
  },
  {
    id: 6,
    studentName: "Frank Brown",
    caseTitle: "Pediatric Assessment",
    status: "completed",
    score: 78,
    dueDate: "2024-01-12",
    submittedDate: "2024-01-12",
    attempts: 4,
    timeSpent: 65,
  },
  {
    id: 7,
    studentName: "Grace Taylor",
    caseTitle: "Emergency Protocol",
    status: "pending",
    score: null,
    dueDate: "2024-01-22",
    attempts: 0,
  },
  {
    id: 8,
    studentName: "Henry Lee",
    caseTitle: "Surgical Planning",
    status: "completed",
    score: 89,
    dueDate: "2024-01-10",
    submittedDate: "2024-01-10",
    attempts: 2,
    timeSpent: 42,
  },
]

// Mock case assignment details (what would come from case_assignments table)
const mockCaseAssignments = [
  {
    studentId: 1,
    assignments: [
      {
        id: 101,
        caseTitle: "Chest Pain Evaluation",
        status: "completed",
        score: 92,
        dueDate: "2024-01-15",
        submittedDate: "2024-01-14",
        attempts: 2,
        timeSpent: 45,
        caseId: "case_001",
      },
      {
        id: 102,
        caseTitle: "Cardiac Catheterization",
        status: "completed",
        score: 88,
        dueDate: "2024-01-20",
        submittedDate: "2024-01-19",
        attempts: 1,
        timeSpent: 35,
        caseId: "case_002",
      },
    ],
  },
  {
    studentId: 2,
    assignments: [
      {
        id: 201,
        caseTitle: "Chest Pain Evaluation",
        status: "completed",
        score: 87,
        dueDate: "2024-01-15",
        submittedDate: "2024-01-15",
        attempts: 3,
        timeSpent: 52,
        caseId: "case_001",
      },
    ],
  },
  {
    studentId: 3,
    assignments: [
      {
        id: 301,
        caseTitle: "Diabetes Management",
        status: "pending",
        score: null,
        dueDate: "2024-01-20",
        attempts: 0,
        caseId: "case_003",
      },
    ],
  },
]

// Student Assignment Table Component
interface StudentAssignmentTableProps {
  students: StudentData[]
  assignments: StudentAssignment[]
  getStatusColor: (status: string) => string
  onUnenrollStudent?: (studentId: number) => void
}

const StudentAssignmentTable: React.FC<StudentAssignmentTableProps> = ({
  students,
  assignments,
  getStatusColor,
  onUnenrollStudent,
}) => {
  const theme = useTheme()
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null)

  // Debug logging
  console.log("StudentAssignmentTable received:")
  console.log("- Students:", students)
  console.log("- Assignments:", assignments)

  const handleRowClick = (studentId: number) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId)
  }

  const getStudentAssignments = (studentId: number) => {
    const studentAssignments = assignments.filter(
      (assignment) => assignment.studentId === studentId
    )
    if (studentAssignments.length > 0) {
      console.log(`Found ${studentAssignments.length} assignments for student ${studentId}`)
    }
    return studentAssignments
  }

  const getStudentAverageScore = (studentId: number) => {
    const studentAssignments = getStudentAssignments(studentId)
    const completedAssignments = studentAssignments.filter((a) => a.score !== null)
    if (completedAssignments.length === 0) return null
    return Math.round(
      completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / completedAssignments.length
    )
  }

  const getStudentCompletionStats = (studentId: number) => {
    const studentAssignments = getStudentAssignments(studentId)
    const completed = studentAssignments.filter(
      (a) => a.status === "reviewed" && a.reportId !== null
    ).length
    const total = studentAssignments.length
    return { completed, total }
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }} />
            <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }}>Student</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }}>Assignments</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }}>
              Average Score
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }}>Status</TableCell>
            {onUnenrollStudent && (
              <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.light }}>Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const studentAssignments = getStudentAssignments(student.id)
            const averageScore = getStudentAverageScore(student.id)
            const { completed, total } = getStudentCompletionStats(student.id)
            const isExpanded = expandedStudent === student.id

            return (
              <React.Fragment key={student.id}>
                <TableRow
                  hover
                  onClick={() => handleRowClick(student.id)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}>
                  <TableCell>
                    <IconButton size="small">
                      {isExpanded ? <KeyboardArrowUpIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: "0.8rem",
                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                        }}>
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {student.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {completed}
                      /{total}
                      {" "}
                      completed
</Typography>
                  </TableCell>
                  <TableCell>
                    {averageScore !== null ? (
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          color:
                            averageScore >= 90
                              ? theme.palette.secondary.main
                              : averageScore >= 80
                                ? theme.palette.secondary.light
                                : averageScore >= 70
                                  ? "#f57c00"
                                  : theme.palette.secondary.main,
                        }}>
                        {averageScore}%
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No scores
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {total === 0 ? (
                      <Chip
                        label="No assignments"
                        size="small"
                        sx={{
                          backgroundColor: alpha("#666", 0.1),
                          color: "#666",
                        }}
                      />
                    ) : completed === total ? (
                      <Chip
                        label="All complete"
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                        }}
                      />
                    ) : (
                      <Chip
                        label="In progress"
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.secondary.light, 0.1),
                          color: theme.palette.secondary.light,
                        }}
                      />
                    )}
                  </TableCell>
                  {onUnenrollStudent && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => onUnenrollStudent(student.id)}
                        sx={{
                          color: theme.palette.secondary.main,
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                          },
                        }}
                        title="Un-enroll student">
                        <PersonRemoveIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={onUnenrollStudent ? 7 : 6}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: theme.palette.primary.light, mb: 1 }}>
                          Case Assignments
                        </Typography>
                        {studentAssignments.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No case assignments found for this student.
                          </Typography>
                        ) : (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Case</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Report Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Assignment Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {studentAssignments.map((assignment) => (
                                <TableRow key={assignment.assignmentId}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {assignment.caseTitle}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Case ID:
                                      {" "}
                                      {assignment.caseId}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={assignment.status}
                                      size="small"
                                      sx={{
                                        backgroundColor: alpha(
                                          getStatusColor(assignment.status),
                                          0.1
                                        ),
                                        color: getStatusColor(assignment.status),
                                        textTransform: "capitalize",
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {assignment.score !== null ? (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          color:
                                            assignment.score >= 90
                                              ? theme.palette.secondary.main
                                              : assignment.score >= 80
                                                ? theme.palette.secondary.light
                                                : assignment.score >= 70
                                                  ? "#f57c00"
                                                  : theme.palette.secondary.main,
                                        }}>
                                        {assignment.score}%
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        --
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {assignment.reportId ? "Submitted" : "Not submitted"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {assignment.status.replace("_", " ")}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {assignment.dueDate
                                        ? new Date(assignment.dueDate).toLocaleDateString()
                                        : "No due date"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {assignment.submittedDate
                                        ? new Date(assignment.submittedDate).toLocaleDateString()
                                        : "--"}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export const ClassManagementPage: React.FC = () => {
  const theme = useTheme()
  const [mainView, setMainView] = useState<"classList" | "classDetail">("classList")
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create Class Dialog State
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [createClassForm, setCreateClassForm] = useState<CreateClassForm>({
    name: "",
    code: "",
    term: "",
    description: "",
    facultyId: null,
  })

  // Edit Class Dialog State
  const [editClassOpen, setEditClassOpen] = useState(false)
  const [editClassForm, setEditClassForm] = useState<CreateClassForm>({
    name: "",
    code: "",
    term: "",
    description: "",
    facultyId: null,
  })
  const [deleteClassConfirmOpen, setDeleteClassConfirmOpen] = useState(false)
  const [classes, setClasses] = useState<ClassData[]>([])

  // User Management State
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "faculty" | "student" | "admin",
  })
  const [faculty, setFaculty] = useState<FacultyData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  const [selectedClassStudents, setSelectedClassStudents] = useState<StudentData[]>([])
  const [selectedClassAssignments, setSelectedClassAssignments] = useState<StudentAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)

  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Convert assignments to ClassAssignmentStatus format for the DataGrid
  const facultyAssignments: ClassAssignmentStatus[] = React.useMemo(
    () =>
      selectedClassAssignments.map((assignment) => ({
      assignmentId: assignment.assignmentId,
      caseId: assignment.caseId,
      caseTitle: assignment.caseTitle,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      dueDate: assignment.dueDate || new Date().toISOString(),
      status: assignment.status,
      reportId: assignment.reportId,
      score: assignment.score,
      assignedDate: assignment.assignedDate || new Date().toISOString(),
      submittedDate: assignment.submittedDate,
      attempts: 0, // Not available in StudentAssignment
      timeSpent: 0, // Not available in StudentAssignment
      progress: 0, // Not available in StudentAssignment
    })),
    [selectedClassAssignments]
  )

  // Enrollment State
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState<StudentData | null>(null)

  // Load real data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Load current user
        const currentUserData = await adminApiClient.getCurrentUser()
        setCurrentUser(currentUserData)

        // Load users and separate into faculty and students
        const usersResponse = await adminApiClient.getUsers()
        const users = usersResponse.users || usersResponse // Handle both object and array responses
        const facultyUsers = users.filter((u) => u.role === "faculty")
        const studentUsers = users.filter((u) => u.role === "student")

        const facultyData: FacultyData[] = facultyUsers.map((user) => ({
          id: user.id,
          name: user.name || user.email.split("@")[0], // Use email prefix if name is null
          email: user.email,
          department: "General", // Backend doesn't store department, default to General
        }))

        const studentData: StudentData[] = studentUsers.map((user) => ({
          id: user.id,
          name: user.name || user.email.split("@")[0], // Use email prefix if name is null
          email: user.email,
        }))

        setFaculty(facultyData)
        setStudents(studentData)

        // Load classes
        const classesData = await adminApiClient.getClasses()

        // Load student counts for each class
        const formattedClasses: ClassData[] = await Promise.all(
          classesData.map(async (cls) => {
            const faculty = facultyUsers.find((f) => f.id === cls.faculty_id)
            let studentCount = 0

            try {
              const classStudents = await adminApiClient.getClassStudents(cls.id)
              studentCount = classStudents.length
            } catch (error) {
              console.warn(`Could not load students for class ${cls.id}:`, error)
            }

            return {
              id: cls.id,
              name: cls.name || "Untitled Class",
              code: cls.code || cls.name?.substring(0, 3).toUpperCase() || "CLS",
              description: cls.code ? `${cls.name} (${cls.code})` : cls.name || "No description",
              facultyName: faculty?.name || faculty?.email?.split("@")[0] || "Unknown Faculty",
              facultyId: cls.faculty_id,
              studentCount,
              assignmentCount: 0, // Will be updated when we get assignment data
              status: cls.is_active ? "active" : "inactive",
            }
          })
        )

        setClasses(formattedClasses)

        // Clear any previous errors since data loaded successfully
        setError(null)
      } catch (error) {
        console.error("Error loading data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Clear data when no class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSelectedClassStudents([])
      setSelectedClassAssignments([])
    }
    // Don't load data here - it's loaded in handleClassSelect
  }, [selectedClass])

  // Panel sizing logic (copied from FacultyDashboard)
  const getPanelSizes = () => {
    let leftMd = 0
    let middleMd = 0
    let rightMd = 0

    if (mainView === "classList") {
      leftMd = 3
      middleMd = 9
      rightMd = 0
    } else if (mainView === "classDetail") {
      leftMd = 3
      middleMd = 9
      rightMd = 0
    } else {
      // Fallback: default two-panel layout
      leftMd = 3
      middleMd = 9
      rightMd = 0
    }
    return { leftMd, middleMd, rightMd }
  }

  const { leftMd, middleMd, rightMd } = getPanelSizes()
  const showThreePanelLayout = mainView === "classList" || mainView === "classDetail"

  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const handleClassSelect = async (classData: ClassData) => {
    setSelectedClass(classData)
    setMainView("classDetail")

    // Load real assignment data for this class
    setIsLoadingAssignments(true)
    try {
      // Get students enrolled in this class
      const classStudents = await adminApiClient.getClassStudents(classData.id)
      const formattedStudents: StudentData[] = classStudents.map((student) => ({
        id: student.id,
        name: student.name || student.email.split("@")[0],
        email: student.email,
      }))

      setSelectedClassStudents(formattedStudents)

      // Try to get case assignments for this specific class
      try {
        const classAssignments = await adminApiClient.getAdminCaseAssignments(classData.id)

        // Transform the assignment data to match our interface
        const formattedAssignments: StudentAssignment[] = classAssignments.map((assignment) => {
          const studentId = assignment.student_id || assignment.student?.id

          return {
            assignmentId: assignment.id,
            caseId: assignment.case_id || assignment.case?.id,
            caseTitle: assignment.case?.title || "Unknown Case",
            studentId,
            studentName: assignment.student?.name || assignment.student?.email || "Unknown Student",
            classId: assignment.class_id || classData.id,
            className: classData.name,
            facultyName:
              assignment.faculty?.name || assignment.faculty?.email || classData.facultyName,
            dueDate: assignment.due_date,
            status: assignment.status || "not_started",
            reportId: assignment.report_id,
            score: assignment.score,
            assignedDate: assignment.assigned_date,
            submittedDate: assignment.submitted_date,
            learning_objectives: assignment.case?.learning_objectives || [],
            description: assignment.case?.description,
          }
        })

        // Create placeholder assignments for students without any assignments
        const studentsWithAssignments = new Set(formattedAssignments.map((a) => a.studentId))
        const placeholderAssignments: StudentAssignment[] = []

        for (const student of formattedStudents) {
          if (!studentsWithAssignments.has(student.id)) {
            // Create a placeholder assignment for this student
            placeholderAssignments.push({
              assignmentId: -student.id, // Negative ID to indicate placeholder
              caseId: 0,
              caseTitle: "No assignments yet",
              studentId: student.id,
              studentName: student.name,
              classId: classData.id,
              className: classData.name,
              facultyName: classData.facultyName,
              dueDate: "",
              status: "not_started",
              reportId: null,
              score: null,
              assignedDate: new Date().toISOString(),
              submittedDate: null,
              learning_objectives: [],
              description: "",
            })
          }
        }

        // Combine real assignments with placeholder assignments
        const allAssignments = [...formattedAssignments, ...placeholderAssignments]
        setSelectedClassAssignments(allAssignments)
      } catch (assignmentError) {
        console.error("Could not load assignments:", assignmentError)
        // Even if assignments fail to load, show all enrolled students with placeholder assignments
        const placeholderAssignments: StudentAssignment[] = formattedStudents.map((student) => ({
          assignmentId: -student.id,
          caseId: 0,
          caseTitle: "No assignments yet",
          studentId: student.id,
          studentName: student.name,
          classId: classData.id,
          className: classData.name,
          facultyName: classData.facultyName,
          dueDate: "",
          status: "not_started",
          reportId: null,
          score: null,
          assignedDate: new Date().toISOString(),
          submittedDate: null,
          learning_objectives: [],
          description: "",
        }))
        setSelectedClassAssignments(placeholderAssignments)
      }
    } catch (error) {
      console.error("Error loading assignment data:", error)
      // Fall back to just loading students without detailed assignments
      try {
        const classStudents = await adminApiClient.getClassStudents(classData.id)
        const formattedStudents: StudentData[] = classStudents.map((student) => ({
          id: student.id,
          name: student.name || student.email.split("@")[0],
          email: student.email,
        }))

        setSelectedClassStudents(formattedStudents)

        // Create placeholder assignments for all students
        const placeholderAssignments: StudentAssignment[] = formattedStudents.map((student) => ({
          assignmentId: -student.id,
          caseId: 0,
          caseTitle: "No assignments yet",
          studentId: student.id,
          studentName: student.name,
          classId: classData.id,
          className: classData.name,
          facultyName: classData.facultyName,
          dueDate: "",
          status: "not_started",
          reportId: null,
          score: null,
          assignedDate: new Date().toISOString(),
          submittedDate: null,
          learning_objectives: [],
          description: "",
        }))
        setSelectedClassAssignments(placeholderAssignments)
      } catch (fallbackError) {
        console.error("Error loading students:", fallbackError)
        setError("Failed to load class data")
      }
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const handleBackToList = () => {
    setMainView("classList")
    setSelectedClass(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return theme.palette.secondary.main
      case "pending":
        return theme.palette.secondary.light
      case "overdue":
        return theme.palette.secondary.main
      case "active":
        return theme.palette.secondary.main
      case "inactive":
        return alpha("#666", 0.7)
      default:
        return alpha("#666", 0.5)
    }
  }

  const handleCreateClass = () => {
    setCreateClassOpen(true)
  }

  const handleCloseCreateClass = () => {
    setCreateClassOpen(false)
    setCreateClassForm({
      name: "",
      code: "",
      term: "",
      description: "",
      facultyId: null,
    })
  }

  const handleSubmitCreateClass = async () => {
    if (
      !createClassForm.name ||
      !createClassForm.code ||
      !createClassForm.term ||
      !createClassForm.description ||
      !createClassForm.facultyId
    ) {
      return
    }

    const selectedFaculty = faculty.find((f) => f.id === createClassForm.facultyId)
    if (!selectedFaculty) return

    setIsLoading(true)
    try {
      // Create class payload (matching backend schema)
      const classPayload = {
        name: createClassForm.name,
        code: createClassForm.code,
        term: createClassForm.term,
        faculty_id: createClassForm.facultyId,
        is_active: true,
      }

      // Call real API to create class
      const newClassResponse = await adminApiClient.createClass(classPayload)

      // Update local state with real class data
      const newClass: ClassData = {
        id: newClassResponse.id,
        name: newClassResponse.name,
        code:
          newClassResponse.code || newClassResponse.name?.substring(0, 3).toUpperCase() || "CLS",
        description: createClassForm.description, // Backend doesn't store description, keep locally
        facultyName: selectedFaculty.name,
        facultyId: newClassResponse.faculty_id,
        studentCount: 0, // No students enrolled initially
        assignmentCount: 0,
        status: newClassResponse.is_active ? "active" : "inactive",
      }

      setClasses([...classes, newClass])
      handleCloseCreateClass()
    } catch (error: any) {
      console.error("Error creating class:", error)
      setError(error.message || "Failed to create class")
    } finally {
      setIsLoading(false)
    }
  }

  // Edit Class Handlers
  const handleOpenEditClass = () => {
    if (!selectedClass) return

    setEditClassForm({
      name: selectedClass.name,
      code: selectedClass.code,
      term: selectedClass.term || "",
      description: selectedClass.description,
      facultyId: selectedClass.facultyId,
    })
    setEditClassOpen(true)
  }

  const handleCloseEditClass = () => {
    setEditClassOpen(false)
    setEditClassForm({
      name: "",
      code: "",
      term: "",
      description: "",
      facultyId: null,
    })
  }

  const handleSubmitEditClass = async () => {
    if (
      !selectedClass ||
      !editClassForm.name ||
      !editClassForm.code ||
      !editClassForm.term ||
      !editClassForm.description ||
      !editClassForm.facultyId
    ) {
      return
    }

    const selectedFaculty = faculty.find((f) => f.id === editClassForm.facultyId)
    if (!selectedFaculty) return

    setIsLoading(true)
    try {
      // Update class payload (matching backend schema)
      const classPayload = {
        name: editClassForm.name,
        code: editClassForm.code,
        term: editClassForm.term,
        is_active: selectedClass.status === "active",
      }

      // Call API to update class
      const updatedClassResponse = await adminApiClient.updateClass(selectedClass.id, classPayload)

      // Update local state with updated class data
      const updatedClass: ClassData = {
        ...selectedClass,
        name: updatedClassResponse.name,
        code: updatedClassResponse.code,
        term: updatedClassResponse.term,
        description: editClassForm.description,
        facultyName: selectedFaculty.name,
        facultyId: updatedClassResponse.faculty_id,
        status: updatedClassResponse.is_active ? "active" : "inactive",
      }

      setClasses(classes.map((c) => (c.id === selectedClass.id ? updatedClass : c)))
      setSelectedClass(updatedClass)
      handleCloseEditClass()
    } catch (error: any) {
      console.error("Error updating class:", error)
      setError(error.message || "Failed to update class")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClass = () => {
    setDeleteClassConfirmOpen(true)
  }

  const handleConfirmDeleteClass = async () => {
    if (!selectedClass) return

    setIsLoading(true)
    try {
      await adminApiClient.deleteClass(selectedClass.id)

      // Update local state - remove the deleted class
      setClasses(classes.filter((c) => c.id !== selectedClass.id))

      // Close dialogs and reset selected class
      setDeleteClassConfirmOpen(false)
      setEditClassOpen(false)
      setSelectedClass(null)
      setMainView("classList")
    } catch (error: any) {
      console.error("Error deleting class:", error)
      setError(error.message || "Failed to delete class")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDeleteClass = () => {
    setDeleteClassConfirmOpen(false)
  }

  // Enrollment Handlers
  const handleEnrollStudent = () => {
    if (!selectedClass) return
    setEnrollStudentOpen(true)
  }

  const handleCloseEnrollStudent = () => {
    setEnrollStudentOpen(false)
    setSelectedStudentToEnroll(null)
  }

  const handleSubmitEnrollStudent = async () => {
    if (!selectedStudentToEnroll || !selectedClass) return

    setIsLoading(true)
    try {
      await adminApiClient.enrollStudent(selectedClass.id, selectedStudentToEnroll.id)

      // Add student to selected class students if not already there
      const isAlreadyInClass = selectedClassStudents.some(
        (s) => s.id === selectedStudentToEnroll.id
      )
      if (!isAlreadyInClass) {
        setSelectedClassStudents([...selectedClassStudents, selectedStudentToEnroll])
      }

      console.log(`Successfully enrolled ${selectedStudentToEnroll.name} in ${selectedClass.name}`)
      handleCloseEnrollStudent()
    } catch (error: any) {
      console.error("Error enrolling student:", error)
      if (error.message.includes("duplicate key") || error.message.includes("already exists")) {
        setError(`${selectedStudentToEnroll.name} is already enrolled in this class`)
      } else {
        setError(`Failed to enroll student: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // User Management Handlers
  const handleCreateUser = () => {
    setCreateUserOpen(true)
    setCreateUserForm({
      name: "",
      email: "",
      password: "",
      role: "student",
    })
  }

  const handleCloseCreateUser = () => {
    setCreateUserOpen(false)
    setCreateUserForm({
      name: "",
      email: "",
      password: "",
      role: "student" as "faculty" | "student" | "admin",
    })
  }

  const handleSubmitCreateUser = async () => {
    if (!createUserForm.email || !createUserForm.password) {
      return
    }

    setIsLoading(true)
    try {
      // Create user payload for API (matching backend schema)
      const userPayload = {
        email: createUserForm.email,
        password: createUserForm.password,
        name: createUserForm.name || null,
        is_active: true,
        role: createUserForm.role,
        allowed_apps: ["mcc", "aimhei", "virtual_patient"], // Default apps for new users
      }

      // Call real API
      const newUser = await adminApiClient.createUser(userPayload)

      // Note: User creation is now separate from class enrollment
      // Students can be enrolled in classes separately using the enrollment feature

      // Update local state with real user data
      if (createUserForm.role === "faculty") {
        const newFaculty: FacultyData = {
          id: newUser.id,
          name: newUser.name || newUser.email.split("@")[0],
          email: newUser.email,
          department: "General", // Default since we don't collect this
        }
        setFaculty([...faculty, newFaculty])
      } else if (createUserForm.role === "student") {
        const newStudent: StudentData = {
          id: newUser.id,
          name: newUser.name || newUser.email.split("@")[0],
          email: newUser.email,
        }
        setStudents([...students, newStudent])
      }

      handleCloseCreateUser()
    } catch (error: any) {
      console.error("Error creating user:", error)
      setError(error.message || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenrollStudent = async (studentId: number) => {
    if (!selectedClass) {
      setError("No class selected")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      await adminApiClient.unenrollStudent(selectedClass.id, studentId)

      // Update local state - remove student from selected class
      const updatedStudents = selectedClassStudents.filter((s) => s.id !== studentId)

      // Update the selectedClass students array
      setSelectedClass({
        ...selectedClass,
        students: updatedStudents,
      })

      console.log("Student unenrolled successfully")
    } catch (error: any) {
      console.error("Error unenrolling student:", error)
      setError(error.message || "Failed to unenroll student")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 3, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Faculty Dashboard Style Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
          },
        }}>
        <Box sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
          <Grid container spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
            {/* Left Section - Profile */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    sx={{
                      width: { xs: 38, sm: 42 },
                      height: { xs: 38, sm: 42 },
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                      boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
                    }}>
                    <SettingsIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "white" }} />
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0.5,
                      right: 0.5,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.secondary.main,
                      border: "2px solid white",
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      lineHeight: 1.1,
                      mb: 0.125,
                    }}>
                    {getGreeting()}, Administrator
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}>
                    AIMMS Web Platform Management
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content Body - Three Panel Layout (copied from FacultyDashboard) */}
      {showThreePanelLayout && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            p: { xs: 1, sm: 2 },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}>
          {/* Admin Actions Toolbar */}
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.divider, 0.3)} 0%, ${alpha(theme.palette.divider, 0.2)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
              flexShrink: 0,
            }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.light }}>
                Admin Actions
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={handleCreateClass}
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    "&:hover": { backgroundColor: theme.palette.text.primary },
                    fontWeight: 600,
                  }}>
                  Create Class
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  onClick={handleCreateUser}
                  sx={{
                    backgroundColor: theme.palette.secondary.light,
                    "&:hover": { backgroundColor: theme.palette.secondary.main },
                    fontWeight: 600,
                  }}>
                  Create User
                </Button>
              </Box>
            </Box>
          </Paper>

          <Grid container spacing={1.5} sx={{ height: "100%", overflow: "hidden", width: "100%" }}>
            {/* Left Panel - Class List */}
            <AnimatePresence initial={false}>
              {leftMd > 0 && (
                <Grid size={{ xs: 12, md: leftMd }} key="left-panel" sx={{ height: "100%" }}>
                  <MotionBox
                    sx={{
                      height: "100%",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit">
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        py: 2,
                        px: 1.5,
                      }}>
                      <Box
                        sx={{
                          py: 1,
                          px: 1.5,
                          mb: 1,
                          borderBottom: 1,
                          borderColor: "divider",
                          flexShrink: 0,
                        }}>
                        <Typography
                          variant="overline"
                          sx={{ color: theme.palette.primary.light, display: "block", lineHeight: 1.2 }}>
                          Admin Workspace
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "medium",
                              color: theme.palette.text.primary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            Classes
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "visible" }}>
                        {classes.length === 0 ? (
                          <Box sx={{ p: 2, textAlign: "center" }}>
                            <SchoolIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                            <Typography color="text.secondary" variant="body2">
                              No classes found.
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ mt: 0.5, display: "block" }}>
                              Create a new class to get started.
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ p: 0.5, pt: 1, pb: 3, overflow: "visible" }}>
                            <List dense sx={{ p: 0 }}>
                              {classes.map((classData, index) => {
                                const isSelected = selectedClass?.id === classData.id
                                const isCollapsed = false // Admin dashboard doesn't collapse

                                const listItemStyles: SxProps<Theme> = {
                                  // Common card-like styles
                                  borderRadius: 1.5,
                                  mb: 1,
                                  mt: "1px", // Make room for transform
                                  border: "1px solid",
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  cursor: "pointer",
                                  position: "relative",

                                  // Responsive padding
                                  p: 1.5,
                                  minHeight: "auto",

                                  // Flex properties for content alignment
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "flex-start",

                                  // Selected state styling
                                  borderColor: isSelected
                                    ? theme.palette.secondary.main
                                    : theme.palette.divider,
                                  bgcolor: "transparent",
                                  ...(isSelected && {
                                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                    borderColor: theme.palette.secondary.main,
                                    boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                    transform: "translateY(-2px)",
                                  }),

                                  // Enhanced hover state styling
                                  "&:hover": {
                                    borderColor: isSelected
                                      ? theme.palette.secondary.main
                                      : theme.palette.primary.light,
                                    bgcolor: isSelected
                                      ? alpha(theme.palette.secondary.main, 0.08)
                                      : alpha(theme.palette.primary.light, 0.04),
                                    transform: isSelected
                                      ? "translateY(-3px) scale(1.015)"
                                      : "translateY(-4px) scale(1.02)",
                                    boxShadow: isSelected
                                      ? `0 6px 20px ${alpha(theme.palette.secondary.main, 0.25)}`
                                      : `0 4px 16px ${alpha(theme.palette.primary.light, 0.2)}`,
                                    transformOrigin: "center center",
                                  },
                                }

                                const avatarStyles: SxProps<Theme> = {
                                  width: 36,
                                  height: 36,
                                  bgcolor: isSelected
                                    ? theme.palette.primary.light
                                    : alpha(theme.palette.primary.light, 0.15),
                                  color: isSelected ? theme.palette.background.paper : theme.palette.primary.light,
                                  fontSize: "0.9rem",
                                  fontWeight: "bold",
                                  mb: 0,
                                  border: `2px solid ${isSelected ? theme.palette.primary.light : "transparent"}`,
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                                }

                                return (
                                  <motion.div
                                    key={classData.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                      duration: 0.4,
                                      delay: index * 0.1,
                                      ease: "easeOut",
                                    }}
                                    whileHover={{
                                      y: -2,
                                      transition: { duration: 0.15, ease: "easeOut" },
                                    }}
                                    whileTap={{
                                      scale: 0.995,
                                      transition: { duration: 0.1 },
                                    }}>
                                    <ListItemButton
                                      selected={isSelected}
                                      onClick={() => handleClassSelect(classData)}
                                      sx={listItemStyles}>
                                      <Avatar sx={avatarStyles}>
                                        {classData.code.substring(0, 2).toUpperCase()}
                                      </Avatar>

                                      <Box sx={{ flexGrow: 1, ml: 1.5, minWidth: 0 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: isSelected ? "bold" : "medium",
                                            color: isSelected
                                              ? theme.palette.primary.light
                                              : theme.palette.text.primary,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            lineHeight: 1.3,
                                          }}>
                                          {classData.name}
                                        </Typography>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            mt: 0.25,
                                          }}>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}>
                                            {classData.code} •{classData.studentCount}{" "}
                                            {classData.code} •{classData.studentCount}{" "}
                                            {classData.studentCount === 1 ? "Student" : "Students"}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </ListItemButton>
                                  </motion.div>
                                )
                              })}
                            </List>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </MotionBox>
                </Grid>
              )}
            </AnimatePresence>

            {/* Middle Panel - Class Details */}
            <AnimatePresence initial={false}>
              {middleMd > 0 && (
                <Grid size={{ xs: 12, md: middleMd }} key="middle-panel" sx={{ height: "100%" }}>
                  <MotionBox
                    sx={{
                      height: "100%",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    variants={fadeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit">
                    {selectedClass ? (
                      <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          p: 2,
                          overflow: "hidden",
                        }}>
                        {/* Class Detail Header */}
                        <Box
                          sx={{
                            pb: 1,
                            mb: 2,
                            borderBottom: 1,
                            borderColor: "divider",
                            flexShrink: 0,
                          }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <IconButton
                              onClick={handleBackToList}
                              sx={{ color: theme.palette.primary.light }}>
                              <ArrowBackIcon />
                            </IconButton>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="overline"
                                sx={{
                                  color: theme.palette.primary.light,
                                  display: "block",
                                  lineHeight: 1.2,
                                }}>
                                Class Details
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  flexWrap: "wrap",
                                }}>
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                                  {selectedClass.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}>
                                  <Chip
                                    label={selectedClass.code}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 24,
                                      fontSize: "0.75rem",
                                      borderColor: alpha(theme.palette.primary.light, 0.3),
                                      color: theme.palette.primary.light,
                                      backgroundColor: alpha(theme.palette.primary.light, 0.05),
                                    }}
                                  />
                                  <Chip
                                    icon={<PersonIcon sx={{ fontSize: "14px !important" }} />}
                                    label={selectedClass.facultyName}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 24,
                                      fontSize: "0.75rem",
                                      borderColor: alpha(theme.palette.secondary.light, 0.3),
                                      color: theme.palette.secondary.light,
                                      backgroundColor: alpha(theme.palette.secondary.light, 0.05),
                                      "& .MuiChip-icon": {
                                        color: theme.palette.secondary.light,
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={handleOpenEditClass}
                                sx={{
                                  borderColor: theme.palette.secondary.main,
                                  color: theme.palette.secondary.main,
                                }}>
                                Edit Class
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<PeopleIcon />}
                                onClick={handleEnrollStudent}
                                sx={{
                                  borderColor: theme.palette.secondary.light,
                                  color: theme.palette.secondary.light,
                                }}>
                                Enroll Student
                              </Button>
                            </Box>
                          </Box>
                        </Box>

                        {/* Class Detail Content */}
                        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
                          {/* Case Assignments DataGrid */}
                          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                            {isLoadingAssignments ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  height: 300,
                                }}>
                                <CircularProgress />
                              </Box>
                            ) : facultyAssignments.length > 0 ? (
                              <AssignmentsDataGrid
                                assignments={facultyAssignments}
                                loading={isLoadingAssignments}
                                onProcessRowUpdate={async (newRow, oldRow) => {
                                  // Handle row update if needed
                                  console.log("Row update:", newRow)
                                  return newRow
                                }}
                                onNavigateToReportReview={(reportId) => {
                                  setSelectedReportId(reportId)
                                  console.log("Navigate to report:", reportId)
                                }}
                                onDeleteAssignment={(assignmentId) => {
                                  // Handle delete if needed for admin
                                  console.log("Delete assignment:", assignmentId)
                                }}
                                onBulkUpdateDueDate={async (assignmentIds, newDueDate) => {
                                  try {
                                    setIsLoadingAssignments(true)

                                    // Try to call the API to update due dates (fallback to local update if endpoint doesn't exist)
                                    try {
                                      await adminApiClient.bulkUpdateAssignmentDueDates(
                                        assignmentIds,
                                        newDueDate
                                      )
                                      console.log("Successfully updated due dates via API")
                                    } catch (apiError: any) {
                                      console.log(
                                        "Backend bulk update not available, updating locally:",
                                        apiError.message
                                      )
                                      // If API fails (e.g., endpoint doesn't exist), update locally
                                    }

                                    // Update local state optimistically
                                    const updatedAssignments = selectedClassAssignments.map(
                                      (assignment) => {
                                        if (assignmentIds.includes(assignment.assignmentId)) {
                                          return {
                                            ...assignment,
                                            dueDate: newDueDate.toISOString(),
                                          }
                                        }
                                        return assignment
                                      }
                                    )

                                    setSelectedClassAssignments(updatedAssignments)
                                  } catch (error: any) {
                                    console.error("Error updating due dates:", error)
                                    setError(
                                      error.message || "Failed to update assignment due dates"
                                    )
                                  } finally {
                                    setIsLoadingAssignments(false)
                                  }
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  height: 200,
                                }}>
                                <Typography variant="body1" color="text.secondary">
                                  No assignments found for this class
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ) : (
                      mainView === "classList" && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            border: `1px dashed ${alpha(theme.palette.primary.light, 0.2)}`,
                          }}>
                          <SchoolIcon sx={{ fontSize: 50, color: "text.disabled", mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            Select a class
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Choose a class from the left panel to see its details.
                          </Typography>
                        </Paper>
                      )
                    )}
                  </MotionBox>
                </Grid>
              )}
            </AnimatePresence>
          </Grid>
        </Paper>
      )}

      {/* Create Class Dialog */}
      <Dialog
        open={createClassOpen}
        onClose={handleCloseCreateClass}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            backgroundColor: "white",
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          },
        }}>
        <DialogTitle
          sx={{
            pb: 1.5,
            fontWeight: 700,
            color: theme.palette.primary.light,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                width: 32,
                height: 32,
              }}>
              <AddIcon sx={{ fontSize: 18, color: "white" }} />
            </Avatar>
            Create New Class
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Class Name"
                value={createClassForm.name}
                onChange={(e) => setCreateClassForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Class Code"
                value={createClassForm.code}
                onChange={(e) =>
                  setCreateClassForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                required
                placeholder="e.g., MED101"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Term"
                value={createClassForm.term}
                onChange={(e) => setCreateClassForm((prev) => ({ ...prev, term: e.target.value }))}
                required
                placeholder="e.g., Fall 2024"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={createClassForm.description}
                onChange={(e) =>
                  setCreateClassForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={faculty}
                getOptionLabel={(option) => `${option.name} - ${option.department}`}
                value={faculty.find((f) => f.id === createClassForm.facultyId) || null}
                onChange={(_, newValue) => {
                  setCreateClassForm((prev) => ({ ...prev, facultyId: newValue?.id || null }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Faculty"
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.secondary.main,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseCreateClass}
            sx={{
              color: alpha(theme.palette.primary.light, 0.7),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.light, 0.08) },
            }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmitCreateClass}
            disabled={
              !createClassForm.name ||
              !createClassForm.code ||
              !createClassForm.term ||
              !createClassForm.description ||
              !createClassForm.facultyId
            }
            sx={{
              backgroundColor: theme.palette.secondary.main,
              "&:hover": { backgroundColor: theme.palette.text.primary },
            }}>
            Create Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog
        open={editClassOpen}
        onClose={handleCloseEditClass}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            backgroundColor: "white",
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          },
        }}>
        <DialogTitle
          sx={{
            pb: 1.5,
            fontWeight: 700,
            color: theme.palette.primary.light,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                width: 32,
                height: 32,
              }}>
              <EditIcon sx={{ fontSize: 18, color: "white" }} />
            </Avatar>
            Edit Class
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Class Name"
                value={editClassForm.name}
                onChange={(e) => setEditClassForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Class Code"
                value={editClassForm.code}
                onChange={(e) =>
                  setEditClassForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                required
                placeholder="e.g., MED101"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Term"
                value={editClassForm.term}
                onChange={(e) => setEditClassForm((prev) => ({ ...prev, term: e.target.value }))}
                required
                placeholder="e.g., Fall 2024"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editClassForm.description}
                onChange={(e) =>
                  setEditClassForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Autocomplete
                options={faculty}
                getOptionLabel={(option) => `${option.name} - ${option.department}`}
                value={faculty.find((f) => f.id === editClassForm.facultyId) || null}
                onChange={(_, newValue) => {
                  setEditClassForm((prev) => ({ ...prev, facultyId: newValue?.id || null }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Faculty"
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: theme.palette.secondary.main,
                        },
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClass}
            sx={{
              borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                borderColor: theme.palette.text.primary,
              },
              mr: "auto", // Push to the left
            }}>
            Delete Class
          </Button>
          <Button
            onClick={handleCloseEditClass}
            sx={{
              color: alpha(theme.palette.primary.light, 0.7),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.light, 0.08) },
            }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmitEditClass}
            disabled={
              !editClassForm.name ||
              !editClassForm.code ||
              !editClassForm.term ||
              !editClassForm.description ||
              !editClassForm.facultyId
            }
            sx={{
              backgroundColor: theme.palette.secondary.main,
              "&:hover": { backgroundColor: theme.palette.text.primary },
            }}>
            Update Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Class Confirmation Dialog */}
      <Dialog
        open={deleteClassConfirmOpen}
        onClose={handleCancelDeleteClass}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            backgroundColor: "white",
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.text.primary, 0.04)} 100%)`,
          },
        }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.text.primary} 100%)`,
              }}>
              <DeleteIcon sx={{ fontSize: 20, color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Delete Class
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This action cannot be undone
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the class "<strong>{selectedClass?.name}</strong>
            "?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove the class and all associated data including:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Student enrollments
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Case assignments
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Class-specific data
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCancelDeleteClass}
            sx={{
              color: alpha(theme.palette.primary.light, 0.7),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.light, 0.08) },
            }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            onClick={handleConfirmDeleteClass}
            disabled={isLoading}
            sx={{
              backgroundColor: theme.palette.secondary.main,
              "&:hover": { backgroundColor: theme.palette.text.primary },
              "&:disabled": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.5),
                color: "white",
              },
            }}>
            {isLoading ? "Deleting..." : "Delete Class"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createUserOpen}
        onClose={handleCloseCreateUser}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            backgroundColor: "white",
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          },
        }}>
        <DialogTitle
          sx={{
            pb: 1.5,
            fontWeight: 700,
            color: theme.palette.primary.light,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                width: 32,
                height: 32,
              }}>
              <PeopleIcon sx={{ fontSize: 18, color: "white" }} />
            </Avatar>
            Create New User
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: theme.palette.primary.light,
                  fontSize: "1rem",
                }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={createUserForm.name}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <FormControl
                fullWidth
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={createUserForm.role}
                  label="Role"
                  onChange={(e) =>
                    setCreateUserForm((prev) => ({
                    ...prev,
                    role: e.target.value as "faculty" | "student" | "admin",
                  }))
                  }>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={createUserForm.password}
                onChange={(e) =>
                  setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
                helperText="User can change this after first login"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.main,
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseCreateUser}
            sx={{
              color: alpha(theme.palette.primary.light, 0.7),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.light, 0.08) },
            }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSubmitCreateUser}
            disabled={!createUserForm.email || !createUserForm.password || isLoading}
            sx={{
              backgroundColor: theme.palette.secondary.light,
              "&:hover": { backgroundColor: theme.palette.secondary.main },
            }}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog
        open={enrollStudentOpen}
        onClose={handleCloseEnrollStudent}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.divider, 0.8)} 0%, ${alpha(theme.palette.divider, 0.6)} 100%)`,
            backgroundColor: "white",
          },
        }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              }}>
              <PeopleIcon sx={{ fontSize: 18, color: "white" }} />
            </Avatar>
            Enroll Student in
            {" "}
            {selectedClass?.name || "Class"}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Search for and select an existing student to enroll in this class.
          </Typography>

          <Autocomplete
            options={students.filter((s) => !selectedClassStudents.some((cs) => cs.id === s.id))}
            getOptionLabel={(option) => `${option.name} - ${option.email}`}
            value={selectedStudentToEnroll}
            onChange={(_, newValue) => {
              setSelectedStudentToEnroll(newValue)
            }}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options

              const searchValue = inputValue.toLowerCase()
              return options.filter(
                (option) =>
                  option.name.toLowerCase().includes(searchValue) ||
                  option.email.toLowerCase().includes(searchValue)
              )
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search for Student"
                placeholder="Type student name or email..."
                required
                helperText="Start typing to search by name or email address"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.light,
                    },
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: theme.palette.secondary.light,
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText="No students found. Try searching by name or email."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseEnrollStudent}
            sx={{
              color: alpha(theme.palette.primary.light, 0.7),
              "&:hover": { backgroundColor: alpha(theme.palette.primary.light, 0.08) },
            }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PeopleIcon />}
            onClick={handleSubmitEnrollStudent}
            disabled={!selectedStudentToEnroll || isLoading}
            sx={{
              backgroundColor: theme.palette.secondary.light,
              "&:hover": { backgroundColor: theme.palette.secondary.main },
            }}>
            {isLoading ? "Enrolling..." : "Enroll Student"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
