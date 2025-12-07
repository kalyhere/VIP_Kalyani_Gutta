import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Chip,
  List,
  ListItemButton,
  Alert,
  CircularProgress,
  Container,
  alpha,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Divider,
  useTheme,
} from "@mui/material"
import { FlexCenterVertical, FlexRow, FlexColumn, FlexBetween } from "@/components/styled"
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Launch as LaunchIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import { format, parseISO, isBefore } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// Import types and services
import { StudentUser, StudentClass, StudentCaseAssignment } from "@/types/student-types"
import {
  getStudentStats,
  getStudentClasses,
  getStudentAssignments,
  launchVirtualPatient,
} from "@/services/studentService"

// Import shared components
import {
  StudentReportDetail,
  StudentCaseOverview,
  StudentAssignmentsCards,
} from "@/pages/student/components"

// Import shared utilities

// Create a motion-compatible version of MUI Box
const MotionBox = motion.create(Box)

// Typography system
const typography = {
  h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 },
  h2: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.35 },
  body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: "0.6875rem", fontWeight: 500, lineHeight: 1.4 },
}

// Spacing system
const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
  xxl: 4,
}

// Animation variants - simplified and refined
const fadeVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } },
}

export const StudentDashboard = () => {
  const theme = useTheme()

  // State management
  const [studentData, setStudentData] = useState<StudentUser | null>(null)
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [assignments, setAssignments] = useState<StudentCaseAssignment[]>([])
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dueDateFilter, setDueDateFilter] = useState<string>("all")

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)

  // Error and message states
  const [error, setError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: "success" | "error"
  }>({
    open: false,
    message: "",
    severity: "success",
  })

  // View management
  type MainView = "classList" | "classDetail" | "reportReview"
  const [mainView, setMainView] = useState<MainView>("classList")

  // Right panel management
  type RightPanelView = "none" | "caseOverview"
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>("none")

  // Effect hooks
  useEffect(() => {
    async function fetchStudentStats() {
      try {
        const data = await getStudentStats()
        setStudentData(data)
      } catch (err) {
        setStatsError("Failed to load student stats. Please try again.")
        console.error("Error loading student stats:", err)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStudentStats()
  }, [])

  useEffect(() => {
    async function fetchClasses() {
      try {
        setIsLoadingClasses(true)
        const data = await getStudentClasses()
        setClasses(data)
      } catch (err) {
        console.error("Error loading classes:", err)
        setError("Failed to load classes. Please try again.")
      } finally {
        setIsLoadingClasses(false)
      }
    }

    fetchClasses()
  }, [])

  // Handler functions
  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const handleClassSelect = async (
    classData: StudentClass,
    initialFilters?: { statusFilter?: string; dueDateFilter?: string },
    page: number = 0,
    limit: number = 5
  ) => {
    setSelectedClass(classData)
    setMainView("classDetail")
    setError(null)
    setCurrentPage(0) // Reset page when selecting a new class
    setRowsPerPage(limit)

    try {
      setIsLoadingAssignments(true)
      const response = await getStudentAssignments(
        classData.id,
        page,
        limit,
        statusFilter,
        dueDateFilter,
      )
      setAssignments(response.data)
      setTotalAssignments(response.total)

      // Apply initial filters if provided
      if (initialFilters) {
        // We'll need to pass these filters to the StudentAssignmentsCards component
        // For now, store them in state so they can be applied
        localStorage.setItem("studentDashboardFilters", JSON.stringify(initialFilters))
      }
    } catch (error: unknown) {
      console.error("Error fetching class assignments:", error)
      if (error instanceof Error) {
        setError(`Failed to load assignments: ${error.message}`)
      } else {
        setError("Failed to load assignments. Please try again.")
      }
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const handlePaginationChange = async (page: number, limit: number) => {
    if (!selectedClass) return

    setCurrentPage(page) // Update the controlled page state
    setRowsPerPage(limit)

    try {
      setIsLoadingAssignments(true)
      const response = await getStudentAssignments(
        selectedClass.id,
        page,
        limit,
        statusFilter,
        dueDateFilter,
      )
      setAssignments(response.data)
      setTotalAssignments(response.total)
    } catch (error: unknown) {
      console.error("Error fetching paginated assignments:", error)
      if (error instanceof Error) {
        setError(`Failed to load assignments: ${error.message}`)
      } else {
        setError("Failed to load assignments. Please try again.")
      }
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const handleFilterChange = async (newStatusFilter: string, newDueDateFilter: string) => {
    if (!selectedClass) return

    setStatusFilter(newStatusFilter)
    setDueDateFilter(newDueDateFilter)
    setCurrentPage(0) // Reset to first page when filters change

    try {
      setIsLoadingAssignments(true)
      const response = await getStudentAssignments(
        selectedClass.id,
        0,
        rowsPerPage,
        newStatusFilter,
        newDueDateFilter,
      )
      setAssignments(response.data)
      setTotalAssignments(response.total)
    } catch (error: unknown) {
      console.error("Error fetching filtered assignments:", error)
      if (error instanceof Error) {
        setError(`Failed to load assignments: ${error.message}`)
      } else {
        setError("Failed to load assignments. Please try again.")
      }
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  const handleLaunchVirtualPatient = async (assignmentId: number) => {
    setIsLaunching(true)
    try {
      const launchData = await launchVirtualPatient(assignmentId)
      // Navigate to Virtual Patient in same tab instead of opening new tab
      window.location.href = launchData.launchUrl

      // Use multiple fallback methods to ensure same-window navigation
      try {
        // Method 1: Try location.assign (most reliable for same-window)
        window.location.assign(launchData.launchUrl)
      } catch (assignError) {
        console.warn("location.assign failed, trying form submission:", assignError)

        // Method 2: Fallback to form submission
        const form = document.createElement("form")
        form.method = "GET"
        form.action = launchData.launchUrl
        form.target = "_self"
        form.style.display = "none"

        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)
      }
    } catch (error) {
      console.error("Error launching virtual patient:", error)
      setSnackbar({
        open: true,
        message: "Failed to launch virtual patient. Please try again.",
        severity: "error",
      })
      setIsLaunching(false)
    }
    // Note: Don't set setIsLaunching(false) in try block since we're navigating away
  }

  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId)
    setMainView("reportReview")
    setRightPanelView("none")
  }

  const handleBackToClassList = () => {
    setMainView("classList")
    setSelectedClass(null)
    setSelectedReportId(null)
    setSelectedCaseId(null)
    setRightPanelView("none")
  }

  const handleReturnToClassDetail = () => {
    setMainView("classDetail")
    setSelectedReportId(null)
    setSelectedCaseId(null)
    setRightPanelView("none")
  }

  const handleCaseClick = (caseId: number) => {
    setSelectedCaseId(caseId)
    setRightPanelView("caseOverview")
  }

  const handleCloseCaseOverview = () => {
    setSelectedCaseId(null)
    setRightPanelView("none")
  }

  // Get assignment status styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "not_started":
        return { label: "Not Started", color: theme.palette.text.secondary, icon: ScheduleIcon }
      case "in_progress":
        return { label: "In Progress", color: theme.palette.success.main, icon: PlayArrowIcon }
      case "pending_review":
        return { label: "Under Review", color: theme.palette.secondary.main, icon: AssessmentIcon }
      case "reviewed":
        return { label: "Completed", color: theme.palette.success.main, icon: CheckCircleIcon }
      default:
        return { label: "Unknown", color: theme.palette.text.secondary, icon: ScheduleIcon }
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: spacing.lg, minHeight: "95vh", display: "flex", flexDirection: "column" }}>
      {/* Enhanced Student Dashboard Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
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
            background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.success.main} 100%)`,
          },
        }}>
        <Box sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
          <Grid container spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
            {/* Left Section - Enhanced Profile */}
            <Grid size={{ xs: 12, lg: 5 }}>
              {isLoadingStats ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)} 25%, ${alpha(theme.palette.secondary.main, 0.15)} 50%, ${alpha(theme.palette.secondary.main, 0.1)} 75%)`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                      "@keyframes shimmer": {
                        "0%": { backgroundPosition: "-200% 0" },
                        "100%": { backgroundPosition: "200% 0" },
                      },
                    }}>
                    <Box>
                      <Box
                        sx={{
                          width: 160,
                          height: 18,
                          mb: 0.25,
                          borderRadius: 0.75,
                          background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)} 25%, ${alpha(theme.palette.secondary.main, 0.15)} 50%, ${alpha(theme.palette.secondary.main, 0.1)} 75%)`,
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite",
                        }}
                      />
                      <Box
                        sx={{
                          width: 90,
                          height: 12,
                          borderRadius: 0.75,
                          background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)} 25%, ${alpha(theme.palette.secondary.main, 0.15)} 50%, ${alpha(theme.palette.secondary.main, 0.1)} 75%)`,
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ) : statsError ? (
                <Alert severity="error" sx={{ borderRadius: 1.5, py: 0.75 }}>
                  {statsError}
                </Alert>
              ) : studentData ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {/* Enhanced Avatar with Status Indicator */}
                  <Box sx={{ position: "relative" }}>
                    <Avatar
                      sx={{
                        width: { xs: 38, sm: 42 },
                        height: { xs: 38, sm: 42 },
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        border: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                        boxShadow: `0 3px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: `0 5px 16px ${alpha(theme.palette.secondary.main, 0.25)}`,
                        },
                      }}>
                      <SchoolIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "white" }} />
                    </Avatar>
                    {/* Status Indicator */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0.5,
                        right: 0.5,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: theme.palette.success.main,
                        border: "2px solid white",
                        boxShadow: `0 1px 4px ${alpha(theme.palette.success.main, 0.4)}`,
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}` },
                          "70%": { boxShadow: `0 0 0 6px ${alpha(theme.palette.success.main, 0)}` },
                          "100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}` },
                        },
                      }}
                    />
                  </Box>

                  {/* Enhanced Profile Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        mb: 0.125,
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>
                      {getGreeting()},{studentData?.name?.split(" ")[0] || "Student"}
                    </Typography>

                    {/* Row 2: Role + Quick Action Pills */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                        Student
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </Grid>

            {/* Right Section - Enhanced Stats Dashboard */}
            <Grid size={{ xs: 12, lg: 7 }}>
              {isLoadingStats ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: 1.25,
                  }}>
                  {[...Array(4)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.05)} 25%, ${alpha(theme.palette.secondary.main, 0.1)} 50%, ${alpha(theme.palette.secondary.main, 0.05)} 75%)`,
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                        height: 55,
                      }}
                    />
                  ))}
                </Box>
              ) : statsError ? (
                <Alert severity="error" sx={{ borderRadius: 1.5, py: 0.75 }}>
                  {statsError}
                </Alert>
              ) : studentData ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(2, 1fr)",
                      lg: "repeat(4, 1fr)",
                    },
                    gap: { xs: 1.25, sm: 1.5, lg: 2 },
                  }}>
                  {/* Enhanced Stat Cards */}
                  {[
                    {
                      label: "Assigned",
                      value: studentData?.stats?.totalAssigned ?? 0,
                      icon: AssignmentIcon,
                      color: theme.palette.secondary.main,
                    },
                    {
                      label: "Completed",
                      value: studentData?.stats?.completed ?? 0,
                      icon: CheckCircleIcon,
                      color: theme.palette.success.main,
                    },
                    {
                      label: "Average",
                      value: `${studentData?.stats?.averageScore ?? 0}%`,
                      icon: TimelineIcon,
                      color: theme.palette.error.main,
                    },
                    {
                      label: "Reports",
                      value: studentData?.stats?.pendingReports ?? 0,
                      icon: AssessmentIcon,
                      color: theme.palette.error.main,
                      urgent: (studentData?.stats?.pendingReports ?? 0) > 0,
                    },
                  ].map((stat, index) => (
                    <MotionBox
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.25 }}
                      sx={{
                        p: { xs: 1, sm: 1.25 },
                        borderRadius: 1.75,
                        background: "white",
                        border: `1px solid ${alpha(stat.color, 0.12)}`,
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: `0 6px 20px ${alpha(stat.color, 0.15)}`,
                          borderColor: alpha(stat.color, 0.25),
                          "&::before": {
                            transform: "translateX(0)",
                          },
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.6)} 100%)`,
                          transform: "translateX(-100%)",
                          transition: "transform 0.3s ease-in-out",
                        },
                      }}>
                      {/* Horizontal Layout: Icon + Label + Value */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {/* Icon */}
                        <Box
                          sx={{
                            width: { xs: 22, sm: 26 },
                            height: { xs: 22, sm: 26 },
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                            border: `1px solid ${alpha(stat.color, 0.15)}`,
                            flexShrink: 0,
                          }}>
                          <stat.icon
                            sx={{ color: stat.color, fontSize: { xs: "0.85rem", sm: "1rem" } }}
                          />
                        </Box>

                        {/* Label */}
                        <Typography
                          variant="overline"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            lineHeight: 1,
                            letterSpacing: 0.5,
                            flexGrow: 1,
                            minWidth: 0,
                          }}>
                          {stat.label}
                        </Typography>

                        {/* Value */}
                        <Typography
                          variant="h6"
                          sx={{
                            color: stat.color,
                            fontWeight: 800,
                            lineHeight: 1,
                            fontSize: { xs: "1.1rem", sm: "1.3rem" },
                            flexShrink: 0,
                          }}>
                          {stat.value}
                        </Typography>

                        {/* Urgent Indicator */}
                        {stat.urgent && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              bgcolor: theme.palette.error.main,
                              animation: "pulse 2s infinite",
                              flexShrink: 0,
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </MotionBox>
                  ))}
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.common.white,
          p: { xs: spacing.md, sm: spacing.lg },
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}>
        {mainView === "reportReview" && selectedReportId ? (
          // Full screen report view
          <MotionBox
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}>
            <Box>
              <Box
                sx={{
                  p: spacing.lg,
                  flexShrink: 0,
                  pb: spacing.md,
                }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{
                        ...typography.caption,
                        color: theme.palette.secondary.main,
                        display: "block",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        mb: spacing.xs,
                      }}>
                      Case Report
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        ...typography.h3,
                        color: theme.palette.text.primary,
                      }}>
                      Report Details
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleReturnToClassDetail}
                    sx={{
                      color: theme.palette.secondary.main,
                      borderColor: theme.palette.divider,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.secondary.main, 0.04),
                        borderColor: theme.palette.secondary.main,
                      },
                    }}>
                    Back to Assignments
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mx: spacing.lg }} />
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  overflow: "hidden",
                  m: spacing.lg,
                  mt: spacing.md,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.common.white,
                }}>
                <StudentReportDetail reportId={selectedReportId} />
              </Paper>
            </Box>
          </MotionBox>
        ) : (
          /* Three Panel Layout */
          <Grid container spacing={spacing.lg} sx={{ width: "100%" }}>
            {/* Left Panel - Classes */}
            <Grid size={{ xs: 12, md: rightPanelView !== "none" ? 3 : 4 }}>
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  // px: 2,
                }}>
                <Box>
                  <Box
                    sx={{
                      p: spacing.lg,
                      flexShrink: 0,
                      pb: spacing.md,
                    }}>
                    <Typography
                      variant="overline"
                      sx={{
                        ...typography.caption,
                        color: theme.palette.secondary.main,
                        display: "block",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        mb: spacing.xs,
                      }}>
                      My Classes
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        ...typography.h3,
                        color: theme.palette.text.primary,
                      }}>
                      Enrolled
                    </Typography>
                  </Box>
                  <Divider sx={{ mx: spacing.lg }} />
                  <Box sx={{ flexGrow: 1 }}>
                    {isLoadingClasses ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: spacing.md,
                          p: spacing.lg,
                        }}>
                        {[...Array(3)].map((_, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.05,
                              ease: "easeOut",
                            }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing.lg,
                                p: spacing.lg,
                                borderRadius: 2,
                                backgroundColor: theme.palette.background.default,
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            />
                          </motion.div>
                        ))}
                      </Box>
                    ) : classes.length === 0 ? (
                      <Box sx={{ p: spacing.xl, textAlign: "center" }}>
                        <SchoolIcon
                          sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: spacing.lg }}
                        />
                        <Typography
                          sx={{
                            ...typography.body1,
                            color: theme.palette.text.secondary,
                          }}>
                          No classes found.
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: spacing.md,
                          pt: spacing.lg,
                          pb: spacing.xl,
                        }}>
                        <List dense sx={{ p: 0 }}>
                          {classes.map((classData, index) => {
                            const isSelected = selectedClass?.id === classData.id

                            return (
                              <motion.div
                                key={classData.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.05,
                                  ease: "easeOut",
                                }}>
                                <ListItemButton
                                  selected={isSelected}
                                  onClick={() => handleClassSelect(classData)}
                                  sx={{
                                    borderRadius: 2,
                                    mb: spacing.md,
                                    border: "1px solid",
                                    transition: "all 0.2s ease",
                                    cursor: "pointer",
                                    position: "relative",
                                    p: spacing.lg,
                                    borderColor: isSelected
                                      ? theme.palette.secondary.main
                                      : theme.palette.divider,
                                    bgcolor: isSelected
                                      ? alpha(theme.palette.secondary.main, 0.04)
                                      : theme.palette.common.white,
                                    ...(isSelected && {
                                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                                      transform: "translateY(-1px)",
                                    }),
                                    "&:hover": {
                                      borderColor: theme.palette.secondary.main,
                                      bgcolor: isSelected
                                        ? alpha(theme.palette.secondary.main, 0.06)
                                        : alpha(theme.palette.secondary.main, 0.02),
                                      transform: "translateY(-2px)",
                                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                    },
                                  }}>
                                  <Avatar
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      bgcolor: isSelected
                                        ? theme.palette.secondary.main
                                        : alpha(theme.palette.secondary.main, 0.1),
                                      color: isSelected ? theme.palette.common.white : theme.palette.secondary.main,
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      mr: spacing.lg,
                                      border: `2px solid ${isSelected ? theme.palette.secondary.main : "transparent"}`,
                                      transition: "all 0.2s ease",
                                    }}>
                                    {classData.code.substring(0, 2).toUpperCase()}
                                  </Avatar>

                                  <Box sx={{ flexGrow: 1, ml: 0, minWidth: 0 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        ...typography.body1,
                                        fontWeight: isSelected ? 600 : 500,
                                        color: isSelected ? theme.palette.secondary.main : theme.palette.text.primary,
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
                                        gap: spacing.sm,
                                        mt: spacing.xs,
                                      }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}>
                                        {classData.code} •{classData.assignedCases}{" "}
                                        {classData.assignedCases === 1 ? "case" : "cases"}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {classData.pendingReports > 0 && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-end",
                                        gap: spacing.xs,
                                      }}>
                                      <Chip
                                        label={classData.pendingReports}
                                        size="small"
                                        sx={{
                                          bgcolor: alpha(theme.palette.error.main, 0.1),
                                          color: theme.palette.error.main,
                                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                          fontSize: "0.7rem",
                                          height: 20,
                                          minWidth: 28,
                                          "& .MuiChip-label": { px: spacing.xs },
                                        }}
                                      />
                                    </Box>
                                  )}
                                </ListItemButton>
                              </motion.div>
                            )
                          })}
                        </List>
                      </Box>
                    )}
                  </Box>

                  {/* Quick Actions Footer - Similar to Faculty Dashboard */}
                  {(() => {
                    const actionableAssignments = assignments.filter(
                      (a) => a.status === "not_started" || a.status === "in_progress"
                    )
                    const completedAssignments = assignments.filter(
                      (a) => a.status === "reviewed" && a.reportId
                    )
                    const hasQuickActions =
                      actionableAssignments.length > 0 || completedAssignments.length > 0

                    return hasQuickActions && classes.length > 0 ? (
                      <Box
                        sx={{
                          borderTop: 1,
                          borderColor: "divider",
                          pt: 1.5,
                          pb: 2.5,
                          mt: 1,
                          flexShrink: 0,
                          px: spacing.lg,
                        }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1, display: "block" }}>
                          Quick Actions
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                          {/* Jump to first actionable assignment */}
                          {actionableAssignments.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                startIcon={<PlayArrowIcon />}
                                onClick={() => {
                                  const firstActionableAssignment = actionableAssignments[0]
                                  const classWithActionable = classes.find((c) =>
                                    assignments.some(
                                    (a) =>
                                        a.assignmentId === firstActionableAssignment.assignmentId
                                    )
                                  )
                                  if (classWithActionable) {
                                    handleClassSelect(classWithActionable, {
                                      statusFilter: "actionable",
                                    })
                                  }
                                }}
                                sx={{
                                  fontSize: "0.65rem",
                                  py: 0.5,
                                  px: 1,
                                  minWidth: "auto",
                                  borderColor: theme.palette.error.main,
                                  color: theme.palette.error.main,
                                  "&:hover": {
                                    borderColor: theme.palette.error.dark,
                                    bgcolor: alpha(theme.palette.error.main, 0.04),
                                  },
                                }}>
                                Continue Learning
                              </Button>
                            </motion.div>
                          )}

                          {/* Jump to reports - only if there are completed assignments with reports */}
                          {completedAssignments.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                startIcon={<AssessmentIcon />}
                                onClick={() => {
                                  const classWithReports = classes.find((c) =>
                                    assignments.some((a) => a.status === "reviewed" && a.reportId)
                                  )
                                  if (classWithReports) {
                                    handleClassSelect(classWithReports, {
                                      statusFilter: "reviewed",
                                    })
                                  }
                                }}
                                sx={{
                                  fontSize: "0.65rem",
                                  py: 0.5,
                                  px: 1,
                                  minWidth: "auto",
                                  borderColor: theme.palette.success.main,
                                  color: theme.palette.success.main,
                                  "&:hover": {
                                    borderColor: theme.palette.secondary.main,
                                    bgcolor: alpha(theme.palette.success.main, 0.04),
                                  },
                                }}>
                                View Reports
                              </Button>
                            </motion.div>
                          )}
                        </Box>
                      </Box>
                    ) : null
                  })()}
                </Box>
              </Paper>
            </Grid>

            {/* Middle Panel - Assignments */}
            <Grid size={{ xs: 12, md: rightPanelView !== "none" ? 6 : 8 }}>
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  p: 2,
                }}>
                {selectedClass ? (
                  <>
                    <Box
                      sx={{
                        pb: 1,
                        mb: 1.5,
                        borderBottom: 1,
                        borderColor: "divider",
                        flexShrink: 0,
                      }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                        <Box>
                          <Typography
                            variant="overline"
                            sx={{ color: theme.palette.secondary.main, display: "block", lineHeight: 1.2 }}>
                            Case Assignments
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                            {selectedClass.name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      {isLoadingAssignments ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "200px",
                          }}>
                          <CircularProgress size={40} />
                          <Typography sx={{ ml: 2 }}>Loading assignments...</Typography>
                        </Box>
                      ) : (
                        <StudentAssignmentsCards
                          assignments={assignments}
                          totalAssignments={totalAssignments}
                          onLaunchVirtualPatient={handleLaunchVirtualPatient}
                          onViewReport={handleViewReport}
                          onCaseClick={handleCaseClick}
                          onPaginationChange={handlePaginationChange}
                          onFilterChange={handleFilterChange}
                          isLaunching={isLaunching}
                          page={currentPage}
                          rowsPerPage={rowsPerPage}
                          statusFilter={statusFilter}
                          dueDateFilter={dueDateFilter}
                        />
                      )}
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      p: 4,
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}>
                    <SchoolIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      Select a class
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Choose a class from the left panel to see your assignments.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Panel - Case Overview Only */}
            <AnimatePresence initial={false}>
              {rightPanelView === "caseOverview" && selectedCaseId && (
                <Grid size={{ xs: 12, md: 3 }} key="right-panel">
                  <MotionBox
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                      }}>
                      <StudentCaseOverview
                        caseId={selectedCaseId}
                        onLaunch={handleLaunchVirtualPatient}
                        onClose={handleCloseCaseOverview}
                        isLaunching={isLaunching}
                      />
                    </Paper>
                  </MotionBox>
                </Grid>
              )}
            </AnimatePresence>
          </Grid>
        )}
      </Paper>

      {/* Error Messages */}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: 8 }}>
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
