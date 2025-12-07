import React, { useState, useMemo } from "react"
import { Box, Typography, Chip, Button, Tooltip, IconButton, alpha } from "@mui/material"
import {
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Launch as LaunchIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { format, parseISO, isBefore } from "date-fns"
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_SortingState,
} from "material-react-table"
import { StudentCaseAssignment } from "@/types/student-types"

// Define UA Brand Colors

interface StudentAssignmentsDataGridProps {
  assignments: StudentCaseAssignment[]
  onLaunchVirtualPatient: (assignmentId: number) => void
  onViewReport: (reportId: number) => void
  onCaseClick: (caseId: number) => void
  isLaunching: boolean
}

export const StudentAssignmentsDataGrid: React.FC<StudentAssignmentsDataGridProps> = ({
  assignments,
  onLaunchVirtualPatient,
  onViewReport,
  onCaseClick,
  isLaunching,
}) => {
  const theme = useTheme()
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "not_started":
        return { label: "Not Started", color: theme.palette.divider, icon: ScheduleIcon }
      case "in_progress":
        return { label: "In Progress", color: theme.palette.secondary.light, icon: PlayArrowIcon }
      case "pending_review":
        return { label: "Under Review", color: theme.palette.secondary.main, icon: AssessmentIcon }
      case "reviewed":
        return { label: "Completed", color: theme.palette.secondary.light, icon: CheckCircleIcon }
      default:
        return { label: "Unknown", color: theme.palette.divider, icon: ScheduleIcon }
    }
  }

  // Define columns for Material React Table
  const columns = useMemo<MRT_ColumnDef<StudentCaseAssignment>[]>(
    () => [
      {
        accessorKey: "caseTitle",
        header: "Case",
        size: 250,
        Cell: ({ row }) => (
          <Box sx={{ cursor: "pointer" }} onClick={() => onCaseClick(row.original.caseId)}>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{ color: theme.palette.secondary.main, "&:hover": { textDecoration: "underline" } }}>
              {row.original.caseTitle}
            </Typography>
            {row.original.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}>
                {row.original.description.length > 60
                  ? `${row.original.description.substring(0, 60)}...`
                  : row.original.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ row }) => {
          const statusInfo = getStatusInfo(row.original.status)
          const StatusIcon = statusInfo.icon
          return (
            <Chip
              icon={<StatusIcon />}
              label={statusInfo.label}
              size="small"
              sx={{
                bgcolor: alpha(statusInfo.color, 0.1),
                color: statusInfo.color,
                "& .MuiChip-icon": { color: statusInfo.color },
              }}
            />
          )
        },
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 100,
        Cell: ({ row }) => {
          if (!row.original.dueDate) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            )
          }

          const dueDate = parseISO(row.original.dueDate)
          const isOverdue = isBefore(dueDate, new Date())

          return (
            <Chip
              label={format(dueDate, "MMM d")}
              size="small"
              color={isOverdue ? "error" : "default"}
              variant="outlined"
            />
          )
        },
      },
      {
        accessorKey: "score",
        header: "Score",
        size: 80,
        Cell: ({ row }) => {
          if (
            row.original.score !== null
            && row.original.score !== undefined
            && row.original.status === "reviewed"
          ) {
            return (
              <Chip
                label={`${row.original.score}%`}
                size="small"
                color="success"
                variant="outlined"
              />
            )
          }
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )
        },
      },
      {
        accessorKey: "actions",
        header: "Actions",
        size: 150,
        enableSorting: false,
        Cell: ({ row }) => {
          const assignment = row.original
          const canLaunch =            assignment.status === "not_started" || assignment.status === "in_progress"
          const isOverdue = assignment.dueDate && isBefore(parseISO(assignment.dueDate), new Date())
          const isPastDue = isOverdue && canLaunch // Only show "Past Due Date" for launchable assignments that are overdue

          return (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View Case Details">
                <IconButton
                  size="small"
                  onClick={() => onCaseClick(assignment.caseId)}
                  sx={{ color: theme.palette.secondary.main }}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {assignment.status === "reviewed" && assignment.reportId ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AssessmentIcon fontSize="small" />}
                  onClick={() => onViewReport(assignment.reportId!)}
                  sx={{
                    color: theme.palette.secondary.main,
                    borderColor: theme.palette.secondary.main,
                    fontSize: "0.7rem",
                    py: 0.5,
                    px: 1,
                    minWidth: "auto",
                  }}>
                  Report
                </Button>
              ) : assignment.status === "pending_review" ? (
                <Typography variant="caption" color="text.secondary">
                  Under Review
                </Typography>
              ) : assignment.reportId ? (
                <Typography variant="caption" color="text.secondary">
                  Processing...
                </Typography>
              ) : isPastDue ? (
                <Chip
                  label="Past Due"
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}
                />
              ) : canLaunch ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<LaunchIcon fontSize="small" />}
                  onClick={() => onLaunchVirtualPatient(assignment.assignmentId)}
                  disabled={isLaunching}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    fontSize: "0.7rem",
                    py: 0.5,
                    px: 1,
                    minWidth: "auto",
                  }}>
                  {assignment.status === "not_started" ? "Start" : "Continue"}
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Pending...
                </Typography>
              )}
            </Box>
          )
        },
      },
    ],
    [onLaunchVirtualPatient, onViewReport, onCaseClick, isLaunching],
  )

  return (
    <MaterialReactTable
      columns={columns}
      data={assignments}
      state={{
        columnFilters,
        sorting,
      }}
      onColumnFiltersChange={setColumnFilters}
      onSortingChange={setSorting}
      enableRowSelection={false}
      enableColumnActions={false}
      enableTopToolbar
      enableBottomToolbar={false}
      enablePagination={false}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableFilters={false}
      enableGlobalFilter={false}
      initialState={{
        density: "comfortable",
        sorting: [{ id: "dueDate", desc: false }],
      }}
      muiTableContainerProps={{
        sx: {
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.05)",
        },
      }}
      muiTableProps={{
        sx: {
          "& .MuiTableHead-root": {
            "& .MuiTableCell-head": {
              backgroundColor: alpha(theme.palette.secondary.main, 0.03),
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: "0.8rem",
              py: 1.5,
              borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            },
          },
          "& .MuiTableBody-root": {
            "& .MuiTableRow-root": {
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                transform: "scale(1.002)",
                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
              },
            },
            "& .MuiTableCell-root": {
              py: 1.5,
              borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.05)}`,
            },
          },
        },
      }}
      muiTopToolbarProps={{
        sx: {
          backgroundColor: alpha(theme.palette.secondary.main, 0.02),
          borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
          borderRadius: "8px 8px 0 0",
          py: 1,
        },
      }}
      renderTopToolbarCustomActions={() => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1 }}>
          <AssignmentIcon sx={{ color: theme.palette.secondary.main, fontSize: "1.2rem" }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            {assignments.length}
{' '}
Assignment
{assignments.length !== 1 ? "s" : ""}
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            {assignments.filter((a) => a.status === "not_started").length > 0 && (
              <Chip
                label={`${assignments.filter((a) => a.status === "not_started").length} Pending`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontSize: "0.7rem",
                }}
              />
            )}
            {assignments.filter((a) => a.status === "reviewed").length > 0 && (
              <Chip
                label={`${assignments.filter((a) => a.status === "reviewed").length} Completed`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.light, 0.1),
                  color: theme.palette.secondary.light,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Box>
        </Box>
      )}
    />
  )
}
