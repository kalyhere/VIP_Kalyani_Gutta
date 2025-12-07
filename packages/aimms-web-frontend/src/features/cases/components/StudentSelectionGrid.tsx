import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  alpha,
  Checkbox,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Stack,
  Paper,
  Grid2 as Grid,
} from "@mui/material"
import {
  Person as PersonIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  School as SchoolIcon,
} from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { Student } from "../../types/faculty-types"
interface StudentSelectionGridProps {
  students: Student[]
  selectedStudents: number[]
  onStudentToggle: (studentId: number, assignableIds?: number[]) => void
  onSelectAllStudents: () => void
  isAllStudentsSelected: boolean
  isCompactView?: boolean
  selectedCase?: { id: number; title: string } | null
}

const StudentSelectionGrid: React.FC<StudentSelectionGridProps> = ({
  students: initialStudents,
  selectedStudents,
  onStudentToggle,
  onSelectAllStudents,
  isAllStudentsSelected,
  isCompactView = false,
  selectedCase = null,
}) => {
  const theme = useTheme()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false)

  // Update students when initialStudents changes
  useEffect(() => {
    setStudents(initialStudents)
  }, [initialStudents])

  // Function to check if a student is already assigned to the selected case (for display purposes only)
  const isStudentAssignedToCase = (student: Student): boolean => {
    if (!selectedCase || !student.caseAssignments) {
      return false
    }
    return student.caseAssignments.some((c) => c.caseId === selectedCase.id)
  }

  // Count of students already assigned to the selected case (for informational display)
  const assignedStudentsCount = useMemo(() => {
    if (!selectedCase) return 0
    return students.filter((student) => isStudentAssignedToCase(student)).length
  }, [students, selectedCase])

  // Check if all students are selected
  const areAllStudentsSelected = useMemo(() => {
    if (students.length === 0) return false
    return students.every((student) => selectedStudents.includes(student.id))
  }, [students, selectedStudents])

  // Custom handler for select all to select all students
  const handleSelectAllStudents = () => {
    onSelectAllStudents()
  }

  // Filter students based on current filter state
  const filteredStudents = useMemo(() => {
    let filtered = students

    if (showAssignedOnly) {
      filtered = students.filter((student) => isStudentAssignedToCase(student))
    } else if (showUnassignedOnly) {
      filtered = students.filter((student) => !isStudentAssignedToCase(student))
    }

    return filtered
  }, [students, showAssignedOnly, showUnassignedOnly, selectedCase])

  if (!students.length) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}>
        <SchoolIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No students found
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Students will appear here once they're enrolled in the class.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Enhanced Header with Stats and Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: alpha(theme.palette.divider, 0.3),
          border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
          borderRadius: 2,
          flexShrink: 0,
        }}>
        {/* Selection Summary */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: "medium" }}>
              Student Selection
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {selectedStudents.length} of {students.length} students selected
              </Typography>
              {assignedStudentsCount > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {assignedStudentsCount} previously assigned
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Quick Action Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant={areAllStudentsSelected ? "contained" : "outlined"}
              startIcon={areAllStudentsSelected ? <ClearIcon /> : <SelectAllIcon />}
              onClick={handleSelectAllStudents}
              disabled={students.length === 0}
              sx={{
                bgcolor: areAllStudentsSelected ? theme.palette.secondary.main : "transparent",
                borderColor: theme.palette.secondary.main,
                color: areAllStudentsSelected ? "white" : theme.palette.secondary.main,
                "&:hover": {
                  bgcolor: areAllStudentsSelected
                    ? theme.palette.primary.light
                    : alpha(theme.palette.secondary.main, 0.08),
                },
                fontSize: "0.75rem",
              }}>
              {areAllStudentsSelected ? "Deselect All" : "Select All"}
            </Button>
          </Box>
        </Box>

        {/* Filter Chips */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Filter:
          </Typography>
          <Chip
            label="All Students"
            size="small"
            variant={!showAssignedOnly && !showUnassignedOnly ? "filled" : "outlined"}
            onClick={() => {
              setShowAssignedOnly(false)
              setShowUnassignedOnly(false)
            }}
            sx={{
              height: 24,
              bgcolor: !showAssignedOnly && !showUnassignedOnly ? theme.palette.secondary.main : "transparent",
              color: !showAssignedOnly && !showUnassignedOnly ? "white" : theme.palette.secondary.main,
              borderColor: theme.palette.secondary.main,
              "&:hover": {
                bgcolor:
                  !showAssignedOnly && !showUnassignedOnly
                    ? theme.palette.primary.light
                    : alpha(theme.palette.secondary.main, 0.08),
              },
            }}
          />
          <Chip
            label="Unassigned Only"
            size="small"
            variant={showUnassignedOnly ? "filled" : "outlined"}
            onClick={() => {
              setShowUnassignedOnly(!showUnassignedOnly)
              setShowAssignedOnly(false)
            }}
            sx={{
              height: 24,
              bgcolor: showUnassignedOnly ? theme.palette.secondary.light : "transparent",
              color: showUnassignedOnly ? "white" : theme.palette.secondary.light,
              borderColor: theme.palette.secondary.light,
              "&:hover": {
                bgcolor: showUnassignedOnly ? theme.palette.secondary.main : alpha(theme.palette.secondary.light, 0.08),
              },
            }}
          />
          {assignedStudentsCount > 0 && (
            <Chip
              label="Previously Assigned"
              size="small"
              variant={showAssignedOnly ? "filled" : "outlined"}
              onClick={() => {
                setShowAssignedOnly(!showAssignedOnly)
                setShowUnassignedOnly(false)
              }}
              sx={{
                height: 24,
                bgcolor: showAssignedOnly ? alpha(theme.palette.primary.main, 0.8) : "transparent",
                color: showAssignedOnly ? "white" : theme.palette.primary.main,
                borderColor: theme.palette.primary.main,
                "&:hover": {
                  bgcolor: showAssignedOnly ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.08),
                },
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Student Cards Grid */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "visible",
          p: 1, // Add padding to accommodate transforms
          pb: 2, // Extra bottom padding
        }}>
        <Grid container spacing={1.5} sx={{ overflow: "visible", width: "100%" }}>
          {filteredStudents.map((student) => {
            const isSelected = selectedStudents.includes(student.id)
            const isAssigned = isStudentAssignedToCase(student)

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={student.id}>
                <Card
                  variant="outlined"
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    borderColor: isSelected
                      ? theme.palette.secondary.main
                      : isAssigned
                        ? alpha(theme.palette.primary.main, 0.3)
                        : theme.palette.divider,
                    bgcolor: isSelected
                      ? alpha(theme.palette.secondary.main, 0.05)
                      : isAssigned
                        ? alpha(theme.palette.primary.main, 0.02)
                        : "background.paper",
                    boxShadow: isSelected ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}` : "none",
                    "&:hover": {
                      borderColor: theme.palette.secondary.main,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                      transform: "translateY(-1px)",
                      transformOrigin: "center center",
                    },
                  }}
                  onClick={() => onStudentToggle(student.id)}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          onStudentToggle(student.id)
                        }}
                        size="small"
                        sx={{
                          color: theme.palette.secondary.main,
                          "&.Mui-checked": {
                            color: theme.palette.secondary.main,
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Student Avatar */}
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isSelected
                            ? theme.palette.secondary.main
                            : isAssigned
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.primary.light, 0.1),
                          color: isSelected
                            ? "white"
                            : isAssigned
                              ? theme.palette.primary.main
                              : theme.palette.primary.light,
                          fontSize: "1rem",
                          fontWeight: "bold",
                        }}>
                        {student.name
                          ? student.name.substring(0, 1).toUpperCase()
                          : student.email.substring(0, 1).toUpperCase()}
                      </Avatar>

                      {/* Student Info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: isSelected ? "bold" : "medium",
                            color: theme.palette.text.primary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                          {student.name || "Unknown Student"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                          <EmailIcon sx={{ fontSize: "0.75rem", color: "text.secondary" }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {student.email}
                          </Typography>
                        </Box>

                        {/* Assignment count indicator */}
                        {student.caseAssignments && student.caseAssignments.length > 0 && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.25, display: "block" }}>
                            {student.caseAssignments.length} case
                            {student.caseAssignments.length !== 1 ? "s" : ""}
{' '}
assigned
</Typography>
                        )}
                      </Box>

                      {/* Status Indicators */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 0.5,
                        }}>
                        {isSelected && (
                          <CheckCircleIcon
                            sx={{
                              color: theme.palette.secondary.main,
                              fontSize: "1.25rem",
                            }}
                          />
                        )}
                        {isAssigned && (
                          <Chip
                            label="Previous"
                            size="small"
                            variant="filled"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        {filteredStudents.length === 0 && (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
            }}>
            <PersonIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No students match the current filter
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Try adjusting your filter settings above.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default StudentSelectionGrid
