import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Chip,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  GlobalStyles,
} from "@mui/material"
import {
  Person as PersonIcon,
  LocalHospital as CaseIcon,
  Edit as EditIcon,
  Layers as GroupingIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  CheckBox as CheckBoxIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { format, parseISO } from "date-fns"
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_SortingState,
  MRT_GroupingState,
  MRT_RowSelectionState,
} from "material-react-table"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs, { Dayjs } from "dayjs"
import { AssignmentStatus, getStatusLabel } from "../../../constants/assignmentStatus"
import { ClassAssignmentStatus } from "../../../types/faculty-types"

interface AssignmentsDataGridProps {
  assignments: ClassAssignmentStatus[]
  onNavigateToReportReview: (reportId: number) => void
  onProcessRowUpdate: (
    newRow: ClassAssignmentStatus,
    oldRow: ClassAssignmentStatus
  ) => Promise<ClassAssignmentStatus>
  isCompactView?: boolean
  onDeleteAssignment: (assignmentId: number) => void
  onBulkUpdateDueDate?: (assignmentIds: number[], newDueDate: Date) => Promise<void>
  classCode?: string
  classTerm?: string
  instructorName?: string
}

const AssignmentsDataGrid: React.FC<AssignmentsDataGridProps> = ({
  assignments,
  onNavigateToReportReview,
  onProcessRowUpdate,
  isCompactView = false,
  onDeleteAssignment,
  onBulkUpdateDueDate,
  classCode,
  classTerm,
  instructorName,
}) => {
  const theme = useTheme()
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [grouping, setGrouping] = useState<MRT_GroupingState>(
    isCompactView ? ["caseTitle"] : ["studentName"]
  )
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({})
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false)
  const [newDueDate, setNewDueDate] = useState<Dayjs>(dayjs())

  // Clear selection when assignments change
  useEffect(() => {
    setRowSelection({})
  }, [assignments])

  // Get selected assignments
  const selectedAssignments = useMemo(
    () =>
      Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => assignments[parseInt(index)])
      .filter(Boolean),
    [rowSelection, assignments]
  )

  const hasSelectedRows = selectedAssignments.length > 0

  // Helper function to get chip properties based on status with icons
  const getStatusChipProps = (status: AssignmentStatus) => {
    switch (status) {
      case "not_started":
        return {
          label: getStatusLabel("not_started"),
          color: theme.palette.primary.main,
          icon: ScheduleIcon,
        }
      case "in_progress":
        return {
          label: getStatusLabel("in_progress"),
          color: theme.palette.secondary.light,
          icon: EditIcon,
        }
      case "pending_review":
        return {
          label: getStatusLabel("pending_review"),
          color: theme.palette.secondary.main,
          icon: EventIcon,
        }
      case "reviewed":
        return {
          label: getStatusLabel("reviewed"),
          color: theme.palette.secondary.light,
          icon: CheckBoxIcon,
        }
      case "late":
        return {
          label: getStatusLabel("late"),
          color: theme.palette.primary.main,
          icon: ScheduleIcon,
        }
      default:
        return {
          label: getStatusLabel(status),
          color: theme.palette.divider,
          icon: ScheduleIcon,
        }
    }
  }

  const handleSelectAll = () => {
    const allRowSelection: MRT_RowSelectionState = {}
    assignments.forEach((_, index) => {
      allRowSelection[index.toString()] = true
    })
    setRowSelection(allRowSelection)
  }

  const handleDeselectAll = () => {
    setRowSelection({})
  }

  const handleBulkDelete = () => {
    if (selectedAssignments.length > 0) {
      setBulkDeleteDialogOpen(true)
    }
  }

  const handleConfirmBulkDelete = () => {
    selectedAssignments.forEach((assignment) => {
      onDeleteAssignment(assignment.assignmentId)
    })
    setBulkDeleteDialogOpen(false)
    setRowSelection({})
  }

  const handleBulkDueDateChange = () => {
    if (selectedAssignments.length > 0) {
      // Set initial date to the most common due date or current date
      const validDueDates = selectedAssignments
        .map((a) => a.dueDate)
        .filter((date) => date && date !== "")
        .map((date) => dayjs(date))
        .filter((date) => date.isValid())

      const mostCommonDate = validDueDates.length > 0 ? validDueDates[0] : dayjs()
      setNewDueDate(mostCommonDate)
      setDueDateDialogOpen(true)
    }
  }

  const handleConfirmDueDateChange = async () => {
    if (onBulkUpdateDueDate && selectedAssignments.length > 0) {
      try {
        const assignmentIds = selectedAssignments.map((a) => a.assignmentId)
        await onBulkUpdateDueDate(assignmentIds, newDueDate.toDate())
        setDueDateDialogOpen(false)
        setRowSelection({})
      } catch (error) {
        console.error("Failed to update due dates:", error)
      }
    }
  }

  // Define columns for Material React Table
  const columns = useMemo<MRT_ColumnDef<ClassAssignmentStatus>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Student",
        size: 200,
        enableGrouping: true,

        Cell: ({ row, renderedCellValue }) => (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {renderedCellValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.studentEmail}
            </Typography>
          </Box>
        ),
        GroupedCell: ({ cell, table }) => {
          const studentName = cell.getValue<string>()
          const casesForThisStudent = assignments.filter((a) => a.studentName === studentName)
          const caseCount = casesForThisStudent.length
          return (
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {studentName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cell.row.original.studentEmail}
              </Typography>
            </Box>
          )
        },
        AggregatedCell: ({ cell, table }) => {
          const currentGrouping = table.getState().grouping[0]

          if (currentGrouping === "status") {
            // When grouped by status, show unique student count for this status
            const status = table.getRow(cell.row.id).getValue("status")
            const statusAssignments = assignments.filter((a) => a.status === status)
            const uniqueStudents = new Set(statusAssignments.map((a) => a.studentName))
            const studentCount = uniqueStudents.size

            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {studentCount}
{' '}
Student
{studentCount !== 1 ? "s" : ""}
              </Typography>
            )
          }
          if (currentGrouping === "caseTitle") {
            // When grouped by case, show unique student count for this case
            const caseTitle = table.getRow(cell.row.id).getValue("caseTitle")
            const caseAssignments = assignments.filter((a) => a.caseTitle === caseTitle)
            const uniqueStudents = new Set(caseAssignments.map((a) => a.studentName))
            const studentCount = uniqueStudents.size

            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {studentCount}
{' '}
Student
{studentCount !== 1 ? "s" : ""}
              </Typography>
            )
          }
          return null
        },
      },
      {
        accessorKey: "caseTitle",
        header: "Case Assignment",
        size: 220,
        enableGrouping: true,
        GroupedCell: ({ cell, table }) => {
          const caseTitle = cell.getValue<string>()
          // Find all assignments for this case to show count
          const assignmentsForThisCase = assignments.filter((a) => a.caseTitle === caseTitle)
          const assignmentCount = assignmentsForThisCase.length

          return (
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {caseTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assignmentCount} assignments
              </Typography>
            </Box>
          )
        },
        AggregatedCell: ({ cell, table }) => {
          const currentGrouping = table.getState().grouping[0]

          if (currentGrouping === "studentName") {
            // When grouped by student, show case count for this student
            const studentName = table.getRow(cell.row.id).getValue("studentName")
            const studentAssignments = assignments.filter(
              (a) => a.studentName === studentName && a.caseTitle !== "No assignments yet",
            )
            const caseCount = studentAssignments.length

            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {caseCount}
{' '}
Case
{caseCount !== 1 ? "s" : ""}
              </Typography>
            )
          }
          if (currentGrouping === "status") {
            // When grouped by status, show unique case count for this status
            const status = table.getRow(cell.row.id).getValue("status")
            const statusAssignments = assignments.filter(
              (a) => a.status === status && a.caseTitle !== "No assignments yet",
            )
            const uniqueCases = new Set(statusAssignments.map((a) => a.caseTitle))
            const caseCount = uniqueCases.size

            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {caseCount}
{' '}
Case
{caseCount !== 1 ? "s" : ""}
              </Typography>
            )
          }
          return null
        },
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 160,
        enableGrouping: false,
        Cell: ({ cell }) => {
          const dueDateValue = cell.getValue<string>()
          if (!dueDateValue) {
            return (
              <Typography variant="body2" color="text.secondary">
                No due date
              </Typography>
            )
          }
          try {
            return <Box>{format(parseISO(dueDateValue), "Pp")}</Box>
          } catch (error) {
            return (
              <Typography variant="body2" color="error">
                Invalid date
              </Typography>
            )
          }
        },
        AggregatedCell: ({ cell, table }) => {
          const currentGrouping = table.getState().grouping[0]

          if (currentGrouping === "studentName") {
            // When grouped by student, show upcoming due date info
            const studentName = table.getRow(cell.row.id).getValue("studentName")
            const studentAssignments = assignments.filter((a) => a.studentName === studentName)

            // Find the earliest upcoming due date
            const upcomingDates = studentAssignments
              .map((a) => a.dueDate)
              .filter((date) => date && date !== "")
              .map((date) => parseISO(date))
              .filter((date) => !isNaN(date.getTime()))
              .sort((a, b) => a.getTime() - b.getTime())

            if (upcomingDates.length > 0) {
              const nextDue = upcomingDates[0]
              return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Next: {' '} {format(nextDue, "MMM d")}
                </Typography>
              )
            }
            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No due dates
              </Typography>
            )
          }
          if (currentGrouping === "status") {
            // When grouped by status, show earliest due date for this status
            const status = table.getRow(cell.row.id).getValue("status")
            const statusAssignments = assignments.filter((a) => a.status === status)

            const upcomingDates = statusAssignments
              .map((a) => a.dueDate)
              .filter((date) => date && date !== "")
              .map((date) => parseISO(date))
              .filter((date) => !isNaN(date.getTime()))
              .sort((a, b) => a.getTime() - b.getTime())

            if (upcomingDates.length > 0) {
              const nextDue = upcomingDates[0]
              return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Next: {' '}{format(nextDue, "MMM d")}
                </Typography>
              )
            }
            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No due dates
              </Typography>
            )
          }
          if (currentGrouping === "caseTitle") {
            // When grouped by case, show due date for this case
            const caseTitle = table.getRow(cell.row.id).getValue("caseTitle")
            const caseAssignments = assignments.filter((a) => a.caseTitle === caseTitle)

            const dueDates = caseAssignments
              .map((a) => a.dueDate)
              .filter((date) => date && date !== "")
              .map((date) => parseISO(date))
              .filter((date) => !isNaN(date.getTime()))

            if (dueDates.length > 0) {
              // Show the most common due date or first one
              const firstDue = dueDates.sort((a, b) => a.getTime() - b.getTime())[0]
              return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Due: {' '}{format(firstDue, "MMM d")}
                </Typography>
              )
            }
            return (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No due date
              </Typography>
            )
          }
          return null
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        enableGrouping: false,
        filterFn: "equals",
        Cell: ({ cell }) => {
          const status = cell.getValue<ClassAssignmentStatus["status"]>()
          const statusChipProps = getStatusChipProps(status as AssignmentStatus)
          const StatusIcon = statusChipProps.icon
          return (
            <Chip
              icon={<StatusIcon />}
              label={statusChipProps.label}
              size="small"
              sx={{
                bgcolor: alpha(statusChipProps.color, 0.1),
                color: statusChipProps.color,
                border: `1px solid ${alpha(statusChipProps.color, 0.3)}`,
                "& .MuiChip-icon": {
                  color: statusChipProps.color,
                  fontSize: "0.9rem",
                },
                fontWeight: 500,
              }}
            />
          )
        },
        GroupedCell: ({ cell, table }) => {
          // Check if we're grouped by student or case
          const currentGrouping = table.getState().grouping[0]
          let relevantAssignments: ClassAssignmentStatus[] = []

          // Get assignments for this group
          if (currentGrouping === "studentName") {
            // If grouped by student, get assignments for this student
            const studentName = table.getRow(cell.row.id).getValue("studentName")
            relevantAssignments = assignments.filter((a) => a.studentName === studentName)
          } else if (currentGrouping === "caseTitle") {
            // If grouped by case, get assignments for this case
            const caseTitle = table.getRow(cell.row.id).getValue("caseTitle")
            relevantAssignments = assignments.filter((a) => a.caseTitle === caseTitle)
          } else if (currentGrouping === "status") {
            // If grouped by status, get assignments for this status
            const status = table.getRow(cell.row.id).getValue("status")
            relevantAssignments = assignments.filter((a) => a.status === status)
          }

          // Count assignments by status
          const totalCount = relevantAssignments.length
          const pendingCount = relevantAssignments.filter(
            (a) => a.status === "pending_review"
          ).length
          const reviewedCount = relevantAssignments.filter((a) => a.status === "reviewed").length

          // If grouped by status, just show the count for that status
          if (currentGrouping === "status") {
            const status = table.getRow(cell.row.id).getValue("status")
            const statusChipProps = getStatusChipProps(status as AssignmentStatus)
            return (
              <Box>
                <Chip
                  label={`${totalCount} ${statusChipProps.label}`}
                  // color={statusChipProps.color}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "medium" }}
                />
              </Box>
            )
          }

          return (
            <Box>
              {pendingCount > 0 ? (
                <Chip
                  label={`${pendingCount} Pending Review`}
                  color="info"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "medium" }}
                />
              ) : reviewedCount === totalCount ? (
                <Chip label="All Reviewed" color="success" size="small" variant="outlined" />
              ) : (
                <Chip
                  label={`${reviewedCount}/${totalCount} Complete`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )
        },
        AggregatedCell: ({ cell, table }) => {
          // Check if we're grouped by student or case
          const currentGrouping = table.getState().grouping[0]
          let relevantAssignments: ClassAssignmentStatus[] = []

          if (currentGrouping === "studentName") {
            // If grouped by student, get assignments for this student
            const studentName = table.getRow(cell.row.id).getValue("studentName")
            relevantAssignments = assignments.filter((a) => a.studentName === studentName)
          } else if (currentGrouping === "caseTitle") {
            // If grouped by case, get assignments for this case
            const caseTitle = table.getRow(cell.row.id).getValue("caseTitle")
            relevantAssignments = assignments.filter((a) => a.caseTitle === caseTitle)
          }

          // Count assignments by status
          const totalCount = relevantAssignments.length
          const pendingCount = relevantAssignments.filter(
            (a) => a.status === "pending_review"
          ).length
          const reviewedCount = relevantAssignments.filter((a) => a.status === "reviewed").length

          return (
            <Box>
              {pendingCount > 0 ? (
                <Chip
                  label={`${pendingCount} Pending Review`}
                  color="info"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "medium" }}
                />
              ) : reviewedCount === totalCount ? (
                <Chip label="All Reviewed" color="success" size="small" variant="outlined" />
              ) : (
                <Chip
                  label={`${reviewedCount}/${totalCount} Complete`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 120,
        enableColumnFilter: false,
        enableSorting: false,
        enableGrouping: false,
        Cell: ({ row }) => {
          const assignment = row.original
          const isReviewable =            assignment.status === "pending_review" || assignment.status === "reviewed"
          assignment.reportId
          const reviewActionText = assignment.status === "reviewed" ? "View" : "Review"

          return (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              {isReviewable && assignment.reportId && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onNavigateToReportReview(assignment.reportId!)}
                  endIcon={<ArrowForwardIosIcon fontSize="inherit" />}
                  sx={{
                    fontWeight: "medium",
                    color: theme.palette.secondary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.primary.light,
                    },
                  }}>
                  {reviewActionText}
                </Button>
              )}
            </Box>
          )
        },
      },
    ],
    [theme, onNavigateToReportReview, onProcessRowUpdate, assignments]
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <GlobalStyles
        styles={{
          // Force override for Material-React-Table selected rows - multiple selectors for maximum coverage
          'table .MuiTableRow-root.Mui-selected': {
            backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
            '&:hover': {
              backgroundColor: `${alpha(theme.palette.secondary.main, 0.12)} !important`,
            },
          },
          '[class*="MuiTableRow-root"].Mui-selected': {
            backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
            '&:hover': {
              backgroundColor: `${alpha(theme.palette.secondary.main, 0.12)} !important`,
            },
          },
          '.Mui-selected[class*="MuiTableRow"]': {
            backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
            '&:hover': {
              backgroundColor: `${alpha(theme.palette.secondary.main, 0.12)} !important`,
            },
          },
          // Target Material-React-Table specific classes
          '[class*="mrt-table-row"].Mui-selected': {
            backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
          },
          // Override cells in selected rows
          '.Mui-selected[class*="MuiTableRow"] [class*="MuiTableCell"]': {
            backgroundColor: 'transparent !important',
          },
          '[class*="MuiTableRow-root"].Mui-selected > [class*="MuiTableCell-root"]': {
            backgroundColor: 'transparent !important',
          },
          // Nuclear option: override all table rows with selected class
          'tr.Mui-selected': {
            backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
            '&:hover': {
              backgroundColor: `${alpha(theme.palette.secondary.main, 0.12)} !important`,
            },
          },
        }}
      />
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <MaterialReactTable
          columns={columns}
          data={assignments}
          layoutMode="semantic"
          mrtTheme={(muiTheme) => ({
            baseBackgroundColor: muiTheme.palette.background.paper,
            selectedRowBackgroundColor: alpha(muiTheme.palette.secondary.main, 0.01),
            pinnedRowBackgroundColor: alpha(muiTheme.palette.secondary.main, 0.08),
          })}
          enableColumnFilters
          enableGrouping
          enableStickyHeader
          enableGlobalFilter={false}
          enableRowSelection
          enableHiding={false}
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableFilters={false}
          enableColumnFilterModes={false}
          positionToolbarAlertBanner="none"
          renderToolbarInternalActions={() => null}
          state={{
            columnFilters,
            sorting,
            grouping,
            rowSelection,
          }}
          onColumnFiltersChange={setColumnFilters}
          onSortingChange={setSorting}
          onGroupingChange={setGrouping}
          onRowSelectionChange={setRowSelection}
          muiTableContainerProps={{
            sx: {
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
            },
          }}
          muiTableProps={{
            sx: {
              "& .MuiTableHead-root": {
                "& .MuiTableCell-head": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                  borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  py: 1.5,
                },
              },
              "& .MuiTableBody-root": {
                "& .MuiTableRow-root": {
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "white !important",
                  "&:hover": {
                    backgroundColor: `${alpha(theme.palette.secondary.main, 0.04)} !important`,
                    transform: "scale(1.001)",
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.1)}`,
                  },
                  "&.Mui-selected": {
                    backgroundColor: `${alpha(theme.palette.secondary.main, 0.08)} !important`,
                    transform: "scale(1.001)",
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    "&:hover": {
                      backgroundColor: `${alpha(theme.palette.secondary.main, 0.12)} !important`,
                      transform: "scale(1.002)",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                    },
                  },
                },
                "& .MuiTableCell-root": {
                  py: 1.5,
                  borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.05)}`,
                  fontSize: "0.875rem",
                  backgroundColor: "inherit !important",
                },
              },
              // Grouping row styling
              "& .mrt-row-pin-header": {
                backgroundColor: `${alpha(theme.palette.secondary.main, 0.1)} !important`,
                "& .MuiTableCell-root": {
                  borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                },
              },
            },
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              border: `1px solid ${alpha(theme.palette.primary.light, 0.12)}`,
              overflow: "hidden",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.light, 0.08)}`,
            },
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: alpha(theme.palette.secondary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              minHeight: "64px !important",
              "& .MuiToolbar-root": {
                minHeight: "64px !important",
                alignItems: "center",
              },
            },
          }}
          muiTableBodyRowProps={({ row }) => {
            const isSelected = row.getIsSelected()
            const selectedBgColor = alpha(theme.palette.secondary.main, 0.08)
            const selectedHoverBgColor = alpha(theme.palette.secondary.main, 0.12)
            const hoverBgColor = alpha(theme.palette.secondary.main, 0.04)
            
            return {
              selected: isSelected,
              style: {
                // Force background color via inline style to override Material-React-Table's inline styles
                backgroundColor: isSelected ? selectedBgColor : 'white',
              },
              sx: {
                cursor: 'pointer',
                // Force background color based on selection state
                backgroundColor: isSelected 
                  ? `${selectedBgColor} !important`
                  : 'white !important',
                '&.Mui-selected': {
                  backgroundColor: `${selectedBgColor} !important`,
                  '&:hover': {
                    backgroundColor: `${selectedHoverBgColor} !important`,
                  },
                },
                '&:hover': {
                  backgroundColor: isSelected
                    ? `${selectedHoverBgColor} !important`
                    : `${hoverBgColor} !important`,
                },
              },
            }
          }}
          muiTableBodyCellProps={({ cell }) => ({
            sx: {
              backgroundColor: 'inherit !important',
            },
          })}
          renderTopToolbarCustomActions={({ table }) => {
            // Get current grouping state
            const currentGrouping = table.getState().grouping
            const currentFilters = table.getState().columnFilters

            // Track if we're filtering by Pending Review status
            const [filterByPendingReview, setFilterByPendingReview] = React.useState(false)

            // Apply filtering when filterByPendingReview changes
            React.useEffect(() => {
              const newFilters = []
              if (filterByPendingReview) {
                newFilters.push({ id: "status", value: "pending_review" })
              }

              table.setColumnFilters(newFilters)
            }, [filterByPendingReview, table])

            return (
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  px: 2,
                  minHeight: 56,
                  backgroundColor: hasSelectedRows ? alpha(theme.palette.secondary.main, 0.04) : "transparent",
                  borderBottom: hasSelectedRows
                    ? `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                    : "2px solid transparent",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                }}>
                {hasSelectedRows ? (
                  // Bulk Actions Mode - Clean and focused
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      width: "100%",
                    }}>
                    {/* Selection Counter */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}>
                      <CheckBoxIcon sx={{ color: theme.palette.secondary.main, fontSize: "1.2rem" }} />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                        }}>
                        {selectedAssignments.length} selected
                      </Typography>
                    </Box>

                    {/* Action Buttons - Grouped */}
                    <ButtonGroup
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiButton-root": {
                          borderColor: alpha(theme.palette.primary.light, 0.2),
                          color: theme.palette.primary.light,
                          fontSize: "0.8rem",
                          px: 2,
                          py: 0.75,
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.light, 0.04),
                            borderColor: theme.palette.primary.light,
                          },
                        },
                      }}>
                      <Button
                        startIcon={<SelectAllIcon sx={{ fontSize: "0.9rem" }} />}
                        onClick={handleSelectAll}>
                        All
                      </Button>
                      <Button
                        startIcon={<CalendarTodayIcon sx={{ fontSize: "0.9rem" }} />}
                        onClick={handleBulkDueDateChange}>
                        Due Date
                      </Button>
                      <Button
                        startIcon={<DeleteIcon sx={{ fontSize: "0.9rem" }} />}
                        onClick={handleBulkDelete}
                        sx={{
                          color: theme.palette.primary.main,
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                          "&:hover": {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            borderColor: theme.palette.primary.main,
                          },
                        }}>
                        Delete
                      </Button>
                    </ButtonGroup>

                    {/* Clear Selection */}
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={handleDeselectAll}
                      sx={{
                        ml: "auto",
                        color: "text.secondary",
                        fontSize: "0.8rem",
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.primary.light, 0.04),
                        },
                      }}>
                      Clear
                    </Button>
                  </Box>
                ) : (
                  // Normal Mode - Two clean sections
                  <>
                    {/* Left: Grouping Controls */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.secondary.main,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontSize: "0.65rem",
                        }}>
                        Group
                      </Typography>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          startIcon={<GroupingIcon sx={{ fontSize: "0.9rem" }} />}
                          onClick={() => {
                            if (currentGrouping.includes("status")) {
                              table.resetGrouping()
                            } else {
                              table.setGrouping(["status"])
                            }
                          }}
                          variant={currentGrouping.includes("status") ? "contained" : "outlined"}
                          sx={{
                            fontSize: "0.75rem",
                            py: 0.5,
                            px: 1.5,
                            backgroundColor: currentGrouping.includes("status")
                              ? theme.palette.secondary.main
                              : "transparent",
                            borderColor: theme.palette.secondary.main,
                            color: currentGrouping.includes("status") ? "white" : theme.palette.secondary.main,
                            "&:hover": {
                              backgroundColor: currentGrouping.includes("status")
                                ? theme.palette.primary.light
                                : alpha(theme.palette.secondary.main, 0.04),
                            },
                          }}>
                          Status
                        </Button>
                        <Button
                          startIcon={<PersonIcon sx={{ fontSize: "0.9rem" }} />}
                          onClick={() => {
                            if (currentGrouping.includes("studentName")) {
                              table.resetGrouping()
                            } else {
                              table.setGrouping(["studentName"])
                            }
                          }}
                          variant={
                            currentGrouping.includes("studentName") ? "contained" : "outlined"
                          }
                          sx={{
                            fontSize: "0.75rem",
                            py: 0.5,
                            px: 1.5,
                            backgroundColor: currentGrouping.includes("studentName")
                              ? theme.palette.secondary.main
                              : "transparent",
                            borderColor: theme.palette.secondary.main,
                            color: currentGrouping.includes("studentName")
                              ? "white"
                              : theme.palette.secondary.main,
                            "&:hover": {
                              backgroundColor: currentGrouping.includes("studentName")
                                ? theme.palette.primary.light
                                : alpha(theme.palette.secondary.main, 0.04),
                            },
                          }}>
                          Student
                        </Button>
                        <Button
                          startIcon={<CaseIcon sx={{ fontSize: "0.9rem" }} />}
                          onClick={() => {
                            if (currentGrouping.includes("caseTitle")) {
                              table.resetGrouping()
                            } else {
                              table.setGrouping(["caseTitle"])
                            }
                          }}
                          variant={currentGrouping.includes("caseTitle") ? "contained" : "outlined"}
                          sx={{
                            fontSize: "0.75rem",
                            py: 0.5,
                            px: 1.5,
                            backgroundColor: currentGrouping.includes("caseTitle")
                              ? theme.palette.secondary.main
                              : "transparent",
                            borderColor: theme.palette.secondary.main,
                            color: currentGrouping.includes("caseTitle")
                              ? "white"
                              : theme.palette.secondary.main,
                            "&:hover": {
                              backgroundColor: currentGrouping.includes("caseTitle")
                                ? theme.palette.primary.light
                                : alpha(theme.palette.secondary.main, 0.04),
                            },
                          }}>
                          Case
                        </Button>
                      </ButtonGroup>
                    </Box>

                    {/* Right: Filter Controls */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontSize: "0.65rem",
                        }}>
                        Filter
                      </Typography>
                      <Chip
                        label="Pending Review"
                        size="small"
                        variant={filterByPendingReview ? "filled" : "outlined"}
                        onClick={() => setFilterByPendingReview(!filterByPendingReview)}
                        sx={{
                          height: 28,
                          fontSize: "0.75rem",
                          borderColor: theme.palette.primary.main,
                          backgroundColor: filterByPendingReview
                            ? theme.palette.primary.main
                            : "transparent",
                          color: filterByPendingReview ? "white" : theme.palette.primary.main,
                          "&:hover": {
                            backgroundColor: filterByPendingReview
                              ? theme.palette.primary.dark
                              : alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      />
                    </Box>
                  </>
                )}
              </Box>
            )
          }}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog
          open={bulkDeleteDialogOpen}
          onClose={() => setBulkDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>Confirm Bulk Deletion</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete {selectedAssignments.length} assignment
              {selectedAssignments.length !== 1 ? "s" : ""}
              ?
</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This action cannot be undone. The following assignments will be permanently deleted:
            </Typography>
            <Box sx={{ bgcolor: "grey.50", p: 1, borderRadius: 1 }}>
              {selectedAssignments.map((assignment, index) => (
                <Typography
                  key={assignment.assignmentId}
                  variant="caption"
                  sx={{ display: "block", mb: 0.5 }}>
                  {index + 1}.{assignment.studentName} -{assignment.caseTitle}
                </Typography>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkDelete}
              variant="contained"
              color="error"
              sx={{
                bgcolor: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                },
              }}>
              Delete {selectedAssignments.length} Assignment
              {selectedAssignments.length !== 1 ? "s" : ""}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Due Date Change Dialog */}
        <Dialog
          open={dueDateDialogOpen}
          onClose={() => setDueDateDialogOpen(false)}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>Bulk Update Due Dates</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Select a new due date for the selected assignments:
            </Typography>
            <DateTimePicker
              label="Due Date"
              value={newDueDate}
              onChange={(newValue) => {
                if (newValue && newValue.isValid()) {
                  setNewDueDate(newValue)
                }
              }}
              sx={{ width: "100%", mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDueDateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmDueDateChange}
              variant="contained"
              color="primary"
              sx={{
                bgcolor: theme.palette.primary.light,
                "&:hover": {
                  bgcolor: theme.palette.primary.light,
                },
              }}>
              Update Due Dates
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default AssignmentsDataGrid
