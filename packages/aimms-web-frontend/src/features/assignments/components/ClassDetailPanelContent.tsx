import React, { useMemo, useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip as MuiTooltip,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemButton,
  alpha,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { format, parseISO } from "date-fns"
import {
  ArrowBack as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"
import { FacultyClass, ClassAssignmentStatus } from "../../types/faculty-types"
import AssignmentsDataGrid from "./AssignmentsDataGrid"
import { getClassAssignments } from "../../services/facultyService"
import { AssignmentStatus, getStatusLabel } from "../../../constants/assignmentStatus"

interface ClassDetailPanelContentProps {
  classData: FacultyClass
  assignments: ClassAssignmentStatus[]
  onStartAssignmentFlow: () => void
  onNavigateToReportReview: (reportId: number) => void
  focusedReportId?: number | null
  displayMode: "reportList" | "assignmentTable"
  onProcessRowUpdate: (
    newRow: ClassAssignmentStatus,
    oldRow: ClassAssignmentStatus
  ) => Promise<ClassAssignmentStatus>
  onBackToClassList: () => void
  isCompactView?: boolean
  isLoadingAssignments?: boolean
  isLoadingStudents?: boolean
  onDeleteAssignment: (assignmentId: number) => void
  onBulkUpdateDueDate?: (assignmentIds: number[], newDueDate: Date) => Promise<void>
}

export const ClassDetailPanelContent: React.FC<ClassDetailPanelContentProps> = ({
  classData,
  assignments,
  onStartAssignmentFlow,
  onNavigateToReportReview,
  focusedReportId,
  displayMode,
  onProcessRowUpdate,
  onBackToClassList,
  isCompactView = false,
  isLoadingAssignments = false,
  isLoadingStudents = false,
  onDeleteAssignment,
  onBulkUpdateDueDate,
}) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localAssignments, setLocalAssignments] = useState<ClassAssignmentStatus[]>(assignments)

  // Update local assignments when props change
  useEffect(() => {
    setLocalAssignments(assignments)
  }, [assignments])

  const focusedAssignment = useMemo(() => {
    if (!focusedReportId) return null
    return localAssignments.find((a) => a.reportId === focusedReportId) || null
  }, [focusedReportId, localAssignments])

  // Helper function to get chip properties based on status
  const getStatusChipProps = (
    status: AssignmentStatus
  ): {
    label: string
    color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
  } => {
    switch (status) {
      case "not_started":
        return { label: getStatusLabel("not_started"), color: "error" }
      case "in_progress":
        return { label: getStatusLabel("in_progress"), color: "warning" }
      case "pending_review":
        return { label: getStatusLabel("pending_review"), color: "info" }
      case "reviewed":
        return { label: getStatusLabel("reviewed"), color: "success" }
      case "late":
        return { label: getStatusLabel("late"), color: "error" }
      default:
        return { label: getStatusLabel(status), color: "default" }
    }
  }

  // For the report list view
  const otherReviewableAssignments = useMemo(() => {
    if (!localAssignments) return []

    const reviewable = localAssignments.filter(
      (a) => (a.status === "pending_review" || a.status === "reviewed") && a.reportId
    )

    const listToShow = focusedAssignment
      ? reviewable.filter((a) => a.assignmentId !== focusedAssignment.assignmentId)
      : reviewable

    return listToShow.sort((a, b) => {
      if (a.status === "pending_review" && b.status !== "pending_review") return -1
      if (a.status !== "pending_review" && b.status === "pending_review") return 1
      return a.studentName.localeCompare(b.studentName)
    })
  }, [focusedAssignment, localAssignments])

  // Generate case summaries for compact view
  const caseSummaries = useMemo(() => {
    // Create a map of cases and their assignment counts
    const caseMap = new Map<
      string,
      {
        count: number
        completed: number
        total: number
        dueDate: string
        caseTitle: string
        pendingReview: number
      }
    >()

    localAssignments.forEach((assignment) => {
      const existing = caseMap.get(assignment.caseTitle) || {
        count: 0,
        completed: 0,
        pendingReview: 0,
        total: 0,
        dueDate: assignment.dueDate,
        caseTitle: assignment.caseTitle,
      }

      existing.count += 1
      existing.total += 1

      if (assignment.status === "reviewed") {
        existing.completed += 1
      } else if (assignment.status === "pending_review") {
        existing.pendingReview += 1
      }

      // Keep earliest due date
      if (new Date(assignment.dueDate) < new Date(existing.dueDate)) {
        existing.dueDate = assignment.dueDate
      }

      caseMap.set(assignment.caseTitle, existing)
    })

    // Convert map to array and sort by due date
    return Array.from(caseMap.values()).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
  }, [localAssignments])

  // If we're in compact view and assignmentTable mode, show a compact tile view
  if (isCompactView && displayMode === "assignmentTable") {
    if (loading) {
      return (
        <Box
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <CircularProgress />
        </Box>
      )
    }

    if (error) {
      return (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Compact View Header */}
        <Box sx={{ py: 1, px: 1.5, mb: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
          <Typography
            variant="overline"
            sx={{ color: theme.palette.primary.light, display: "block", lineHeight: 1.2 }}>
            Class Overview
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <MuiTooltip title="Back to Classes">
              <IconButton onClick={onBackToClassList} size="small" sx={{ p: 0 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </MuiTooltip>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "medium",
                color: theme.palette.text.primary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexGrow: 1,
              }}
              title={classData.name}>
              {classData.name}
            </Typography>
          </Box>
        </Box>

        {/* Compact Tiles View */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", px: 0.5 }}>
          <Typography variant="caption" sx={{ display: "block", mb: 1, fontWeight: "medium" }}>
            Active Case Assignments ({caseSummaries.length})
          </Typography>

          <Grid container spacing={1}>
            {caseSummaries.map((caseSummary, index) => (
              <Grid item xs={12} key={index}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.light, 0.15)}`,
                    },
                  }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 0.5,
                    }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                      {caseSummary.caseTitle}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${caseSummary.completed + caseSummary.pendingReview}/${
                        caseSummary.total
                      }`}
                      color={
                        caseSummary.completed + caseSummary.pendingReview === caseSummary.total
                          ? "success"
                          : "primary"
                      }
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.65rem" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 1,
                    }}>
                    <Typography variant="caption" color="text.secondary">
                      Due:
                      {" "}
                      {format(parseISO(caseSummary.dueDate), "PP")}
                    </Typography>
                    <Typography variant="caption">
                      {caseSummary.count} student
                      {caseSummary.count !== 1 ? "s" : ""}
                    </Typography>
                  </Box>

                  {caseSummary.pendingReview > 0 && (
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                      <Chip
                        size="small"
                        label={`${caseSummary.pendingReview} Pending Review`}
                        color="info"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    )
  }

  // For the report list view
  if (displayMode === "reportList") {
    return (
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {focusedAssignment && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 1.5,
              flexShrink: 0,
              borderColor: theme.palette.primary.light,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              transition: "background-color 0.2s ease-in-out, transform 0.2s ease-in-out",
              cursor: "default",
              "&:hover": {
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
              },
            }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: "0.7rem",
                  bgcolor: alpha(theme.palette.primary.light, 0.1),
                  color: theme.palette.primary.light,
                }}>
                {focusedAssignment.studentName.substring(0, 1).toUpperCase()}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: "medium" }}
                noWrap
                title={focusedAssignment.studentName}>
                {focusedAssignment.studentName}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.primary" gutterBottom>
              {focusedAssignment.caseTitle}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                mb: 0.5,
              }}>
              <Typography variant="caption">
                Due:
                {" "}
                {format(parseISO(focusedAssignment.dueDate), "P")}
              </Typography>
              <Chip
                label={getStatusChipProps(focusedAssignment.status).label}
                color={getStatusChipProps(focusedAssignment.status).color}
                size="small"
                variant="filled"
              />
            </Box>
          </Paper>
        )}

        <Typography
          variant="subtitle2"
          sx={{
            mt: focusedAssignment ? 0 : undefined,
            mb: 1,
            fontWeight: "medium",
            fontSize: "0.85rem",
            px: 0.5,
            flexShrink: 0,
          }}>
          {focusedAssignment
            ? "Other Reports in this Class:"
            : `Select a Report for ${classData.name}`}
        </Typography>
        <Box
          sx={{
            flexGrow: 1,
          }}>
          <List dense sx={{ p: 0 }}>
            {otherReviewableAssignments.length > 0 ? (
              otherReviewableAssignments.map((assignment) => {
                const chipProps = getStatusChipProps(assignment.status)
                return (
                  <ListItemButton
                    key={assignment.assignmentId}
                    onClick={() => {
                      if (assignment.reportId) {
                        onNavigateToReportReview(assignment.reportId)
                      }
                    }}
                    disabled={!assignment.reportId}
                    selected={focusedAssignment?.reportId === assignment.reportId}
                    sx={{
                      mb: 1,
                      borderRadius: 1.5,
                      borderColor: theme.palette.divider,
                      bgcolor:
                        focusedAssignment?.reportId === assignment.reportId
                          ? alpha(theme.palette.primary.light, 0.05)
                          : "transparent",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      transition:
                        "border-color 0.2s ease-in-out, background-color 0.2s ease-in-out",
                      "&:hover": {
                        borderColor:
                          focusedAssignment?.reportId === assignment.reportId
                            ? theme.palette.secondary.main
                            : theme.palette.grey[500],
                        bgcolor:
                          focusedAssignment?.reportId === assignment.reportId
                            ? alpha(theme.palette.primary.light, 0.08)
                            : alpha(theme.palette.action.hover, 0.04),
                      },
                    }}>
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "medium",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "calc(100% - 70px)",
                        }}
                        title={assignment.studentName}>
                        {assignment.studentName}
                      </Typography>
                      <Chip
                        label={chipProps.label}
                        color={chipProps.color}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.65rem", ml: 1 }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.75rem",
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "text.secondary",
                      }}
                      title={assignment.caseTitle}>
                      {assignment.caseTitle}
                    </Typography>
                  </ListItemButton>
                )
              })
            ) : (
              <ListItem sx={{ justifyContent: "center", py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  No other reports available.
                </Typography>
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    )
  }

  // For the main assignment table view
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Enhanced Header with Class Status Overview */}
      <Box sx={{ py: 1, px: 1.5, mb: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: theme.palette.primary.light, display: "block", lineHeight: 1.2 }}>
              Class Overview
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
              {classData.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {classData.code} •{classData.studentCount}{" "}
              {classData.studentCount === 1 ? "Student" : "Students"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={onStartAssignmentFlow}
            sx={{
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
              fontSize: "0.8rem",
              py: 0.75,
            }}>
            Assign New Case
          </Button>
        </Box>

        {/* Quick Stats Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 1.5,
            mb: 1.5,
            p: 1.5,
            bgcolor: alpha(theme.palette.divider, 0.3),
            borderRadius: 1.5,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
          }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Assignments
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.secondary.main, fontWeight: "bold", lineHeight: 1.2 }}>
              {localAssignments.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Pending Review
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.primary.main, fontWeight: "bold", lineHeight: 1.2 }}>
              {localAssignments.filter((a) => a.status === "pending_review").length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Completed
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.secondary.light, fontWeight: "bold", lineHeight: 1.2 }}>
              {localAssignments.filter((a) => a.status === "reviewed").length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              In Progress
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.secondary.main, fontWeight: "bold", lineHeight: 1.2 }}>
              {localAssignments.filter((a) => a.status === "in_progress").length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5 }}>
        {isLoadingAssignments || isLoadingStudents ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {isLoadingAssignments ? "Loading assignments..." : "Loading students..."}
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : localAssignments.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "300px",
              textAlign: "center",
            }}>
            <AssignmentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No assignments yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 300 }}>
              Get started by assigning a case to your students. Click the "Assign New Case" button
              above.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={onStartAssignmentFlow}
              sx={{
                bgcolor: theme.palette.primary.main,
                "&:hover": { bgcolor: theme.palette.primary.dark },
              }}>
              Assign First Case
            </Button>
          </Box>
        ) : (
          <AssignmentsDataGrid
            assignments={localAssignments}
            onNavigateToReportReview={onNavigateToReportReview}
            onProcessRowUpdate={onProcessRowUpdate}
            onDeleteAssignment={onDeleteAssignment}
            onBulkUpdateDueDate={onBulkUpdateDueDate}
            isCompactView={isCompactView}
          />
        )}
      </Box>
    </Box>
  )
}

export default ClassDetailPanelContent
