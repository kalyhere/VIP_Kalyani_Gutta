import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  alpha,
} from "@mui/material"
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  Lightbulb as InsightIcon,
  ErrorOutline as UnacceptableIcon,
  Build as ImprovementIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Assessment as AssessmentIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
} from "@mui/icons-material"
import { format } from "date-fns"
import { useTheme } from "@mui/material/styles"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
// Define UA Brand Colors (Should be here)

// --- Define AISPE Data Structures ---
interface AISPESectionFeedback {
  section_title: string
  strengths: string
  weaknesses: string
  overall_feedback: string
}

interface AISPEReportData {
  // Ensure this uses the new structure
  feedback_sections: AISPESectionFeedback[]
  general_summary?: string
}

// Reuse interfaces or define more specific ones if needed
interface APICase {
  id: number
  title: string
  description: string
}

interface RubricItem {
  output: string | null
  criteria: string | null
  explanation: string | null
  line_nums: number[]
  lines: string[]
  section_title: string | null
}

// Expanded APIReport interface based on AIMHEI structure
interface APIReport {
  total_points_earned: number | null
  total_points_possible: number | null
  percentage_score: number | null
  information_section_score: number | null
  skill_section_score: number | null
  medical_terminology_score: number | null
  politeness_score: number | null
  empathy_score: number | null
  unacceptable_areas: string[] | null
  improvement_areas: string[] | null
  section_summaries: Record<string, any> | null // Can be more specific if structure is known
  rubric_detail?: RubricItem[] | null // Added rubric_detail based on old component
  status?: string // Status might still be present, keep optional
}

// Interface for the expected response from the specific report endpoint
export interface CompletedReportDetailItem {
  report_id: number
  session_id: number
  case_title: string
  updated_at: string
  percentage_score?: number | null
  total_points_earned?: number | null
  total_points_possible?: number | null
  information_section_score?: number | null
  skill_section_score?: number | null
  medical_terminology_score?: number | null
  politeness_score?: number | null
  empathy_score?: number | null
  unacceptable_areas?: string[] | null
  improvement_areas?: string[] | null
  section_summaries?: { [key: string]: any } | null
  rubric_detail?: RubricItem[] | null
  aispe_report_data?: AISPEReportData // Ensure this uses the updated AISPEReportData
  percentile_rank?: number | null
  strengths_weaknesses?: {
    [sectionTitle: string]: { strengths: string; weaknesses: string; coaching_tips: string }
  } | null
}

// --- Color Palette --- (Define nicer colors)
const getScoreColors = (theme: any) => ({
  // Re-apply UA Colors
  success: theme.palette.secondary.main,
  warning: theme.palette.secondary.light,
  error: theme.palette.primary.main,
  info: theme.palette.text.disabled,
})

// Helper function to format score as percentage string
const formatScore = (score: number | null): string => {
  if (score === null || typeof score !== "number") return "N/A"
  // Assuming score is 0-100 from this endpoint based on old component
  return `${Math.round(score)}%`
}

// Helper function to determine score color
const getScoreColor = (score: number | null, theme: any): string => {
  // Re-apply logic using theme palette
  const scoreColors = getScoreColors(theme)
  if (score === null || typeof score !== "number") return scoreColors.info
  // Assuming score is 0-100
  const numericScore = score
  if (numericScore >= 90) return scoreColors.success
  if (numericScore >= 70) return scoreColors.warning
  return scoreColors.error
}

// Helper component for displaying a score section
interface ScoreSectionProps {
  title: string
  score: number | null
  icon: React.ReactElement
}

const ScoreSection: React.FC<ScoreSectionProps> = ({ title, score, icon }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}>
      <ListItemIcon sx={{ minWidth: "auto", color: getScoreColor(score, theme) }}>
        {React.cloneElement(icon, { sx: { fontSize: 32 } })}
      </ListItemIcon>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: "medium", color: getScoreColor(score, theme) }}>
          {formatScore(score)}
        </Typography>
        {score !== null && (
          <LinearProgress
            variant="determinate"
            value={score * 100}
            color={score * 100 >= 90 ? "success" : score * 100 >= 70 ? "warning" : "error"}
            sx={{ height: 6, borderRadius: 3, mt: 1 }}
          />
        )}
      </Box>
    </Paper>
  )
}

// Helper component for displaying feedback lists
interface FeedbackListProps {
  title: string
  items: string[] | null
  icon: React.ReactElement
  severity: "error" | "warning" | "info"
  emptyText: string
}

