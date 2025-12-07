import { Box, Paper, Typography, Grid2 as Grid, alpha } from "@mui/material"
import { School as SchoolIcon } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@mui/material/styles"
import { FacultyClass, ClassAssignmentStatus, Student } from "@/types/faculty-types"
import { ClassDetailPanelContent } from "@/features/assignments"
import { StudentSelectionGrid } from "@/features/cases"

const MotionBox = motion(Box)

interface StudentDetailsPanelProps {
  selectedClass: FacultyClass | null
  students: Student[]
  assignments: ClassAssignmentStatus[]
  middleMd: number
  mainView: "classList" | "classDetail" | "reportReview"
  rightPanelView: "report" | "caseContent" | "none" | "assignmentFlow"
  selectedReportId: number | null
  selectedStudents: number[]
  selectedCaseForAssignment: any
  isAllStudentsSelected: boolean
  isLoadingAssignments: boolean
  isLoadingStudents: boolean
  onStartAssignmentFlow: () => void
  onNavigateToReportReview: (reportId: number) => void
  onProcessRowUpdate: (newRow: any, oldRow: any) => Promise<any>
  onBackToClassList: () => void
  onDeleteAssignment: (assignmentId: number) => Promise<void>
  onBulkUpdateDueDate: (assignmentIds: number[], newDueDate: string) => Promise<void>
  onStudentToggle: (studentId: number, assignableIds?: number[]) => void
  onSelectAllStudents: () => void
  fadeVariants: {
    hidden: { opacity: number }
    visible: { opacity: number; transition: { duration: number } }
    exit: { opacity: number; transition: { duration: number } }
  }
}

export const StudentDetailsPanel = ({
  selectedClass,
  students,
  assignments,
  middleMd,
  mainView,
  rightPanelView,
  selectedReportId,
  selectedStudents,
  selectedCaseForAssignment,
  isAllStudentsSelected,
  isLoadingAssignments,
  isLoadingStudents,
  onStartAssignmentFlow,
  onNavigateToReportReview,
  onProcessRowUpdate,
  onBackToClassList,
  onDeleteAssignment,
  onBulkUpdateDueDate,
  onStudentToggle,
  onSelectAllStudents,
  fadeVariants,
}: StudentDetailsPanelProps) => {
  const theme = useTheme()

  return (
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
                  p: middleMd < 5 ? 1.5 : 2,
                  overflow: "hidden",
                }}>
                {rightPanelView === "assignmentFlow" ? (
                  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
                        sx={{
                          color: theme.palette.primary.light,
                          display: "block",
                          lineHeight: 1.2,
                        }}>
                        Select Students
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                        {selectedClass.name}
                      </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                      <StudentSelectionGrid
                        students={students}
                        selectedStudents={selectedStudents}
                        onStudentToggle={onStudentToggle}
                        selectedCase={
                          selectedCaseForAssignment
                            ? {
                                id: selectedCaseForAssignment.id,
                                title: selectedCaseForAssignment.title,
                              }
                            : null
                        }
                        onSelectAllStudents={onSelectAllStudents}
                        isAllStudentsSelected={isAllStudentsSelected}
                      />
                    </Box>
                  </Box>
                ) : (
                  <ClassDetailPanelContent
                    classData={selectedClass}
                    assignments={assignments}
                    onStartAssignmentFlow={onStartAssignmentFlow}
                    onNavigateToReportReview={onNavigateToReportReview}
                    focusedReportId={mainView === "reportReview" ? selectedReportId : null}
                    displayMode={mainView === "reportReview" ? "reportList" : "assignmentTable"}
                    onProcessRowUpdate={onProcessRowUpdate}
                    onBackToClassList={onBackToClassList}
                    isCompactView={false}
                    isLoadingAssignments={isLoadingAssignments}
                    isLoadingStudents={isLoadingStudents}
                    onDeleteAssignment={onDeleteAssignment}
                    onBulkUpdateDueDate={onBulkUpdateDueDate}
                  />
                )}
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
                    border: `1px dashed ${theme.palette.divider}`,
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
  )
}
