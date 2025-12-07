import React, { useState, useMemo } from "react"
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Stack,
  alpha,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TablePagination,
  useTheme,
} from "@mui/material"
import {
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Launch as LaunchIcon,
  Visibility as VisibilityIcon,
  LocalHospital as CaseIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material"
import { format, parseISO, isBefore, isAfter } from "date-fns"
import { motion } from "framer-motion"
import { StudentCaseAssignment } from "@/types/student-types"

// Define UA Brand Colors

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

interface StudentAssignmentsCardsProps {
  assignments: StudentCaseAssignment[]
  totalAssignments: number
  onLaunchVirtualPatient: (assignmentId: number) => void
  onViewReport: (reportId: number) => void
  onCaseClick: (caseId: number) => void
  onPaginationChange: (page: number, limit: number) => void
  onFilterChange?: (statusFilter: string, dueDateFilter: string) => void
  isLaunching: boolean
  page?: number // Controlled page state from parent
  rowsPerPage?: number // Controlled rowsPerPage state from parent
  statusFilter?: string // Controlled status filter from parent
  dueDateFilter?: string // Controlled due date filter from parent
}

type StatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "reviewed"
  | "actionable"
type DueDateFilter = "all" | "future" | "past"

export const StudentAssignmentsCards: React.FC<StudentAssignmentsCardsProps> = ({
  assignments,
  totalAssignments,
  onLaunchVirtualPatient,
  onViewReport,
  onCaseClick,
  onPaginationChange,
  onFilterChange,
  isLaunching,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  statusFilter: controlledStatusFilter,
  dueDateFilter: controlledDueDateFilter,
}) => {
  const theme = useTheme()

  const [internalStatusFilter, setInternalStatusFilter] = useState<StatusFilter>("all")
  const [internalDueDateFilter, setInternalDueDateFilter] = useState<DueDateFilter>("all")

  // Use controlled props if provided, otherwise fall back to internal state
  const statusFilter =    controlledStatusFilter !== undefined
      ? (controlledStatusFilter as StatusFilter)
      : internalStatusFilter
  const dueDateFilter =    controlledDueDateFilter !== undefined
      ? (controlledDueDateFilter as DueDateFilter)
      : internalDueDateFilter
  const [launchModalOpen, setLaunchModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<StudentCaseAssignment | null>(null)

  // Use controlled props if provided, otherwise fall back to internal state
  const [internalPage, setInternalPage] = useState(0)
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(5)
  const page = controlledPage !== undefined ? controlledPage : internalPage
  const rowsPerPage =    controlledRowsPerPage !== undefined ? controlledRowsPerPage : internalRowsPerPage

  // Check for stored filters when component mounts
  React.useEffect(() => {
    const storedFilters = localStorage.getItem("studentDashboardFilters")
    if (storedFilters) {
      try {
        const filters = JSON.parse(storedFilters)
        if (filters.statusFilter) {
          setInternalStatusFilter(filters.statusFilter as StatusFilter)
        }
        if (filters.dueDateFilter) {
          setInternalDueDateFilter(filters.dueDateFilter as DueDateFilter)
        }
        // Clear the stored filters after applying them
        localStorage.removeItem("studentDashboardFilters")
      } catch (error) {
        console.error("Error parsing stored filters:", error)
      }
    }
  }, [])

  // Note: Page state is now controlled by the parent component (StudentDashboard)
  // The parent manages page/rowsPerPage and resets them when switching classes

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "not_started":
        return {
          label: "Ready to Start",
          color: theme.palette.secondary.main,
          icon: PlayArrowIcon,
          bgColor: alpha(theme.palette.secondary.main, 0.1),
        }
      case "in_progress":
        return {
          label: "In Progress",
          color: theme.palette.secondary.light,
          icon: PlayArrowIcon,
          bgColor: alpha(theme.palette.secondary.light, 0.1),
        }
      case "pending_review":
        return {
          label: "Submitted",
          color: theme.palette.secondary.main,
          icon: CheckCircleIcon,
          bgColor: alpha(theme.palette.secondary.main, 0.1),
        }
      case "submitted":
        return {
          label: "Submitted",
          color: theme.palette.secondary.main,
          icon: CheckCircleIcon,
          bgColor: alpha(theme.palette.secondary.main, 0.1),
        }
      case "reviewed":
        return {
          label: "Completed",
          color: theme.palette.secondary.light,
          icon: AssessmentIcon,
          bgColor: alpha(theme.palette.secondary.light, 0.1),
        }
      default:
        // Better fallback based on what's likely happening
        return {
          label: "Available",
          color: theme.palette.secondary.main,
          icon: PlayArrowIcon,
          bgColor: alpha(theme.palette.secondary.main, 0.1),
        }
    }
  }
  // Note: Filtering is now handled on the backend for better performance
  // For now, we keep the filter UI but pagination triggers backend calls
  // TODO: Move filtering to backend as well

  // Pagination handlers - now triggers backend data fetch
  const handleChangePage = (_event: unknown, newPage: number) => {
    // If using controlled state, just call the parent handler
    if (controlledPage !== undefined) {
      onPaginationChange(newPage, rowsPerPage)
    } else {
      // Otherwise update internal state
      setInternalPage(newPage)
      onPaginationChange(newPage, rowsPerPage)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10)

    // If using controlled state, just call the parent handler
    if (controlledRowsPerPage !== undefined) {
      onPaginationChange(0, newRowsPerPage)
    } else {
      // Otherwise update internal state
      setInternalRowsPerPage(newRowsPerPage)
      setInternalPage(0)
      onPaginationChange(0, newRowsPerPage)
    }
  }

  // Launch Confirmation Modal Component
  const LaunchConfirmationModal = () => (
    <Dialog
      open={launchModalOpen}
      onClose={() => setLaunchModalOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          boxShadow: `0 20px 40px ${alpha(theme.palette.text.secondary, 0.15)}`,
        },
      }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.04)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
          p: spacing.xl,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          position: "relative",
        }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: spacing.md }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}>
              <PlayArrowIcon sx={{ color: theme.palette.background.paper, fontSize: "1.5rem" }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  ...typography.h2,
                  color: theme.palette.text.primary,
                  mb: spacing.xs,
                }}>
                {selectedAssignment?.status === "not_started"
                  ? "Launch Virtual Patient"
                  : "Continue Virtual Patient"}
              </Typography>
              <Typography
                sx={{
                  ...typography.body2,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}>
                {selectedAssignment?.caseTitle}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setLaunchModalOpen(false)}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              "&:hover": {
                bgcolor: alpha(theme.palette.divider, 0.8),
                color: theme.palette.text.secondary,
              },
            }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: spacing.xl }}>
        <Box sx={{ display: "flex", gap: spacing.xl, alignItems: "flex-start" }}>
          {/* Content Details */}
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                ...typography.body1,
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                mb: spacing.lg,
              }}>
              {selectedAssignment?.status === "not_started"
                ? "Ready to begin your virtual patient encounter. You'll interact with a realistic patient simulation to practice your clinical skills and apply your medical knowledge."
                : "Continue where you left off in your virtual patient encounter. Your progress has been automatically saved and you can pick up exactly where you stopped."}
            </Typography>

            {/* Info Cards */}
            <Box sx={{ display: "flex", gap: spacing.md, mb: spacing.lg }}>
              {selectedAssignment?.dueDate && (
                <Box
                  sx={{
                    flex: 1,
                    p: spacing.md,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  }}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: spacing.sm, mb: spacing.xs }}>
                    <ScheduleIcon sx={{ color: theme.palette.text.secondary, fontSize: "1rem" }} />
                    <Typography
                      sx={{
                        ...typography.caption,
                        color: theme.palette.text.secondary,
                        textTransform: "uppercase",
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}>
                      Due Date
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      ...typography.body2,
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                    }}>
                    {format(parseISO(selectedAssignment.dueDate), "MMMM d, yyyy")}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  flex: 1,
                  p: spacing.md,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: spacing.sm, mb: spacing.xs }}>
                  <CaseIcon sx={{ color: theme.palette.secondary.main, fontSize: "1rem" }} />
                  <Typography
                    sx={{
                      ...typography.caption,
                      color: theme.palette.secondary.main,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                    Session Type
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    ...typography.body2,
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                  }}>
                  Virtual Patient Simulation
                </Typography>
              </Box>
            </Box>

            {/* Warning for not started cases */}
            {selectedAssignment?.status === "not_started" && (
              <Box
                sx={{
                  p: spacing.md,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.secondary.light, 0.04),
                  border: `1px solid ${alpha(theme.palette.secondary.light, 0.2)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.secondary.light, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: theme.palette.secondary.light,
                    }}>
                    i
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    ...typography.caption,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.4,
                  }}>
                  This simulation will open in a new tab. Make sure pop-ups are enabled for the best
                  experience.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          p: spacing.xl,
          pt: 0,
          display: "flex",
          gap: spacing.md,
          justifyContent: "flex-end",
        }}>
        <Button
          variant="outlined"
          onClick={() => setLaunchModalOpen(false)}
          sx={{
            color: theme.palette.text.secondary,
            borderColor: alpha(theme.palette.divider, 0.8),
            ...typography.body2,
            fontWeight: 600,
            textTransform: "none",
            px: spacing.xl,
            py: spacing.sm,
            height: 44,
            borderRadius: 2.5,
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: theme.palette.text.disabled,
              bgcolor: alpha(theme.palette.background.default, 0.8),
            },
          }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedAssignment) {
              onLaunchVirtualPatient(selectedAssignment.assignmentId)
              setLaunchModalOpen(false)
            }
          }}
          disabled={isLaunching}
          startIcon={<PlayArrowIcon />}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.background.paper,
            ...typography.body2,
            fontWeight: 600,
            textTransform: "none",
            px: spacing.xl,
            py: spacing.sm,
            height: 44,
            borderRadius: 2.5,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            transition: "all 0.2s ease",
            "&:hover": {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              transform: "translateY(-1px)",
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            "&:disabled": {
              background: alpha(theme.palette.divider, 0.6),
              color: alpha(theme.palette.text.secondary, 0.8),
              transform: "none",
              boxShadow: "none",
            },
          }}>
          {isLaunching
            ? "Launching..."
            : selectedAssignment?.status === "not_started"
              ? "Launch Virtual Patient"
              : "Continue Session"}
        </Button>
      </Box>
    </Dialog>
  )

  const handleLaunchClick = (assignment: StudentCaseAssignment) => {
    setSelectedAssignment(assignment)
    setLaunchModalOpen(true)
  }

  // Check if filters are active
  const hasActiveFilters = statusFilter !== "all" || dueDateFilter !== "all"

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Launch Confirmation Modal */}
      <LaunchConfirmationModal />

      {/* Filter Section */}
      <Box sx={{ flexShrink: 0, p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.12)}`,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
              borderRadius: "2px 2px 0 0",
            },
          }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}>
            {/* Status Filter Group */}
            <Box sx={{ minWidth: 0, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 1,
                  display: "block",
                }}>
                Status
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {[
                  { value: "all", label: "All" },
                  { value: "not_started", label: "Not Started" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "pending_review", label: "Submitted" },
                  { value: "reviewed", label: "Completed" },
                ].map((status) => (
                  <Button
                    key={status.value}
                    size="small"
                    variant={statusFilter === status.value ? "contained" : "outlined"}
                    onClick={() => {
                      const newStatus = status.value as StatusFilter
                      if (onFilterChange) {
                        onFilterChange(newStatus, dueDateFilter)
                      } else {
                        setInternalStatusFilter(newStatus)
                      }
                    }}
                    sx={{
                      minWidth: "auto",
                      px: 1.5,
                      py: 0.5,
                      height: 32,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: 2,
                      transition: "all 0.2s ease-in-out",
                      ...(statusFilter === status.value
                        ? {
                            bgcolor: theme.palette.secondary.main,
                            color: theme.palette.background.paper,
                            border: "none",
                            boxShadow: `0 2px 6px ${alpha(theme.palette.secondary.main, 0.3)}`,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                              boxShadow: `0 3px 8px ${alpha(theme.palette.secondary.main, 0.4)}`,
                            },
                          }
                        : {
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            borderColor: alpha(theme.palette.text.primary, 0.2),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.secondary.main, 0.08),
                              borderColor: theme.palette.secondary.main,
                            },
                          }),
                    }}>
                    {status.label}
                  </Button>
                ))}
                {/* Show special indicator when 'actionable' filter is active */}
                {statusFilter === "actionable" && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      if (onFilterChange) {
                        onFilterChange("all", dueDateFilter)
                      } else {
                        setInternalStatusFilter("all")
                      }
                    }}
                    sx={{
                      minWidth: "auto",
                      px: 1.5,
                      py: 0.5,
                      height: 32,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: theme.palette.secondary.light,
                      color: theme.palette.background.paper,
                      "&:hover": {
                        bgcolor: theme.palette.secondary.main,
                      },
                    }}>
                    ⚡ Continue Learning
                  </Button>
                )}
              </Box>
            </Box>

            {/* Due Date Filter Group */}
            <Box sx={{ minWidth: 0, flex: { xs: "1 1 auto", sm: "0 0 auto" } }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 1,
                  display: "block",
                }}>
                Due Date
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {[
                  { value: "all", label: "All", icon: null },
                  { value: "future", label: "Future", icon: null },
                  { value: "past", label: "Past", icon: null },
                ].map((filter) => (
                  <Chip
                    key={filter.value}
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                        {filter.label}
                      </Box>
                    }
                    clickable
                    size="small"
                    variant={dueDateFilter === filter.value ? "filled" : "outlined"}
                    onClick={() => {
                      const newDueDateFilter = filter.value as DueDateFilter
                      if (onFilterChange) {
                        onFilterChange(statusFilter, newDueDateFilter)
                      } else {
                        setInternalDueDateFilter(newDueDateFilter)
                      }
                    }}
                    sx={{
                      height: 32,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      borderRadius: 2,
                      transition: "all 0.2s ease-in-out",
                      "& .MuiChip-label": { px: 1.25 },
                      ...(dueDateFilter === filter.value
                        ? {
                            bgcolor: theme.palette.secondary.main,
                            color: theme.palette.background.paper,
                            borderColor: theme.palette.secondary.main,
                            boxShadow: `0 2px 6px ${alpha(theme.palette.secondary.main, 0.3)}`,
                            "&:hover": {
                              bgcolor: theme.palette.primary.light,
                            },
                          }
                        : {
                            bgcolor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            borderColor: alpha(theme.palette.text.primary, 0.2),
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.light, 0.08),
                              borderColor: theme.palette.secondary.main,
                            },
                          }),
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Pagination Group */}
            <Box sx={{ minWidth: 0, flex: { xs: "1 1 auto", sm: "0 0 auto" } }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 1,
                  display: "block",
                }}>
                Per Page
              </Typography>
              <Box sx={{ width: "100%", minWidth: 0 }}>
                <TablePagination
                  component="div"
                  count={totalAssignments}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Per page"
                  sx={{
                    height: 32,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      borderColor: theme.palette.secondary.main,
                    },
                    "& .MuiTablePagination-toolbar": {
                      minHeight: 32,
                      height: 32,
                      padding: 0,
                      justifyContent: "flex-start",
                    },
                    "& .MuiTablePagination-selectLabel": {
                      display: "none",
                    },
                    "& .MuiTablePagination-displayedRows": {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      margin: 0,
                      lineHeight: 1,
                    },
                    "& .MuiTablePagination-select": {
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      padding: 0,
                    },
                    "& .MuiTablePagination-actions": {
                      marginLeft: 0.5,
                      "& button": {
                        padding: 0.25,
                        color: theme.palette.text.primary,
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Assignment Cards */}
      <Box
        sx={{
          p: 2,
        }}>
        {assignments.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            {hasActiveFilters ? (
              <>
                <FilterListIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assignments match your filters
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Try adjusting your filter criteria.
                </Typography>
              </>
            ) : (
              <>
                <CaseIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assignments yet
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Your instructor hasn't assigned any cases for this class.
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.lg,
              pb: spacing.xxl, // Increased bottom padding
            }}>
            {assignments.map((assignment, index) => {
              const statusInfo = getStatusInfo(assignment.status)
              const StatusIcon = statusInfo.icon
              const canLaunch =
                assignment.status === "not_started" || assignment.status === "in_progress"
              const isOverdue =
                assignment.dueDate && isBefore(parseISO(assignment.dueDate), new Date())
              const isPastDue = isOverdue && canLaunch // Only show "Past Due Date" for launchable assignments that are overdue

              return (
                <motion.div
                  key={assignment.assignmentId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.02 }}>
                  <Card
                    elevation={0}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      transition: "all 0.2s ease",
                      border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                      position: "relative",
                      overflow: "hidden",
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.3)} 100%)`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.text.disabled, 0.08)}`,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: `0 12px 32px ${alpha(theme.palette.text.disabled, 0.18)}`,
                        borderColor: alpha(statusInfo.color, 0.6),
                      },
                    }}>
                    <CardContent sx={{ p: spacing.xl }}>
                      {/* Header Section */}
                      <Box sx={{ mb: spacing.xl }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            mb: spacing.md,
                          }}>
                          <Typography
                            variant="h6"
                            sx={{
                              ...typography.h3,
                              color: theme.palette.text.primary,
                              lineHeight: 1.3,
                              flex: 1,
                              pr: spacing.lg,
                            }}>
                            {assignment.caseTitle}
                          </Typography>

                          {/* Primary Action Button - Top Right */}
                          {assignment.status === "reviewed" && assignment.reportId ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.08 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="contained"
                                startIcon={<AssessmentIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => onViewReport(assignment.reportId!)}
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                  color: theme.palette.background.paper,
                                  ...typography.body2,
                                  fontWeight: 600,
                                  height: 42,
                                  textTransform: "none",
                                  borderRadius: 2.5,
                                  px: spacing.lg,
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.light, 0.3)}`,
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  position: "relative",
                                  overflow: "hidden",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: "-100%",
                                    width: "100%",
                                    height: "100%",
                                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.background.paper, 0.2)}, transparent)`,
                                    transition: "left 0.5s ease",
                                  },
                                  "&:hover": {
                                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                                    transform: "translateY(-2px)",
                                    boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.light, 0.4)}`,
                                    "&::before": {
                                      left: "100%",
                                    },
                                  },
                                }}>
                                View Report
                              </Button>
                            </motion.div>
                          ) : assignment.status === "pending_review" ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.08 }}
                              whileHover={{ scale: 1.02 }}>
                              <Chip
                                label="Under Review"
                                sx={{
                                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                  color: theme.palette.secondary.main,
                                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                                  ...typography.body2,
                                  height: 42,
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  "& .MuiChip-label": { px: spacing.lg },
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                    borderColor: alpha(theme.palette.secondary.main, 0.5),
                                    transform: "translateY(-1px)",
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                  },
                                }}
                              />
                            </motion.div>
                          ) : assignment.reportId ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.08 }}>
                              <Chip
                                label="Processing"
                                sx={{
                                  bgcolor: alpha(theme.palette.text.disabled, 0.1),
                                  color: theme.palette.text.secondary,
                                  border: `1px solid ${alpha(theme.palette.text.disabled, 0.3)}`,
                                  ...typography.body2,
                                  height: 42,
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  "& .MuiChip-label": { px: spacing.lg },
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                              />
                            </motion.div>
                          ) : isPastDue ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.08 }}
                              whileHover={{ scale: 1.02 }}>
                              <Chip
                                label="Past Due Date"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                  ...typography.body2,
                                  height: 42,
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  "& .MuiChip-label": { px: spacing.lg },
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                    borderColor: alpha(theme.palette.primary.main, 0.5),
                                    transform: "translateY(-1px)",
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                  },
                                }}
                              />
                            </motion.div>
                          ) : canLaunch ? (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.08 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="contained"
                                startIcon={<PlayArrowIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => handleLaunchClick(assignment)}
                                sx={{
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                  color: theme.palette.background.paper,
                                  ...typography.body2,
                                  fontWeight: 600,
                                  height: 42,
                                  textTransform: "none",
                                  borderRadius: 2.5,
                                  px: spacing.lg,
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  position: "relative",
                                  overflow: "hidden",
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: "-100%",
                                    width: "100%",
                                    height: "100%",
                                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.background.paper, 0.2)}, transparent)`,
                                    transition: "left 0.5s ease",
                                  },
                                  "&:hover": {
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                                    transform: "translateY(-2px)",
                                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                                    "&::before": {
                                      left: "100%",
                                    },
                                  },
                                }}>
                                {assignment.status === "not_started"
                                  ? "Launch Virtual Patient"
                                  : "Continue Session"}
                              </Button>
                            </motion.div>
                          ) : null}
                        </Box>

                        {/* Status Row */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: spacing.lg,
                            flexWrap: "wrap",
                          }}>
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.02 + 0.05 }}>
                            <Chip
                              icon={<StatusIcon sx={{ fontSize: "0.85rem !important" }} />}
                              label={statusInfo.label}
                              size="medium"
                              sx={{
                                bgcolor: statusInfo.bgColor,
                                color: statusInfo.color,
                                border: `1px solid ${alpha(statusInfo.color, 0.3)}`,
                                ...typography.body2,
                                height: 32,
                                fontWeight: 600,
                                "& .MuiChip-label": { px: spacing.md },
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                  boxShadow: `0 4px 12px ${alpha(statusInfo.color, 0.25)}`,
                                  borderColor: alpha(statusInfo.color, 0.6),
                                },
                              }}
                            />
                          </motion.div>

                          {assignment.status === "pending_review" ? (
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.25, delay: index * 0.02 + 0.08 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}>
                                  <AssessmentIcon
                                    sx={{ color: theme.palette.secondary.main, fontSize: "1rem" }}
                                  />
                                </motion.div>
                                <Typography
                                  sx={{
                                    ...typography.body2,
                                    color: theme.palette.secondary.main,
                                    fontWeight: 500,
                                    fontStyle: "italic",
                                  }}>
                                  {assignment.facultyName || "Your instructor"} will review and
                                  release this case
                                </Typography>
                              </Box>
                            </motion.div>
                          ) : (
                            assignment.dueDate && (
                              <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.25, delay: index * 0.02 + 0.08 }}>
                                <Box
                                  sx={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                                  <ScheduleIcon
                                    sx={{ color: theme.palette.text.secondary, fontSize: "1rem" }}
                                  />
                                  <Typography
                                    sx={{
                                      ...typography.body2,
                                      color: theme.palette.text.secondary,
                                      fontWeight: 500,
                                    }}>
                                    Due
                                    {" "}
                                    {format(parseISO(assignment.dueDate), "MMM d, yyyy")}
                                  </Typography>
                                </Box>
                              </motion.div>
                            )
                          )}

                          {assignment.score !== null &&
                            assignment.score !== undefined &&
                            assignment.status === "reviewed" && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.02 + 0.15,
                                  ease: "easeOut",
                                }}>
                                <Chip
                                  label={`${assignment.score}%`}
                                  size="medium"
                                  sx={{
                                    ...typography.body2,
                                    height: 32,
                                    fontWeight: 600,
                                    bgcolor:
                                      assignment.score >= 80
                                        ? alpha(theme.palette.secondary.light, 0.15)
                                        : alpha(theme.palette.primary.main, 0.1),
                                    color:
                                      assignment.score >= 80 ? theme.palette.secondary.light : theme.palette.primary.main,
                                    border: `1px solid ${assignment.score >= 80 ? alpha(theme.palette.secondary.light, 0.3) : alpha(theme.palette.primary.main, 0.3)}`,
                                    "& .MuiChip-label": { px: spacing.md },
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                      transform: "scale(1.05)",
                                      boxShadow: `0 4px 12px ${alpha(assignment.score >= 80 ? theme.palette.secondary.light : theme.palette.primary.main, 0.3)}`,
                                    },
                                  }}
                                />
                              </motion.div>
                            )}
                        </Box>
                      </Box>

                      {/* Content Row - Case Info and Learning Objectives */}
                      <Box sx={{ display: "flex", gap: spacing.xl, mb: spacing.lg }}>
                        {/* Left Section - Case Information */}
                        <motion.div
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.02 + 0.1 }}
                          style={{ flex: 0.75 }}>
                          <Box
                            sx={{
                              p: spacing.lg,
                              borderRadius: 2.5,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              position: "relative",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: `0 8px 25px ${alpha(theme.palette.text.disabled, 0.15)}`,
                                borderColor: alpha(theme.palette.divider, 0.8),
                              },
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: 4,
                                height: "100%",
                                background: `linear-gradient(180deg, ${theme.palette.text.disabled} 0%, ${theme.palette.divider} 100%)`,
                                borderRadius: "0 2px 2px 0",
                                transition: "all 0.3s ease",
                              },
                              "&:hover::before": {
                                width: 6,
                                background: `linear-gradient(180deg, ${theme.palette.secondary.main} 0%, ${theme.palette.text.disabled} 100%)`,
                              },
                            }}>
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.2, delay: index * 0.02 + 0.14 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: spacing.sm,
                                  mb: spacing.md,
                                }}>
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                  <CaseIcon
                                    sx={{
                                      fontSize: "1.1rem",
                                      color: theme.palette.text.secondary,
                                      transition: "color 0.3s ease",
                                    }}
                                  />
                                </motion.div>
                                <Typography
                                  sx={{
                                    ...typography.body1,
                                    color: theme.palette.text.secondary,
                                    fontWeight: 600,
                                  }}>
                                  Case Information
                                </Typography>
                              </Box>
                            </motion.div>

                            {/* Case Description */}
                            {assignment.description && (
                              <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.2, delay: index * 0.02 + 0.14 }}>
                                <Box sx={{ mb: spacing.md }}>
                                  <Typography
                                    sx={{
                                      ...typography.caption,
                                      color: theme.palette.text.secondary,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                      fontWeight: 600,
                                      mb: spacing.xs,
                                    }}>
                                    Description
                                  </Typography>
                                  <Typography
                                    sx={{
                                      ...typography.body2,
                                      color: theme.palette.text.secondary,
                                      lineHeight: 1.5,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}>
                                    {assignment.description}
                                  </Typography>
                                </Box>
                              </motion.div>
                            )}

                            {/* Faculty */}
                            {assignment.facultyName && (
                              <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.2, delay: index * 0.02 + 0.16 }}>
                                <Box>
                                  <Typography
                                    sx={{
                                      ...typography.caption,
                                      color: theme.palette.text.secondary,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                      fontWeight: 600,
                                      mb: spacing.xs,
                                    }}>
                                    Assigned by
                                  </Typography>
                                  <Box
                                    sx={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                                    <motion.div
                                      whileHover={{ scale: 1.1 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                      <Avatar
                                        sx={{
                                          width: 28,
                                          height: 28,
                                          bgcolor: theme.palette.secondary.main,
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        }}>
                                        {assignment.facultyName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </Avatar>
                                    </motion.div>
                                    <Typography
                                      sx={{
                                        ...typography.body2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                      }}>
                                      {assignment.facultyName}
                                    </Typography>
                                  </Box>
                                </Box>
                              </motion.div>
                            )}
                          </Box>
                        </motion.div>

                        {/* Right Section - Learning Objectives */}
                        {assignment.learning_objectives &&
                          assignment.learning_objectives.length > 0 && (
                            <motion.div
                              initial={{ x: 30, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.02 + 0.12 }}
                              style={{ flex: 1 }}>
                              <Box
                                sx={{
                                  p: spacing.lg,
                                  borderRadius: 2.5,
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
                                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                                  position: "relative",
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.15)}`,
                                    borderColor: alpha(theme.palette.secondary.main, 0.25),
                                  },
                                  "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: 4,
                                    height: "100%",
                                    background: `linear-gradient(180deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                                    borderRadius: "0 2px 2px 0",
                                    transition: "all 0.3s ease",
                                  },
                                  "&:hover::before": {
                                    width: 6,
                                    boxShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.3)}`,
                                  },
                                }}>
                                <motion.div
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ duration: 0.2, delay: index * 0.02 + 0.14 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: spacing.sm,
                                      mb: spacing.md,
                                    }}>
                                    <motion.div
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                                      <SchoolIcon
                                        sx={{
                                          fontSize: "1.1rem",
                                          color: theme.palette.secondary.main,
                                        }}
                                      />
                                    </motion.div>
                                    <Typography
                                      sx={{
                                        ...typography.body1,
                                        color: theme.palette.secondary.main,
                                        fontWeight: 600,
                                      }}>
                                      Learning Objectives
                                    </Typography>
                                  </Box>
                                </motion.div>

                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      assignment.learning_objectives.length <= 2
                                        ? "1fr"
                                        : "1fr 1fr",
                                    gap: spacing.sm,
                                    alignItems: "start",
                                  }}>
                                  {assignment.learning_objectives
                                    .slice(0, 4)
                                    .map((objective: string, objIndex: number) => (
                                      <motion.div
                                        key={objIndex}
                                        initial={{ x: 10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{
                                          duration: 0.2,
                                          delay: index * 0.02 + 0.16 + objIndex * 0.05,
                                        }}
                                        whileHover={{ scale: 1.02 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: spacing.sm,
                                            py: spacing.xs,
                                            px: spacing.xs,
                                            borderRadius: 1.5,
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                              bgcolor: alpha(theme.palette.secondary.light, 0.05),
                                              transform: "translateX(2px)",
                                            },
                                          }}>
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 400,
                                              delay: index * 0.02 + 0.18 + objIndex * 0.03,
                                            }}>
                                            <CheckCircleIcon
                                              sx={{
                                                color: theme.palette.secondary.light,
                                                fontSize: "0.8rem",
                                                mt: 0.25,
                                                flexShrink: 0,
                                              }}
                                            />
                                          </motion.div>
                                          <Typography
                                            sx={{
                                              ...typography.caption,
                                              color: theme.palette.text.secondary,
                                              lineHeight: 1.4,
                                              fontSize: "0.75rem",
                                            }}>
                                            {objective}
                                          </Typography>
                                        </Box>
                                      </motion.div>
                                    ))}
                                </Box>

                                {assignment.learning_objectives.length > 4 && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 + 0.8 }}>
                                    <Typography
                                      sx={{
                                        ...typography.caption,
                                        color: alpha(theme.palette.text.secondary, 0.8),
                                        fontStyle: "italic",
                                        mt: spacing.sm,
                                        textAlign: "center",
                                      }}>
                                      +{assignment.learning_objectives.length - 4} more objectives
                                    </Typography>
                                  </motion.div>
                                )}
                              </Box>
                            </motion.div>
                          )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* Bottom Pagination Controls */}
            {totalAssignments > rowsPerPage && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: spacing.xl,
                  pt: spacing.lg,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    bgcolor: theme.palette.background.paper,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      borderColor: theme.palette.secondary.main,
                    },
                  }}>
                  <TablePagination
                    component="div"
                    count={totalAssignments}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Per page"
                    sx={{
                      "& .MuiTablePagination-toolbar": {
                        minHeight: 48,
                        padding: "0 16px",
                      },
                      "& .MuiTablePagination-selectLabel": {
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        margin: 0,
                      },
                      "& .MuiTablePagination-displayedRows": {
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        margin: 0,
                      },
                      "& .MuiTablePagination-select": {
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                      },
                      "& .MuiTablePagination-actions": {
                        marginLeft: 1,
                        "& button": {
                          padding: 1,
                          color: theme.palette.text.primary,
                          "&:disabled": {
                            color: alpha(theme.palette.text.primary, 0.3),
                          },
                        },
                      },
                    }}
                  />
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