const FeedbackList: React.FC<FeedbackListProps> = ({ title, items, icon, severity, emptyText }) => {
  const theme = useTheme()
  const scoreColors = getScoreColors(theme)

  return (
    // Re-apply UA styles: Use Paper with subtle background and border based on UA colors
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`, // Subtle UA border
        borderRadius: 1,
        bgcolor: alpha(theme.palette.divider, 0.2), // Subtle UA background
      }}>
      {/* Ensure icon/title color uses updated scoreColors */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, color: scoreColors[severity] }}>
        {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
          {title}
        </Typography>
      </Box>
      {items && items.length > 0 ? (
        <List dense disablePadding sx={{ pl: 1 }}>
          {" "}
          {/* Add padding left */}
          {items.map((item, index) => (
            <ListItem key={index} disableGutters sx={{ alignItems: "flex-start", py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 30, mt: 0.5 }}>
                {" "}
                {/* Adjust margin top */}
                {/* Use a simple dot or number instead of Chip */}
                <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                  {index + 1}
.
</Box>
              </ListItemIcon>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ variant: "body2", lineHeight: 1.4 }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 1 }}>
          {emptyText}
        </Typography>
      )}
    </Paper>
  )
}

// Helper function to group rubric items by section (moved outside component)
const groupRubricBySection = (
  rubricDetail: RubricItem[] | null | undefined,
): Record<string, RubricItem[]> => {
  if (!rubricDetail) return {}
  return rubricDetail.reduce(
    (acc, item) => {
      const section = item.section_title || "Uncategorized"
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(item)
      return acc
    },
    {} as Record<string, RubricItem[]>,
  )
}

// Simplified Score Item component for use in a grid
interface ScoreItemProps {
  title: string
  score: number | null
  icon?: React.ReactElement
}

const getScoreSeverity = (score: number | null): "success" | "warning" | "error" | "info" => {
  if (score === null) return "info"
  const numericScore = score
  if (numericScore >= 90) return "success"
  if (numericScore >= 70) return "warning"
  return "error"
}

const ScoreItem: React.FC<ScoreItemProps> = ({ title, score, icon }) => {
  const theme = useTheme()
  const scoreColors = getScoreColors(theme)
  const severity = getScoreSeverity(score)
  // Use the new color palette
  const color = severity === "info" ? theme.palette.text.secondary : scoreColors[severity]

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "medium",
            color, // Apply the calculated color
          }}>
          {formatScore(score)}
        </Typography>
        {score !== null && (
          <LinearProgress
            variant="determinate"
            value={score} // Assuming 0-100
            sx={{
              height: 4,
              borderRadius: 2,
              mt: 0.5,
              bgcolor: theme.palette.grey[200],
              // Use new palette for progress bar
              "& .MuiLinearProgress-bar": {
                backgroundColor:
                  severity === "info" ? theme.palette.grey[400] : scoreColors[severity],
              },
            }}
          />
        )}
      </Box>
      {icon && (
        <ListItemIcon sx={{ minWidth: "auto", color: getScoreColor(score, theme) }}>
          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        </ListItemIcon>
      )}
    </Box>
  )
}

// Re-introducing a compact ScoreItem display logic specifically for the header
const CompactScoreItem: React.FC<{ title: string; score: number | null }> = ({ title, score }) => {
  const theme = useTheme()
  const scoreColors = getScoreColors(theme)
  const severity = getScoreSeverity(score)
  const color = severity === "info" ? theme.palette.text.secondary : scoreColors[severity]

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
      <Tooltip title={title} placement="top">
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ maxWidth: "calc(100% - 50px)", mr: 1 }}>
          {title}
        </Typography>
      </Tooltip>
      <Typography
        variant="caption"
        sx={{ fontWeight: "medium", color, minWidth: "40px", textAlign: "right" }}>
        {formatScore(score)}
      </Typography>
    </Box>
  )
}

// --- TabPanel Helper Component ---
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}>
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {" "}
          {/* Add padding top to tab content */}
          {children}
        </Box>
      )}
    </Box>
  )
}

// Update the props interface
interface ReportDetailProps {
  mockReportDataSource: CompletedReportDetailItem
  onFieldEdit?: (field: keyof CompletedReportDetailItem, value: any) => void
  showDetailedPerformance?: boolean
  customOverviewContent?: React.ReactNode
  highlightedImprovementSection?: string | null
  onClearHighlight?: () => void
}

export const ReportDetail: React.FC<ReportDetailProps> = ({
  mockReportDataSource,
  onFieldEdit,
  showDetailedPerformance = true,
  customOverviewContent,
  highlightedImprovementSection,
  onClearHighlight,
}) => {
  const theme = useTheme()
  const scoreColors = getScoreColors(theme)
  const [tabValue, setTabValue] = useState(0)
  const [editMode, setEditMode] = useState(false)

  // State for Areas for Improvement section (moved to top level to follow Rules of Hooks)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [flashingSection, setFlashingSection] = useState<string | null>(null)

  // Use the provided data directly
  const report = mockReportDataSource
  const caseInfo = { title: report.case_title }

  // Process Rubric Details
  const groupedRubric = groupRubricBySection(report.rubric_detail)

  const overallScoreSeverity = getScoreSeverity(report.percentage_score ?? null)
  const overallScoreColor =    overallScoreSeverity === "info"
      ? theme.palette.text.secondary
      : scoreColors[overallScoreSeverity]

  function a11yProps(index: number) {
    return {
      id: `report-tab-${index}`,
      "aria-controls": `report-tabpanel-${index}`,
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const radarChartData = [
    { subject: "Info Gathering", score: report.information_section_score ?? 0, fullMark: 100 },
    { subject: "Clinical Skills", score: report.skill_section_score ?? 0, fullMark: 100 },
    { subject: "Medical Terminology", score: report.medical_terminology_score ?? 0, fullMark: 100 },
    { subject: "Politeness/Prof.", score: report.politeness_score ?? 0, fullMark: 100 },
    { subject: "Empathy/Rapport", score: report.empathy_score ?? 0, fullMark: 100 },
  ].map((item) => ({ ...item, score: Math.round(item.score) }))

  // Handle highlighted improvement section (moved to top level to follow Rules of Hooks)
  useEffect(() => {
    if (highlightedImprovementSection) {
      // Expand the section
      setExpandedSections((prev) =>
        prev.includes(highlightedImprovementSection)
          ? prev
          : [...prev, highlightedImprovementSection],
      )

      // Scroll to it
      setTimeout(() => {
        const element = document.getElementById(
          `improvement-${highlightedImprovementSection}`,
        )
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })

          // Trigger flash animation
          setFlashingSection(highlightedImprovementSection)
          setTimeout(() => {
            setFlashingSection(null)
            onClearHighlight?.()
          }, 2000)
        }
      }, 100)
    }
  }, [highlightedImprovementSection, onClearHighlight])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1.5,
          pb: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          flexShrink: 0, // Prevent header from shrinking
        }}>
        <Box sx={{ flex: 1, minWidth: 0, pr: 3 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: "bold",
              mb: 0.25,
              fontSize: "1.25rem",
              lineHeight: 1.2,
            }}>
            {caseInfo.title}
{' '}
Report
</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: "0.75rem",
              fontWeight: 400,
            }}>
            <CalendarIcon sx={{ fontSize: "0.875rem", color: theme.palette.text.secondary }} />
            Completed: {format(new Date(report.updated_at), "MMM d, yyyy h:mm a")}
          </Typography>
        </Box>
      </Box>

      {/* Performance Overview Section - Two Cards Side by Side */}
      <Box
        sx={{
          flexShrink: 0,
          mb: 2.5,
          "@media print": {
            breakInside: "avoid",
            pageBreakInside: "avoid",
            marginBottom: 2,
          },
        }}>
        <Grid
          container
          spacing={2}
          alignItems="stretch"
          sx={{
            width: "100%",
            "@media print": {
              breakInside: "avoid",
              pageBreakInside: "avoid",
              spacing: 2,
              display: "flex",
              flexWrap: "nowrap",
            },
          }}>
          {/* Left: Performance Metrics */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: "flex",
              "@media print": {
                breakInside: "avoid",
                pageBreakInside: "avoid",
              },
            }}>
            <Box
              sx={{
                width: "100%",
                bgcolor: "white",
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                boxShadow: `0 1px 3px ${alpha(theme.palette.text.primary, 0.04)}`,
                display: "flex",
                flexDirection: "column",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: "fadeInUp 0.5s ease-out",
                "@keyframes fadeInUp": {
                  from: {
                    opacity: 0,
                    transform: "translateY(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
                "&:hover": {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.08)}`,
                  borderColor: alpha(theme.palette.secondary.main, 0.15),
                  transform: "translateY(-2px)",
                },
                "@media print": {
                  minHeight: "auto",
                  height: "auto",
                  maxHeight: "none",
                  boxShadow: "none",
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  animation: "none",
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
                },
              }}>
              {/* Minimal Header */}
              <Box
                sx={{
                  px: 2.5,
                  pt: 2.5,
                  pb: 1,
                }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.primary.light, 0.7),
                    fontSize: "0.6875rem",
                    letterSpacing: 1.5,
                    display: "block",
                  }}>
                  Performance Metrics
                </Typography>
              </Box>
              {/* Content */}
              <Box
                sx={{
                  px: 2.5,
                  pb: 2.5,
                  pt: 0.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  "@media print": {
                    gap: 1.5,
                    pt: 1.5,
                    pb: 2,
                  },
                }}>
                {/* Overall Score - Simple prominent box */}
                <Box
                  sx={{
                    textAlign: "center",
                    py: 2.5,
                    px: 2,
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    borderRadius: 2,
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: alpha(theme.palette.secondary.main, 0.5),
                      bgcolor: alpha(theme.palette.secondary.main, 0.18),
                    },
                  }}>
                  <Typography
                    variant="overline"
                    display="block"
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: 1.2,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}>
                    Overall Score
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.secondary.main,
                      lineHeight: 1,
                      fontSize: "3rem",
                      mb: 0.5,
                      animation: "countUp 0.8s ease-out",
                      "@keyframes countUp": {
                        from: {
                          opacity: 0,
                          transform: "scale(0.5)",
                        },
                        to: {
                          opacity: 1,
                          transform: "scale(1)",
                        },
                      },
                      "@media print": {
                        animation: "none",
                      },
                    }}>
                    {formatScore(report.percentage_score ?? null)}
                  </Typography>
                  {report.percentile_rank !== null && report.percentile_rank !== undefined && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.secondary.main,
                        fontWeight: 500,
                        fontSize: "0.75rem",
                        display: "block",
                      }}>
                      Top {(100 - report.percentile_rank).toFixed(0)}% Percentile
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ borderColor: alpha(theme.palette.primary.light, 0.2) }} />

                {/* Key Metrics Grid */}
                <Grid container spacing={1.5} sx={{ width: "100%" }}>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 1.25,
                        px: 1,
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          borderColor: alpha(theme.palette.text.primary, 0.2),
                          bgcolor: alpha(theme.palette.text.primary, 0.06),
                        },
                      }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          color: theme.palette.text.primary,
                          fontSize: "1.375rem",
                          mb: 0.25,
                        }}>
                        {formatScore(report.information_section_score ?? null)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.625rem", fontWeight: 500 }}>
                        Clinical Knowledge
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 1.25,
                        px: 1,
                        bgcolor: alpha(theme.palette.secondary.light, 0.04),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.secondary.light, 0.12)}`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          borderColor: alpha(theme.palette.secondary.light, 0.2),
                          bgcolor: alpha(theme.palette.secondary.light, 0.06),
                        },
                      }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          color: theme.palette.secondary.light,
                          fontSize: "1.375rem",
                          mb: 0.25,
                        }}>
                        {formatScore(report.skill_section_score ?? null)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.625rem", fontWeight: 500 }}>
                        Communication Skills
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>

          {/* Right: Competency Analysis Radar - Now Larger */}
          <Grid
            size={{ xs: 12, md: 7 }}
            sx={{
              display: "flex",
              "@media print": {
                breakInside: "avoid",
                pageBreakInside: "avoid",
              },
            }}>
            <Box
              sx={{
                width: "100%",
                bgcolor: "white",
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                boxShadow: `0 1px 3px ${alpha(theme.palette.text.primary, 0.04)}`,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                animation: "fadeInUp 0.5s ease-out 0.1s backwards",
                "@keyframes fadeInUp": {
                  from: {
                    opacity: 0,
                    transform: "translateY(20px)",
                  },
                  to: {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
                "&:hover": {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.08)}`,
                  borderColor: alpha(theme.palette.secondary.main, 0.15),
                  transform: "translateY(-2px)",
                },
                "@media print": {
                  minHeight: "320px",
                  height: "auto",
                  maxHeight: "none",
                  boxShadow: "none",
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  animation: "none",
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
                },
              }}>
              {/* Minimal Chart Header */}
              <Box
                sx={{
                  px: 2.5,
                  pt: 2.5,
                  pb: 1,
                }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.primary.light, 0.7),
                    fontSize: "0.6875rem",
                    letterSpacing: 1.5,
                    display: "block",
                  }}>
                  Performance Overview
                </Typography>
              </Box>
              {/* Chart */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2,
                  pb: 2,
                  pt: 0.5,
                  "@media print": {
                    height: "280px",
                    pb: 2,
                  },
                }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="85%"
                    data={radarChartData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                    <PolarGrid
                      stroke={alpha(theme.palette.primary.light, 0.25)}
                      strokeWidth={1.5}
                      gridType="polygon"
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: theme.palette.text.primary,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{
                        fill: theme.palette.text.secondary,
                        fontSize: 11,
                      }}
                    />
                    <Radar
                      name={caseInfo.title}
                      dataKey="score"
                      stroke={theme.palette.secondary.main}
                      fill={theme.palette.secondary.main}
                      fillOpacity={0.4}
                      strokeWidth={1.5}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.98)",
                        border: `2px solid ${theme.palette.secondary.main}`,
                        borderRadius: 8,
                        fontSize: "0.85rem",
                        padding: "10px 14px",
                        boxShadow: `0 4px 12px ${alpha(theme.palette.text.primary, 0.15)}`,
                        fontWeight: 500,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Strengths & Weaknesses Analysis Section */}
      {/* Dynamic Content Section - Rubric or other content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}>
        {customOverviewContent}
      </Box>

      {/* Areas for Improvement Section - After Rubric */}
      {report.strengths_weaknesses
        && Object.keys(report.strengths_weaknesses).length > 0
        && (() => {
          // Use state from outer scope (declared at top level)

          const expandAll = () => {
            setExpandedSections(Object.keys(report.strengths_weaknesses || {}))
          }

          const collapseAll = () => {
            setExpandedSections([])
          }

          const toggleSection = (sectionKey: string) => {
            setExpandedSections((prev) =>
              prev.includes(sectionKey)
                ? prev.filter((key) => key !== sectionKey)
                : [...prev, sectionKey],
            )
          }

          return (
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                boxShadow: `0 1px 3px ${alpha(theme.palette.text.primary, 0.04)}`,
                bgcolor: "white",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.08)}`,
                  borderColor: alpha(theme.palette.secondary.main, 0.15),
                },
              }}>
              {/* Section Header */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ImprovementIcon sx={{ color: theme.palette.secondary.main }} />
                  <Typography variant="h6" fontWeight="medium">
                    Areas for Improvement
                  </Typography>
                </Box>
              </Box>

              <TableContainer
                sx={{
                  overflowX: "auto",
                }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", minWidth: 200 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 0 }}>
                            <Tooltip title="Expand All Sections">
                              <IconButton
                                size="small"
                                onClick={expandAll}
                                sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                                <ExpandAllIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Collapse All Sections">
                              <IconButton
                                size="small"
                                onClick={collapseAll}
                                sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                                <CollapseAllIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          Section
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(report.strengths_weaknesses).map(([sectionTitle, data]) => {
                      const isExpanded = expandedSections.includes(sectionTitle)

                      return (
                        <React.Fragment key={sectionTitle}>
                          {/* Section Header Row */}
                          <TableRow
                            hover
                            sx={{
                              cursor: "pointer",
                              position: isExpanded ? "sticky" : "static",
                              top: isExpanded ? 37 : "auto",
                              zIndex: isExpanded ? 10 : "auto",
                              bgcolor: "white",
                              "@keyframes flashHighlight": {
                                "0%, 100%": { bgcolor: "transparent" },
                                "50%": { bgcolor: alpha(theme.palette.secondary.main, 0.2) },
                              },
                              animation:
                                flashingSection === sectionTitle
                                  ? "flashHighlight 0.5s ease-in-out 3"
                                  : "none",
                            }}
                            onClick={() => toggleSection(sectionTitle)}
                            id={`improvement-${sectionTitle}`}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ExpandMoreIcon
                                  sx={{
                                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                    fontSize: "1rem",
                                  }}
                                />
                                <Typography variant="body2" fontWeight="medium">
                                  {sectionTitle}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <>
                              {/* Sub-header row */}
                              <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08) }}>
                                <TableCell
                                  sx={{
                                    pl: 4,
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.secondary.main,
                                    width: "20%",
                                  }}>
                                  Category
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                    color: theme.palette.secondary.main,
                                  }}>
                                  Feedback
                                </TableCell>
                              </TableRow>

                              {/* Strengths Row */}
                              {data.strengths && (
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                  <TableCell sx={{ pl: 4 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontWeight="bold">
                                      Strengths
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {data.strengths}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}

                              {/* Areas to Improve Row */}
                              {data.weaknesses && (
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                  <TableCell sx={{ pl: 4 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontWeight="bold">
                                      Areas to Improve
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {data.weaknesses}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}

                              {/* Coaching Tips Row */}
                              {data.coaching_tips && (
                                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                  <TableCell sx={{ pl: 4 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontWeight="bold">
                                      Coaching Tips
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {data.coaching_tips}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )
        })()}
    </Box>
  )
}

// Add default export
export default ReportDetail
