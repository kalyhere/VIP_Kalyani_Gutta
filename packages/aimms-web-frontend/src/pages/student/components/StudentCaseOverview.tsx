import React, { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  useTheme,
} from "@mui/material"
import {
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  LocalHospital as CaseIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material"
import { format, parseISO, isBefore } from "date-fns"
import { motion } from "framer-motion"
import { getStudentCaseDetails } from "@/services/studentService"

// Define UA Brand Colors with design system enhancements

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

interface StudentCaseOverviewProps {
  caseId: number
  onLaunch: (assignmentId: number) => void
  onClose: () => void
  isLaunching?: boolean
}

interface CaseDetails {
  id: number
  title: string
  description: string
  learning_objectives: string[]
  content: any
  assignmentId: number
  assignmentStatus: string
  dueDate: string | null
}

export const StudentCaseOverview: React.FC<StudentCaseOverviewProps> = ({
  caseId,
  onLaunch,
  onClose,
  isLaunching = false,
}) => {
  const theme = useTheme()

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true)
        const data = await getStudentCaseDetails(caseId)
        setCaseDetails(data)
      } catch (err) {
        console.error("Error fetching case details:", err)
        setError("Failed to load case details.")
      } finally {
        setLoading(false)
      }
    }

    fetchCaseDetails()
  }, [caseId])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "not_started":
        return { label: "Ready to Start", color: theme.palette.secondary.main, icon: PlayArrowIcon }
      case "in_progress":
        return { label: "In Progress", color: theme.palette.secondary.light, icon: PlayArrowIcon }
      case "submitted":
        return { label: "Submitted", color: theme.palette.primary.main, icon: CheckCircleIcon }
      case "reviewed":
        return { label: "Reviewed", color: theme.palette.secondary.light, icon: CheckCircleIcon }
      default:
        return { label: "Unknown", color: theme.palette.divider, icon: AssignmentIcon }
    }
  }

  if (loading) {
    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: spacing.xxl,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: theme.palette.secondary.main, mb: spacing.lg }} />
          <Typography
            sx={{
              ...typography.body1,
              color: theme.palette.text.secondary,
            }}>
            Loading case details...
          </Typography>
        </Box>
      </Paper>
    )
  }

  if (error || !caseDetails) {
    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          height: "100%",
          p: spacing.lg,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}>
        <Alert
          severity="error"
          sx={{
            mb: spacing.lg,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          }}>
          {error || "Case details not found"}
        </Alert>
        <Button
          variant="outlined"
          onClick={onClose}
          fullWidth
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 2,
            "&:hover": {
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderColor: theme.palette.text.disabled,
            },
          }}>
          Close
        </Button>
      </Paper>
    )
  }

  const statusInfo = getStatusInfo(caseDetails.assignmentStatus)
  const isOverdue = caseDetails.dueDate && isBefore(parseISO(caseDetails.dueDate), new Date())
  const canLaunch = ["not_started", "in_progress"].includes(caseDetails.assignmentStatus)

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          p: spacing.lg,
          borderBottom: 1,
          borderColor: theme.palette.divider,
          background: theme.palette.background.default,
          flexShrink: 0,
        }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flexGrow: 1, pr: spacing.lg }}>
            <Typography
              variant="overline"
              sx={{
                ...typography.caption,
                color: theme.palette.secondary.main,
                display: "block",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                lineHeight: 1,
                mb: spacing.xs,
              }}>
              Case Overview
            </Typography>

            <Typography
              variant="h6"
              sx={{
                ...typography.h3,
                color: theme.palette.text.primary,
                mb: spacing.lg,
              }}>
              {caseDetails.title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                ...typography.body1,
                color: theme.palette.text.secondary,
                mb: spacing.lg,
              }}>
              Click to explore case details and learning objectives
            </Typography>

            <Box sx={{ display: "flex", gap: spacing.md, flexWrap: "wrap" }}>
              <Chip
                icon={<statusInfo.icon sx={{ fontSize: "0.8rem !important" }} />}
                label={statusInfo.label}
                size="small"
                sx={{
                  bgcolor: alpha(statusInfo.color, 0.1),
                  color: statusInfo.color,
                  border: `1px solid ${alpha(statusInfo.color, 0.2)}`,
                  ...typography.caption,
                  height: 24,
                  "& .MuiChip-label": { px: spacing.md },
                }}
              />

              {caseDetails.dueDate && (
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: "0.8rem !important" }} />}
                  label={format(parseISO(caseDetails.dueDate), "MMM d, yyyy")}
                  size="small"
                  sx={{
                    bgcolor: isOverdue
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.text.secondary, 0.1),
                    color: isOverdue ? theme.palette.primary.main : theme.palette.text.secondary,
                    border: `1px solid ${alpha(isOverdue ? theme.palette.primary.main : theme.palette.text.secondary, 0.2)}`,
                    ...typography.caption,
                    height: 24,
                    "& .MuiChip-label": { px: spacing.md },
                  }}
                />
              )}
            </Box>
          </Box>

          <Button
            variant="text"
            onClick={onClose}
            sx={{
              minWidth: 32,
              width: 32,
              height: 32,
              p: 0,
              borderRadius: 1.5,
              color: theme.palette.text.secondary,
              "&:hover": {
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                color: theme.palette.text.secondary,
              },
            }}>
            <CloseIcon sx={{ fontSize: "1.1rem" }} />
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column" }}>
        {/* Case Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <Card
            elevation={0}
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              background: "white",
            }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 2,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}>
                <CaseIcon sx={{ color: theme.palette.secondary.main, fontSize: "1.1rem" }} />
                Case Information
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 3,
                  lineHeight: 1.6,
                  fontSize: "0.9rem",
                }}>
                {caseDetails.description}
              </Typography>

              {/* Enhanced Learning Objectives Section */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.secondary.light, 0.15)}`,
                  mb: 3,
                }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    mb: 2,
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  <SchoolIcon sx={{ color: theme.palette.secondary.light, fontSize: "1rem" }} />
                  Learning Objectives
                </Typography>

                {/* Enhanced Learning Objectives */}
                {caseDetails.learning_objectives && caseDetails.learning_objectives.length > 0 && (
                  <List dense sx={{ pl: 0, py: 0 }}>
                    {caseDetails.learning_objectives.slice(0, 5).map((objective, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}>
                        <ListItem sx={{ py: 0.75, pl: 0, alignItems: "flex-start" }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                            <CheckCircleIcon sx={{ color: theme.palette.secondary.light, fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={objective}
                            primaryTypographyProps={{
                              variant: "body2",
                              color: "text.secondary",
                              sx: {
                                lineHeight: 1.5,
                                fontSize: "0.85rem",
                                fontWeight: 500,
                              },
                            }}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                    {caseDetails.learning_objectives.length > 5 && (
                      <ListItem sx={{ py: 0.75, pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <InfoIcon sx={{ color: "text.disabled", fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`+${caseDetails.learning_objectives.length - 5} additional objectives`}
                          primaryTypographyProps={{
                            variant: "body2",
                            color: "text.disabled",
                            sx: {
                              lineHeight: 1.5,
                              fontSize: "0.85rem",
                              fontStyle: "italic",
                            },
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                )}
              </Box>

              {/* Enhanced Case Details */}
              {caseDetails.content && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.divider, 0.3),
                    border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                  }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      mb: 1.5,
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}>
                    <InfoIcon sx={{ color: theme.palette.secondary.main, fontSize: "1rem" }} />
                    Simulation Details
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.85rem",
                      lineHeight: 1.6,
                      fontWeight: 500,
                    }}>
                    Interactive virtual patient simulation designed to test clinical reasoning,
                    diagnostic skills, and patient communication in a realistic healthcare
                    environment. Your performance will be evaluated based on your diagnostic
                    accuracy and patient interaction quality.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Spacer to push button to bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Action Button - Spaced at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {canLaunch && (
              <Button
                variant="contained"
                startIcon={
                  isLaunching ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PlayArrowIcon sx={{ fontSize: "1.1rem" }} />
                  )
                }
                onClick={() => onLaunch(caseDetails.assignmentId)}
                disabled={isLaunching}
                fullWidth
                sx={{
                  bgcolor: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                    transform: "translateY(-1px)",
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  height: 48,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}>
                {isLaunching
                  ? "Launching Session..."
                  : caseDetails.assignmentStatus === "not_started"
                    ? "Launch Virtual Patient"
                    : "Continue Virtual Patient"}
              </Button>
            )}

            {!canLaunch && caseDetails.assignmentStatus === "reviewed" && (
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon sx={{ fontSize: "1rem" }} />}
                onClick={onClose}
                fullWidth
                sx={{
                  color: theme.palette.secondary.light,
                  borderColor: theme.palette.secondary.light,
                  height: 48,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.light, 0.08),
                    borderColor: theme.palette.secondary.main,
                    transform: "translateY(-1px)",
                  },
                }}>
                Case Completed
              </Button>
            )}

            {!canLaunch && caseDetails.assignmentStatus === "submitted" && (
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon sx={{ fontSize: "1rem" }} />}
                onClick={onClose}
                fullWidth
                sx={{
                  color: theme.palette.secondary.main,
                  borderColor: theme.palette.secondary.main,
                  height: 48,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    borderColor: theme.palette.primary.light,
                    transform: "translateY(-1px)",
                  },
                }}>
                Awaiting Review
              </Button>
            )}
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}
