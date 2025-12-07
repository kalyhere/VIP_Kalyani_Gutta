import { useState, useMemo } from "react"
import {
  Box,
  Grid2 as Grid,
  Paper,
  Alert,
  Container,
  Snackbar,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { motion } from "framer-motion"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { ClassAssignmentStatus, FacultyClass } from "./types/faculty-types"

// Import our reusable components
import { FacultyDashboardHeader } from "@/pages/faculty/components/FacultyDashboardHeader"
import { ClassListPanel } from "@/pages/faculty/components/ClassListPanel"
import { StudentDetailsPanel } from "@/pages/faculty/components/StudentDetailsPanel"
import { AssignmentPanel } from "@/pages/faculty/components/AssignmentPanel"
import { CompletedReportDetailItem } from "@/pages/faculty/components/CompletedReportDetailItem"

import {
  bulkAssignCase,
  getFacultyMedicalCases,
  deleteAssignment,
  bulkUpdateDueDate,
} from "@/services/facultyService"

// Import shared utilities
import { MedicalCase } from "../types/medical-cases"

// Import custom hooks (Step 1: Adding imports only, not using yet)
import { useFacultyClasses, useAssignmentFlow, useFacultyStats } from "@/pages/faculty/hooks"

// Create a motion-compatible version of MUI Box IMMEDIATELY AFTER IMPORTS
const MotionBox = motion.create(Box)

// Re-define subtle fade animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const FacultyDashboard = () => {
  const theme = useTheme()

  // Use the custom hook for faculty stats
  const {
    facultyData,
    isLoading: isLoadingStats,
    error: statsError,
    getGreeting,
  } = useFacultyStats()

  // Use the custom hook for faculty classes
  const {
    classes,
    selectedClass,
    students,
    assignments,
    isLoadingClasses,
    isLoadingStudents,
    isLoadingAssignments,
    error: classError,
    loadClassDetails,
    setAssignments,
    refreshAssignments,
    clearSelectedClass,
  } = useFacultyClasses()

  // Use the custom hook for assignment flow
  const {
    activeStep,
    setActiveStep,
    selectedCaseForAssignment,
    selectedStudents,
    assignmentDueDate,
    setAssignmentDueDate,
    viewerContent,
    setViewerContent,
    handleCaseSelect: handleCaseSelectFlow,
    handleStudentToggle,
    handleSelectAllStudents: handleSelectAll,
    resetFlow,
    cancelFlow,
  } = useAssignmentFlow()

  const [cases, setCases] = useState<MedicalCase[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: "success" | "error"
  }>({
    open: false,
    message: "",
    severity: "success",
  })
  const [bulkAssignmentDialogOpen, setBulkAssignmentDialogOpen] = useState(false)

  type MainView = "classList" | "classDetail" | "reportReview"
  const [mainView, setMainView] = useState<MainView>("classList")

  // RE-ADDED: State to control the inline assignment UI visibility
  const [showAssignmentUI, setShowAssignmentUI] = useState(false)

  // RE-ADDED: State to control the content of the right panel explicitly
  type RightPanelView = "report" | "caseContent" | "none" | "assignmentFlow"
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>("none")

  // Update handleClassSelect to properly handle case assignments
  const handleClassSelect = async (classData: FacultyClass) => {
    const switchingToDifferentClass = selectedClass?.id !== classData.id
    setShowAssignmentUI(false)
    resetFlow()

    if (mainView === "reportReview" && selectedReportId !== null) {
      if (switchingToDifferentClass) {
        setSelectedReportId(null)
      }
    } else {
      setMainView("classDetail")
      setSelectedReportId(null)
    }
    setError(null)

    // Use the hook's loadClassDetails to fetch class data
    try {
      await loadClassDetails(classData)
    } catch (error: unknown) {
      console.error("Error fetching class data:", error)
      if (error instanceof Error) {
        setError(`Failed to load class data: ${error.message}`)
      } else {
        setError("Failed to load class data. Please try again.")
      }
    }
  }

  // Update handleCaseSelect to use the hook's flow
  const handleCaseSelect = (caseItem: MedicalCase) => {
    // Call the hook's handleCaseSelect which manages state and parsing
    handleCaseSelectFlow(caseItem)
    // Then set the right panel view for UI display
    setRightPanelView("assignmentFlow")
  }

  // Note: handleStudentToggle is now provided by useAssignmentFlow hook

  // Update handleSelectAllStudents to use the hook's function with student IDs
  const handleSelectAllStudents = () => {
    if (!selectedClass) return
    const allStudentIds = students.map((student) => student.id)
    handleSelectAll(allStudentIds)
  }

  // Update isAllStudentsSelected to work with real data
  const isAllStudentsSelected = useMemo(() => {
    if (!selectedClass) return false

    const allStudentIds = students.map((student) => student.id)

    return allStudentIds.length > 0 && selectedStudents.length === allStudentIds.length
  }, [selectedClass, students, selectedStudents])

  // Update the getPanelSizes function
  const getPanelSizes = () => {
    let leftMd = 0
    let middleMd = 0
    let rightMd = 0

    // If right panel is active, make it full width
    if (rightPanelView !== "none") {
      if (rightPanelView === "assignmentFlow") {
        // Keep all three panels visible during assignment creation
        leftMd = 3
        middleMd = 6
        rightMd = 3
      } else {
        // For other right panel views (like report review), use full width
        leftMd = 0
        middleMd = 0
        rightMd = 12
      }
    } else if (mainView === "classList") {
      leftMd = 3
      middleMd = 9
      rightMd = 0
    } else if (mainView === "classDetail") {
      leftMd = 3
      middleMd = 9
      rightMd = 0
    } else if (mainView === "reportReview") {
      leftMd = 1
      middleMd = 3
      rightMd = 8
    } else {
      // Fallback: default two-panel layout
      leftMd = 3
      middleMd = 9
      rightMd = 0
    }

    return { leftMd, middleMd, rightMd }
  }

  const { leftMd, middleMd, rightMd } = getPanelSizes()
  const showThreePanelLayout =    mainView === "classList" || mainView === "classDetail" || mainView === "reportReview"

  // Handler for starting assignment flow
  const handleStartAssignmentFlow = async () => {
    if (!selectedClass) return
    setShowAssignmentUI(false)
    resetFlow()
    setRightPanelView("assignmentFlow")
    setError(null)

    // Fetch cases when starting assignment flow
    try {
      const fetchedCases = await getFacultyMedicalCases()
      setCases(fetchedCases)
    } catch (error) {
      console.error("Failed to fetch cases:", error)
      setError("Failed to load medical cases")
    }
  }

  // Handler for navigating to report review
  const handleNavigateToReportReview = (reportId: number) => {
    setSelectedReportId(reportId)
    setMainView("reportReview")
    setRightPanelView("report")
    setShowAssignmentUI(false)
    setError(null)
  }

  // Handler for processing row updates
  const handleProcessRowUpdate = async (
    newRow: ClassAssignmentStatus,
    oldRow: ClassAssignmentStatus,
  ): Promise<ClassAssignmentStatus> => {
    let processedDueDate = newRow.dueDate

    if ((newRow.dueDate as any) instanceof Date) {
      processedDueDate = (newRow.dueDate as unknown as Date).toISOString()
    } else if (typeof newRow.dueDate === "string") {
      try {
        processedDueDate = new Date(newRow.dueDate).toISOString()
      } catch (e) {
        console.error(
          "Error converting dueDate string to ISOString during update:",
          newRow.dueDate,
          e,
        )
        processedDueDate = oldRow.dueDate
      }
    } else if (newRow.dueDate === null || newRow.dueDate === undefined) {
      processedDueDate = oldRow.dueDate || ""
    }

    const updatedAssignments = assignments.map((asn) => asn.assignmentId === newRow.assignmentId ? { ...newRow, dueDate: processedDueDate } : asn,
    )
    setAssignments(updatedAssignments)

    return { ...newRow, dueDate: processedDueDate }
  }

  // Handler for back to class list
  const handleBackToClassList = () => {
    setMainView("classList")
    clearSelectedClass()
    setSelectedReportId(null)
    setRightPanelView("none")
    setShowAssignmentUI(false)
  }

  // Handler for returning to class detail
  const handleReturnToClassDetail = () => {
    setMainView("classDetail")
    setSelectedReportId(null)
    setRightPanelView("none")
    setShowAssignmentUI(false)
    setError(null)
  }

  // Helper functions for right panel title
  const getRightPanelTitleForTooltip = () => {
    if (mainView === "reportReview" && selectedReportId) {
      const assignment = assignments.find((a) => a.reportId === selectedReportId)
      return assignment?.caseTitle || "Report Detail"
    }
    return "Detail"
  }

  // Handler for assigning case
  const handleAssignCase = async () => {
    if (!selectedClass || !selectedCaseForAssignment || selectedStudents.length === 0) {
      setError("Please select a class, case, and at least one student")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await bulkAssignCase(
        selectedCaseForAssignment.id,
        selectedStudents,
        selectedClass.id,
        assignmentDueDate.toDate(),
      )

      if (response.success) {
        // Update assignments list
        const newAssignments = response.assignments
          .map((assignment: any): ClassAssignmentStatus | null => {
            // Ensure we have all required data
            if (!assignment || !assignment.student) {
              console.error("Invalid assignment data:", assignment)
              return null
            }

            return {
              assignmentId: assignment.id,
              caseId: assignment.case_id,
              caseTitle: selectedCaseForAssignment.title,
              studentId: assignment.student_id,
              studentName: assignment.student.name || "Unknown Student",
              studentEmail: assignment.student.email || "No email",
              dueDate: assignment.due_date,
              status: "not_started" as const,
              reportId: null,
              classId: selectedClass.id,
            }
          })
          .filter((assignment): assignment is ClassAssignmentStatus => assignment !== null)

        setAssignments((prev) => [...prev, ...newAssignments])

        // Show success message
        setSnackbar({
          open: true,
          message: response.message,
          severity: "success",
        })

        // Reset state using the hook's resetFlow
        resetFlow()

        // Close the right panel
        setRightPanelView("none")

        // Hide the success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 5000)
      } else {
        throw new Error(response.message || "Failed to assign cases")
      }
    } catch (err) {
      console.error("Error assigning cases:", err)
      setError(err instanceof Error ? err.message : "Failed to assign cases")
    } finally {
      setLoading(false)
    }
  }

  // Helper to close the CaseContentViewer in the right panel
  const handleCloseRightPanelCaseViewer = () => {
    // The viewerContent is managed by the hook via cancelFlow
    cancelFlow()
    setRightPanelView("none")
  }

  // Handler for canceling assignment flow
  const handleCancelAssignmentFlow = () => {
    setRightPanelView("none")
    cancelFlow()
    setError(null)
  }

  // Helper function for right panel display text
  const getRightPanelDisplayText = () => {
    if (mainView === "reportReview" && selectedReportId) {
      const assignment = assignments.find((a) => a.reportId === selectedReportId)
      return assignment?.studentName || "Report Details"
    }
    return "Detail"
  }

  const handleBulkAssignmentSuccess = (response: any) => {
    // Update the assignments list with the new assignments
    const newAssignments = response.assignments.map((assignment: any) => ({
      ...assignment,
      case: {
        id: assignment.case_id,
        title: selectedCaseForAssignment?.title || "Unknown Case", // Use selected case title if available
      },
    }))

    setAssignments((prev) => [...prev, ...newAssignments])

    // Show success message
    setSnackbar({
      open: true,
      message: response.message,
      severity: "success",
    })

    // Close the dialog
    setBulkAssignmentDialogOpen(false)
  }

  // Add memoized values for derived data
  const memoizedStudents = useMemo(() => students, [students])
  const memoizedAssignments = useMemo(() => assignments, [assignments])

  // Handler for deleting assignments
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!selectedClass) return

    try {
      await deleteAssignment(selectedClass.id, assignmentId)

      // Remove the assignment from local state
      setAssignments((prev) => prev.filter((assignment) => assignment.assignmentId !== assignmentId),
      )

      // Show success message
      setSnackbar({
        open: true,
        message: "Assignment deleted successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error deleting assignment:", error)
      setError(error instanceof Error ? error.message : "Failed to delete assignment")
    }
  }

  // Handler for bulk updating due dates
  const handleBulkUpdateDueDate = async (assignmentIds: number[], newDueDate: Date) => {
    if (!selectedClass) return

    try {
      // Make API call to update due dates
      await bulkUpdateDueDate(selectedClass.id, assignmentIds, newDueDate)

      // Update assignments in local state only after successful API call
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignmentIds.includes(assignment.assignmentId)
            ? { ...assignment, dueDate: newDueDate.toISOString() }
            : assignment,
        ),
      )

      // Show success message
      setSnackbar({
        open: true,
        message: `Updated due dates for ${assignmentIds.length} assignment${assignmentIds.length !== 1 ? "s" : ""}`,
        severity: "success",
      })
    } catch (error) {
      console.error("Error updating due dates:", error)
      setError(error instanceof Error ? error.message : "Failed to update due dates")
    }
  }

  const handleReportFinalize = useMemo(
    () => async () => {
      if (!selectedReportId) return

      try {
        // Call the backend finalize endpoint
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/aimhei-reports/${selectedReportId}/finalize`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error("Failed to finalize review")
        }

        // Update the assignment status in the assignments list
        const updatedAssignments = assignments.map((assignment) => {
          if (assignment.reportId === selectedReportId) {
            return {
              ...assignment,
              status: "reviewed" as const,
            }
          }
          return assignment
        })
        setAssignments(updatedAssignments)

        // Show success message
        setSnackbar({
          open: true,
          message: "Report has been finalized and is now visible to the student.",
          severity: "success",
        })

        // Navigate back to class detail view
        setMainView("classDetail")
        setRightPanelView("none")
        setSelectedReportId(null)
      } catch (err) {
        console.error("Failed to finalize review:", err)
        setError(err instanceof Error ? err.message : "Failed to finalize review")
      }
    },
    [assignments, selectedReportId],
  )

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container
        maxWidth="xl"
        sx={{ py: 3, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Modern Faculty Dashboard Header */}
        <FacultyDashboardHeader
          facultyData={facultyData}
          classes={classes}
          selectedClass={selectedClass}
          isLoadingStats={isLoadingStats}
          statsError={statsError}
          getGreeting={getGreeting}
          onClassSelect={handleClassSelect}
          onStartAssignmentFlow={handleStartAssignmentFlow}
        />

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
            <Grid
              container
              spacing={1.5}
              sx={{ height: "100%", overflow: "hidden", width: "100%" }}>
              {/* Left Panel */}
              <ClassListPanel
                classes={classes}
                selectedClass={selectedClass}
                isLoadingClasses={isLoadingClasses}
                leftMd={leftMd}
                mainView={mainView}
                selectedReportId={selectedReportId}
                onClassSelect={handleClassSelect}
                fadeVariants={fadeVariants}
              />

              {/* Middle Panel */}
              <StudentDetailsPanel
                selectedClass={selectedClass}
                students={memoizedStudents}
                assignments={memoizedAssignments}
                middleMd={middleMd}
                mainView={mainView}
                rightPanelView={rightPanelView}
                selectedReportId={selectedReportId}
                selectedStudents={selectedStudents}
                selectedCaseForAssignment={selectedCaseForAssignment}
                isAllStudentsSelected={isAllStudentsSelected}
                isLoadingAssignments={isLoadingAssignments}
                isLoadingStudents={isLoadingStudents}
                onStartAssignmentFlow={handleStartAssignmentFlow}
                onNavigateToReportReview={handleNavigateToReportReview}
                onProcessRowUpdate={handleProcessRowUpdate}
                onBackToClassList={handleBackToClassList}
                onDeleteAssignment={handleDeleteAssignment}
                onBulkUpdateDueDate={handleBulkUpdateDueDate}
                onStudentToggle={handleStudentToggle}
                onSelectAllStudents={handleSelectAllStudents}
                fadeVariants={fadeVariants}
              />

              {/* Right Panel */}
              <AssignmentPanel
                rightMd={rightMd}
                mainView={mainView}
                rightPanelView={rightPanelView}
                selectedClass={selectedClass}
                selectedReportId={selectedReportId}
                selectedCaseForAssignment={selectedCaseForAssignment}
                selectedStudents={selectedStudents}
                assignmentDueDate={assignmentDueDate}
                viewerContent={viewerContent}
                cases={cases}
                students={memoizedStudents}
                assignments={memoizedAssignments}
                loading={loading}
                isViewerOpen={isViewerOpen}
                confirmDialogOpen={confirmDialogOpen}
                onSetAssignmentDueDate={setAssignmentDueDate}
                onSetViewerContent={setViewerContent}
                onSetIsViewerOpen={setIsViewerOpen}
                onSetConfirmDialogOpen={setConfirmDialogOpen}
                onHandleReturnToClassDetail={handleReturnToClassDetail}
                onHandleReportFinalize={handleReportFinalize}
                onHandleCloseRightPanelCaseViewer={handleCloseRightPanelCaseViewer}
                onHandleCancelAssignmentFlow={handleCancelAssignmentFlow}
                onHandleCaseSelect={handleCaseSelect}
                onSetSelectedCaseForAssignment={(caseItem) => {
                  if (caseItem === null) {
                    cancelFlow()
                  }
                }}
                onHandleAssignCase={handleAssignCase}
                getRightPanelTitleForTooltip={getRightPanelTitleForTooltip}
                getRightPanelDisplayText={getRightPanelDisplayText}
              />
            </Grid>
          </Paper>
        )}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{
              position: "fixed",
              bottom: 20,
              left: 20,
              zIndex: 1500,
              maxWidth: "calc(100% - 40px)",
            }}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ mt: 8 }} // Add margin top to position below header
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  )
}
