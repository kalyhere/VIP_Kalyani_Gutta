import { useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  alpha,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid2 as Grid,
} from "@mui/material"
import {
  LocalHospital as CaseIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
} from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { motion, AnimatePresence } from "framer-motion"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import dayjs, { Dayjs } from "dayjs"

// Import our reusable components
import { FacultyReportDetail } from "."
import { CaseContentViewer } from "@/features/cases"
import type { CompletedReportDetailItem } from "@/types/faculty-types"

// Import shared utilities
import { MedicalCase } from "@/types/medical-cases"
import { FacultyClass, Student } from "@/types/faculty-types"

// Create a motion-compatible version of MUI Box
const MotionBox = motion(Box)

// Define subtle fade animation variants
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Define the types for the component props
interface AssignmentPanelProps {
  rightMd: number
  mainView: "classList" | "classDetail" | "reportReview"
  rightPanelView: "report" | "caseContent" | "none" | "assignmentFlow"
  selectedClass: FacultyClass | null
  selectedReportId: number | null
  selectedCaseForAssignment: MedicalCase | null
  selectedStudents: number[]
  assignmentDueDate: Dayjs
  viewerContent: any
  cases: MedicalCase[]
  students: Student[]
  assignments: any[]
  loading: boolean
  isViewerOpen: boolean
  confirmDialogOpen: boolean
  onSetAssignmentDueDate: (date: Dayjs) => void
  onSetViewerContent: (content: any) => void
  onSetIsViewerOpen: (open: boolean) => void
  onSetConfirmDialogOpen: (open: boolean) => void
  onHandleReturnToClassDetail: () => void
  onHandleReportFinalize: () => void
  onHandleCloseRightPanelCaseViewer: () => void
  onHandleCancelAssignmentFlow: () => void
  onHandleCaseSelect: (caseItem: MedicalCase) => void
  onSetSelectedCaseForAssignment: (caseItem: MedicalCase | null) => void
  onHandleAssignCase: () => void
  getRightPanelTitleForTooltip: () => string
  getRightPanelDisplayText: () => string
}

export const AssignmentPanel = ({
  rightMd,
  mainView,
  rightPanelView,
  selectedClass,
  selectedReportId,
  selectedCaseForAssignment,
  selectedStudents,
  assignmentDueDate,
  viewerContent,
  cases,
  students,
  assignments,
  loading,
  isViewerOpen,
  confirmDialogOpen,
  onSetAssignmentDueDate,
  onSetViewerContent,
  onSetIsViewerOpen,
  onSetConfirmDialogOpen,
  onHandleReturnToClassDetail,
  onHandleReportFinalize,
  onHandleCloseRightPanelCaseViewer,
  onHandleCancelAssignmentFlow,
  onHandleCaseSelect,
  onSetSelectedCaseForAssignment,
  onHandleAssignCase,
  getRightPanelTitleForTooltip,
  getRightPanelDisplayText,
}: AssignmentPanelProps) => {
  const theme = useTheme()

  return (
    <>
      {/* Right Panel */}
      <AnimatePresence initial={false}>
        {rightMd > 0 && (
          <Grid size={{ xs: 12, md: rightMd }} key="right-panel" sx={{ height: "100%" }}>
            <MotionBox
              sx={{
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.3s ease-in-out",
              }}
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit">
              {mainView === "reportReview" &&
                rightPanelView === "report" &&
                selectedClass &&
                (selectedReportId !== null ? (
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
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
                            sx={{
                              color: theme.palette.primary.light,
                              display: "block",
                              lineHeight: 1.2,
                            }}>
                            Report Review
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "medium",
                              color: theme.palette.text.primary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={getRightPanelTitleForTooltip()}>
                            {getRightPanelDisplayText()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={onHandleReturnToClassDetail}
                            sx={{
                              color: theme.palette.primary.light,
                              borderColor: theme.palette.primary.light,
                              fontWeight: "medium",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.light, 0.08),
                                borderColor: theme.palette.text.primary,
                              },
                            }}>
                            Back to Class
                          </Button>
                          {mainView === "reportReview" && selectedReportId !== null && (
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={() => onSetConfirmDialogOpen(true)}
                              sx={{
                                bgcolor: theme.palette.primary.main,
                                "&:hover": {
                                  bgcolor: theme.palette.primary.dark,
                                },
                              }}>
                              Finalize Review
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                      <FacultyReportDetail
                        reportId={selectedReportId}
                        onFinalize={onHandleReportFinalize}
                        onFinalizeComplete={() => {
                          // This is handled in the parent
                        }}
                      />
                    </Box>
                  </Paper>
                ) : (
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <AssessmentIcon sx={{ fontSize: 40, mb: 1, color: "text.disabled" }} />
                    <Typography variant="body1" color="text.secondary">
                      No report selected.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Select a report from the middle panel.
                    </Typography>
                  </Paper>
                ))}

              {rightPanelView === "caseContent" && viewerContent && (
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box
                    sx={{
                      py: 1,
                      px: 2,
                      borderBottom: 1,
                      borderColor: "divider",
                      flexShrink: 0,
                    }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: theme.palette.primary.light,
                          display: "block",
                          lineHeight: 1.2,
                        }}>
                        Case Details
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                        {viewerContent?.name ||
                          (selectedCaseForAssignment
                            ? selectedCaseForAssignment.title
                            : "Case Content")}
                      </Typography>
                    </Box>
                    <IconButton onClick={onHandleCloseRightPanelCaseViewer} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 1.5, sm: 1.5, md: 2 } }}>
                    <CaseContentViewer caseContent={viewerContent} />
                  </Box>
                </Paper>
              )}

              {rightPanelView === "assignmentFlow" && (
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    py: 2,
                    px: 1,
                  }}>
                  {/* Assignment Panel Header */}
                  <Box
                    sx={{
                      py: 1,
                      px: 2,
                      borderBottom: 1,
                      borderColor: "divider",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: theme.palette.primary.light,
                          display: "block",
                          lineHeight: 1.2,
                        }}>
                        Case Assignment
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
                        {selectedCaseForAssignment ? "Configure Assignment" : "Select Case"}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={onHandleCancelAssignmentFlow}
                      size="small"
                      sx={{
                        color: theme.palette.primary.light,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.light, 0.08),
                        },
                      }}>
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  {/* Assignment Panel Content */}
                  <Box
                    sx={{
                      py: { xs: 1.5, sm: 1.5 },
                      px: { xs: 1.5, sm: 1 },
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      overflowY: "auto",
                    }}>
                    {!selectedCaseForAssignment ? (
                      /* Case Selection Phase */
                      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        {/* Case Selection Header */}
                        <Box sx={{ mb: 2, flexShrink: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ color: theme.palette.text.primary, fontWeight: "medium", mb: 1 }}>
                            Available Medical Cases
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Select a case to assign to your students. You can preview case details
                            before assigning.
                          </Typography>
                        </Box>

                        {/* Case List */}
                        <Box
                          sx={{
                            flexGrow: 1,
                            overflowX: "visible",
                            pt: 1,
                            pb: 3, // Extra padding for transforms
                          }}>
                          {loading && cases.length === 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                py: 4,
                              }}>
                              {[...Array(2)].map((_, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.2,
                                    ease: "easeOut",
                                  }}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 2,
                                      borderColor: alpha(theme.palette.primary.light, 0.08),
                                      backgroundColor: alpha(theme.palette.primary.light, 0.02),
                                    }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                      {/* Title skeleton */}
                                      <Box
                                        sx={{
                                          height: 20,
                                          borderRadius: 1,
                                          mb: 1.5,
                                          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.1)} 25%, ${alpha(theme.palette.primary.light, 0.15)} 50%, ${alpha(theme.palette.primary.light, 0.1)} 75%)`,
                                          backgroundSize: "200% 100%",
                                          animation: "shimmer 1.5s infinite",
                                          width: `${60 + Math.random() * 30}%`,
                                        }}
                                      />
                                      {/* Description skeleton lines */}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 0.5,
                                          mb: 2,
                                        }}>
                                        <Box
                                          sx={{
                                            height: 14,
                                            borderRadius: 1,
                                            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.08)} 25%, ${alpha(theme.palette.primary.light, 0.12)} 50%, ${alpha(theme.palette.primary.light, 0.08)} 75%)`,
                                            backgroundSize: "200% 100%",
                                            animation: "shimmer 1.5s infinite",
                                            width: "100%",
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            height: 14,
                                            borderRadius: 1,
                                            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.light, 0.08)} 25%, ${alpha(theme.palette.primary.light, 0.12)} 50%, ${alpha(theme.palette.primary.light, 0.08)} 75%)`,
                                            backgroundSize: "200% 100%",
                                            animation: "shimmer 1.5s infinite",
                                            width: `${70 + Math.random() * 20}%`,
                                          }}
                                        />
                                      </Box>
                                      {/* Chips skeleton */}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 0.5,
                                          flexWrap: "wrap",
                                        }}>
                                        {[...Array(3)].map((_, chipIndex) => (
                                          <Box
                                            key={chipIndex}
                                            sx={{
                                              height: 20,
                                              width: `${40 + Math.random() * 30}px`,
                                              borderRadius: 3,
                                              background: `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.05)} 25%, ${alpha(theme.palette.secondary.main, 0.1)} 50%, ${alpha(theme.palette.secondary.main, 0.05)} 75%)`,
                                              backgroundSize: "200% 100%",
                                              animation: "shimmer 1.5s infinite",
                                            }}
                                          />
                                        ))}
                                      </Box>
                                    </CardContent>
                                    {/* Actions skeleton */}
                                    <Box
                                      sx={{
                                        px: 2.5,
                                        pb: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderTop: `1px solid ${alpha(theme.palette.primary.light, 0.05)}`,
                                      }}>
                                      <Box
                                        sx={{
                                          height: 32,
                                          width: 80,
                                          borderRadius: 1,
                                          background: `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.05)} 25%, ${alpha(theme.palette.secondary.main, 0.1)} 50%, ${alpha(theme.palette.secondary.main, 0.05)} 75%)`,
                                          backgroundSize: "200% 100%",
                                          animation: "shimmer 1.5s infinite",
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          height: 32,
                                          width: 90,
                                          borderRadius: 1,
                                          background: `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.1)} 25%, ${alpha(theme.palette.secondary.main, 0.15)} 50%, ${alpha(theme.palette.secondary.main, 0.1)} 75%)`,
                                          backgroundSize: "200% 100%",
                                          animation: "shimmer 1.5s infinite",
                                        }}
                                      />
                                    </Box>
                                  </Card>
                                </motion.div>
                              ))}
                            </Box>
                          )}

                          {!loading && cases.length === 0 && (
                            <Box
                              sx={{
                                textAlign: "center",
                                py: 4,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}>
                              <CaseIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No cases available
                              </Typography>
                              <Typography variant="body2" color="text.disabled">
                                Contact your administrator to add medical cases.
                              </Typography>
                            </Box>
                          )}

                          {cases.length > 0 && (
                            <Stack
                              spacing={3}
                              sx={{
                                pb: 3,
                                mt: 1, // Small top margin for first item transforms
                                px: 0.2, // Side padding for horizontal transforms
                                overflow: "visible", // Allow transforms to extend
                              }}>
                              {cases.map((caseItem, index) => (
                                <motion.div
                                  key={caseItem.id}
                                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                    ease: "easeOut",
                                  }}
                                  whileHover={{
                                    y: -2,
                                    scale: 1.005, // Very subtle scale
                                    transition: { duration: 0.15, ease: "easeOut" },
                                  }}
                                  whileTap={{
                                    scale: 0.995, // More subtle scale
                                    transition: { duration: 0.1 },
                                  }}>
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      borderRadius: 2,
                                      borderColor: theme.palette.divider,
                                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                      cursor: "pointer",
                                      position: "relative",
                                      overflow: "visible",
                                      "&:hover": {
                                        borderColor: theme.palette.secondary.main,
                                        boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
                                        transform: "translateY(-4px)",
                                        "&::before": {
                                          opacity: 1,
                                          transform: "scale(1)",
                                        },
                                      },
                                      "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        top: -2,
                                        left: -2,
                                        right: -2,
                                        bottom: -2,
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.light, 0.1)})`,
                                        borderRadius: 2,
                                        opacity: 0,
                                        transform: "scale(0.95)",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        zIndex: -1,
                                      },
                                    }}>
                                    <CardActionArea onClick={() => onHandleCaseSelect(caseItem)}>
                                      <CardContent sx={{ p: 2.5 }}>
                                        {/* Case Header */}
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            mb: 1.5,
                                          }}>
                                          <Typography
                                            variant="h6"
                                            component="div"
                                            sx={{
                                              fontWeight: "bold",
                                              color: theme.palette.text.primary,
                                              fontSize: "1.1rem",
                                              lineHeight: 1.3,
                                              flexGrow: 1,
                                            }}>
                                            {caseItem.title}
                                          </Typography>
                                        </Box>

                                        {/* Case Description */}
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{
                                            mb: 2,
                                            minHeight: "2.4em",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            lineHeight: 1.4,
                                          }}>
                                          {caseItem.description ||
                                            "Medical case for clinical training and assessment."}
                                        </Typography>

                                        {/* Real Data Only - Student Assignment Count */}
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 1,
                                            mb: 2,
                                          }}>
                                          {(() => {
                                            const assignedCount = students.filter((student) =>
                                              student.caseAssignments?.some(
                                              (c) => c.caseId === caseItem.id
                                              )
                                            ).length

                                            if (assignedCount > 0) {
                                              return (
                                                <Chip
                                                  label={`${assignedCount} student${assignedCount !== 1 ? "s" : ""} assigned`}
                                                  size="small"
                                                  variant="filled"
                                                  sx={{
                                                    height: 22,
                                                    fontSize: "0.7rem",
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    "& .MuiChip-label": { px: 1 },
                                                  }}
                                                />
                                              )
                                            }
                                            return null
                                          })()}
                                        </Box>

                                        {/* Topics - Real Data */}
                                        {caseItem.topics && caseItem.topics.length > 0 && (
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 0.5,
                                            }}>
                                            {caseItem.topics.slice(0, 4).map((topic, index) => (
                                              <Chip
                                                key={index}
                                                label={topic}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.65rem",
                                                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                                                  color: theme.palette.secondary.main,
                                                  "& .MuiChip-label": { px: 0.75 },
                                                }}
                                              />
                                            ))}
                                            {caseItem.topics.length > 4 && (
                                              <Chip
                                                label={`+${caseItem.topics.length - 4} more`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.65rem",
                                                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                                                  color: theme.palette.secondary.main,
                                                  "& .MuiChip-label": { px: 0.75 },
                                                }}
                                              />
                                            )}
                                          </Box>
                                        )}
                                      </CardContent>
                                    </CardActionArea>

                                    {/* Case Actions */}
                                    <Box
                                      sx={{
                                        px: 2.5,
                                        p: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                      }}>
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          let parsedContent: any = null
                                          try {
                                            if (typeof caseItem.content === "string") {
                                              parsedContent = JSON.parse(caseItem.content)
                                            } else if (
                                              typeof caseItem.content === "object" &&
                                              caseItem.content !== null
                                            ) {
                                              parsedContent = caseItem.content
                                            }
                                          } catch (e) {
                                            console.error("Failed to parse case content:", e)
                                          }
                                          onSetViewerContent(parsedContent)
                                          onSetIsViewerOpen(true)
                                        }}
                                        startIcon={<VisibilityIcon fontSize="small" />}
                                        sx={{
                                          color: theme.palette.secondary.main,
                                          fontSize: "0.75rem",
                                          "&:hover": {
                                            bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                          },
                                        }}>
                                        Preview
                                      </Button>

                                      <Button
                                        size="small"
                                        variant="contained"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onHandleCaseSelect(caseItem)
                                        }}
                                        sx={{
                                          bgcolor: theme.palette.secondary.main,
                                          "&:hover": { bgcolor: theme.palette.primary.light },
                                          fontSize: "0.75rem",
                                          py: 0.75,
                                          px: 2,
                                        }}>
                                        Select
                                      </Button>
                                    </Box>
                                  </Card>
                                </motion.div>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      /* Assignment Configuration Phase */
                      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        {/* Selected Case Summary */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            mb: 2,
                            bgcolor: alpha(theme.palette.secondary.main, 0.05),
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                            borderRadius: 2,
                            flexShrink: 0,
                          }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: theme.palette.text.primary,
                                  fontWeight: "bold",
                                  mb: 0.5,
                                }}>
                                Selected Case
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: theme.palette.secondary.main,
                                  fontWeight: "medium",
                                  mb: 1,
                                }}>
                                {selectedCaseForAssignment.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  maxHeight: "120px",
                                  overflow: "auto",
                                  wordWrap: "break-word",
                                  paddingRight: "8px",
                                  "&::-webkit-scrollbar": {
                                    width: "4px",
                                  },
                                  "&::-webkit-scrollbar-track": {
                                    background: "rgba(0,0,0,0.1)",
                                    borderRadius: "4px",
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    background: "rgba(0,0,0,0.3)",
                                    borderRadius: "4px",
                                  },
                                  "&::-webkit-scrollbar-thumb:hover": {
                                    background: "rgba(0,0,0,0.5)",
                                  },
                                }}>
                                {selectedCaseForAssignment.description ||
                                  "Ready to assign to students"}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onSetSelectedCaseForAssignment(null)}
                                sx={{
                                  borderColor: theme.palette.secondary.main,
                                  color: theme.palette.secondary.main,
                                  fontSize: "0.75rem",
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                  },
                                }}>
                                Change Case
                              </Button>
                            </Box>
                          </Box>
                        </Paper>

                        {/* Assignment Configuration */}
                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ color: theme.palette.text.primary, fontWeight: "medium", mb: 2 }}>
                            Assignment Configuration
                          </Typography>

                          <Stack spacing={3} sx={{ flexGrow: 1 }}>
                            <DateTimePicker
                              label="Due Date & Time"
                              value={assignmentDueDate}
                              onChange={(newDate) => {
                                console.log("DateTimePicker onChange:", newDate)
                                if (
                                  newDate &&
                                  (typeof newDate.isValid === "function" ? newDate.isValid() : true)
                                ) {
                                  onSetAssignmentDueDate(newDate)
                                }
                              }}
                              sx={{ width: "100%" }}
                              disablePast
                              minDate={dayjs()}
                              timeSteps={{ minutes: 1 }}
                              slotProps={{
                                textField: {
                                  size: "small",
                                  fullWidth: true,
                                  sx: {
                                    "& .MuiOutlinedInput-root": {
                                      "& fieldset": {
                                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                                      },
                                      "&:hover fieldset": {
                                        borderColor: theme.palette.secondary.main,
                                      },
                                      "&.Mui-focused fieldset": {
                                        borderColor: theme.palette.secondary.main,
                                      },
                                    },
                                  },
                                },
                              }}
                            />

                            {/* Assignment Summary */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: alpha(theme.palette.divider, 0.3),
                                border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                                borderRadius: 1.5,
                              }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: theme.palette.text.primary,
                                  fontWeight: "medium",
                                  mb: 1,
                                }}>
                                Assignment Summary
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.75,
                                }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Students Selected:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: "medium",
                                      color:
                                        selectedStudents.length > 0
                                          ? theme.palette.secondary.main
                                          : "text.secondary",
                                    }}>
                                    {selectedStudents.length}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Due Date:
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: "medium" }}>
                                    {assignmentDueDate &&
                                    typeof assignmentDueDate.format === "function"
                                      ? assignmentDueDate.format("MMM D, YYYY h:mm A")
                                      : "Invalid date"}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>

                            {/* Assignment Button */}
                            <motion.div
                              whileHover={{
                                scale: 1.01, // Very subtle scale
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{
                                scale: 0.99, // Very subtle scale
                                transition: { duration: 0.1 },
                              }}>
                              <Button
                                onClick={onHandleAssignCase}
                                variant="contained"
                                disabled={loading || selectedStudents.length === 0}
                                startIcon={
                                  loading ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <AssignmentIcon />
                                  )
                                }
                                fullWidth
                                sx={{
                                  height: 48,
                                  fontSize: "1rem",
                                  fontWeight: "bold",
                                  bgcolor: theme.palette.primary.main,
                                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                  "&:hover": {
                                    bgcolor: theme.palette.primary.dark,
                                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                                    transform: "translateY(-2px)",
                                  },
                                  "&.Mui-disabled": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: alpha(theme.palette.primary.main, 0.26),
                                  },
                                }}>
                                {loading
                                  ? "Assigning..."
                                  : selectedStudents.length > 0
                                    ? `Assign to ${selectedStudents.length} Student${selectedStudents.length === 1 ? "" : "s"}`
                                    : "Select Student(s)"}
                              </Button>
                            </motion.div>
                          </Stack>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </MotionBox>
          </Grid>
        )}
      </AnimatePresence>

      {/* Case Content Viewer Dialog (Fallback) */}
      <Dialog
        open={isViewerOpen}
        onClose={() => {
          onSetIsViewerOpen(false)
          onSetViewerContent(null)
        }}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            maxHeight: "90vh",
          },
        }}>
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
              {viewerContent?.name || "Case Details"}
            </Typography>
            <IconButton
              onClick={() => {
                onSetIsViewerOpen(false)
                onSetViewerContent(null)
              }}
              size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <CaseContentViewer caseContent={viewerContent} />
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: "divider", pt: 1.5, pb: 1.5, px: 2 }}>
          <Button
            onClick={() => {
              onSetIsViewerOpen(false)
              onSetViewerContent(null)
            }}
            variant="outlined"
            color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Finalize Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => onSetConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Confirm Finalization</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to finalize this review? This action will:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body2">Make the review visible to the student</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body2">Lock the review from further edits</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body2">Return you to the class overview</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onSetConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onSetConfirmDialogOpen(false)
              onHandleReportFinalize()
            }}
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
            }}>
            Finalize Review
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
