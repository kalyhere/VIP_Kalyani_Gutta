import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Container,
  alpha,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material"
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Computer as ComputerIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
} from "@mui/icons-material"
import { format, parseISO, isAfter, isBefore, subDays, subMonths } from "date-fns"
import { Link } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { useTheme } from "@mui/material/styles"
import { motion, AnimatePresence } from "framer-motion"
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

// Enhanced interfaces based on aimhei_reports schema
interface AIMHEIReportItem {
  id: number
  report_name: string | null
  ai_model: string | null
  hcp_name: string | null
  hcp_year: string | null
  patient_id: string | null
  interview_date: string | null
  human_supervisor: string | null
  aispe_location: string | null
  percentage_score: number | null
  information_section_score: number | null
  skill_section_score: number | null
  medical_terminology_score: number | null
  politeness_score: number | null
  empathy_score: number | null
  report_type: "virtual_patient" | "standalone"
  created_at: string
  updated_at: string
  session_id: number | null
  case_title?: string // For virtual_patient reports
}

// Filter types
type ReportTypeFilter = "all" | "virtual_patient" | "standalone"
type ScoreFilter = "all" | "high" | "medium" | "low"
type DateFilter = "all" | "recent" | "last_3_months" | "older"

// Chart data interface
interface ChartDataPoint {
  date: string
  overallScore: number | null
  infoScore: number | null
  skillScore: number | null
  medTermScore: number | null
  politenessScore: number | null
  empathyScore: number | null
}

// Create a motion-compatible version of MUI Box
const MotionBox = motion.create(Box)
const MotionCard = motion.create(Card)

export const ReportHistory: React.FC = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<AIMHEIReportItem[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTypeFilter>("all")
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

  // Actions menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: "success" | "error"
  }>({
    open: false,
    message: "",
    severity: "success",
  })

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch all AIMHEI reports (both virtual_patient and standalone)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/aimhei-reports/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Failed to fetch reports." }))
          throw new Error(errorData.detail || "Failed to fetch reports")
        }

        const data = await response.json()

        // Ensure data is an array
        const reportsArray: AIMHEIReportItem[] = Array.isArray(data) ? data : []
        setReports(reportsArray)

        // Prepare data for the multi-line chart
        const sortedData = reportsArray
          .filter((item) => item.percentage_score !== null)
          .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())

        const formattedChartData: ChartDataPoint[] = sortedData.map((item) => {
          const getScore = (score: number | null | undefined): number | null =>
            score === null || score === undefined ? null : Math.round(score)
          return {
            date: format(new Date(item.updated_at), "MMM d"),
            overallScore: getScore(item.percentage_score),
            infoScore: getScore(item.information_section_score),
            skillScore: getScore(item.skill_section_score),
            medTermScore: getScore(item.medical_terminology_score),
            politenessScore: getScore(item.politeness_score),
            empathyScore: getScore(item.empathy_score),
          }
        })

        setChartData(formattedChartData)
      } catch (err) {
        console.error("Error fetching reports:", err)
        setError(err instanceof Error ? err.message : "Failed to load reports")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Filter logic
  const filteredReports = useMemo(() => {
    // Ensure reports is an array
    if (!Array.isArray(reports)) {
      return []
    }

    let filtered = reports

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.report_name?.toLowerCase().includes(term) ||
          report.patient_id?.toLowerCase().includes(term) ||
          report.hcp_name?.toLowerCase().includes(term) ||
          report.case_title?.toLowerCase().includes(term) ||
          report.ai_model?.toLowerCase().includes(term)
      )
    }

    // Report type filter
    if (reportTypeFilter !== "all") {
      filtered = filtered.filter((report) => report.report_type === reportTypeFilter)
    }

    // Score filter
    if (scoreFilter !== "all") {
      filtered = filtered.filter((report) => {
        if (report.percentage_score === null) return false
        switch (scoreFilter) {
          case "high":
            return report.percentage_score >= 80
          case "medium":
            return report.percentage_score >= 60 && report.percentage_score < 80
          case "low":
            return report.percentage_score < 60
          default:
            return true
        }
      })
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.updated_at)
        switch (dateFilter) {
          case "recent":
            return isAfter(reportDate, subDays(now, 30))
          case "last_3_months":
            return isAfter(reportDate, subMonths(now, 3)) && isBefore(reportDate, subDays(now, 30))
          case "older":
            return isBefore(reportDate, subMonths(now, 3))
          default:
            return true
        }
      })
    }

    // Sort by updated_at (most recent first)
    return filtered.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [reports, searchTerm, reportTypeFilter, scoreFilter, dateFilter])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (e) {
      return "Invalid Date"
    }
  }

  const formatScore = (score: number | null) => {
    if (score === null || typeof score !== "number") return "N/A"
    return `${Math.round(score)}%`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return theme.palette.text.disabled
    if (score >= 80) return theme.palette.secondary.light
    if (score >= 60) return theme.palette.secondary.main
    return theme.palette.primary.main
  }

  const getReportTypeInfo = (type: string) => {
    switch (type) {
      case "virtual_patient":
        return { label: "Virtual Patient", color: theme.palette.secondary.main, icon: ComputerIcon }
      case "standalone":
        return { label: "Standalone", color: theme.palette.secondary.light, icon: AssignmentIcon }
      default:
        return { label: "Unknown", color: theme.palette.text.disabled, icon: AssignmentIcon }
    }
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setReportTypeFilter("all")
    setScoreFilter("all")
    setDateFilter("all")
  }

  const hasActiveFilters =
    searchTerm || reportTypeFilter !== "all" || scoreFilter !== "all" || dateFilter !== "all"

  // Actions menu handlers
  const handleActionsClick = (event: React.MouseEvent<HTMLElement>, reportId: number) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedReportId(reportId)
  }

  const handleActionsClose = () => {
    setAnchorEl(null)
    setSelectedReportId(null)
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
    handleActionsClose()
  }

  const handleDeleteConfirm = async () => {
    if (!selectedReportId) return

    setDeleting(true)
    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/aimhei-reports/${selectedReportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to delete report")
      }

      // Remove the report from the state
      setReports((prev) => prev.filter((report) => report.id !== selectedReportId))

      setSnackbar({
        open: true,
        message: "Report deleted successfully",
        severity: "success",
      })
    } catch (error) {
      console.error("Error deleting report:", error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to delete report",
        severity: "error",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedReportId(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setSelectedReportId(null)
  }

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // Define colors for chart lines
  const lineColors = {
    overall: theme.palette.primary.main,
    info: theme.palette.secondary.main,
    skill: "#ffc107",
    medTerm: "#4caf50",
    politeness: "#2979ff",
    empathy: "#ab47bc",
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: spacing.lg, height: "95vh", display: "flex", flexDirection: "column" }}>
      {/* Enhanced Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 1.5,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
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
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
          },
        }}>
        <Box sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
              }}>
              <AssignmentIcon sx={{ fontSize: 20, color: "white" }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: 0.125,
                  fontSize: "1.1rem",
                }}>
                My Reports
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                AIMHEI Analysis History
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}>
        {/* Search and Filter Section */}
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
            {/* Search Bar */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by report name, patient ID, HCP name, or case title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.text.disabled }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setSearchTerm("")}
                          sx={{ minWidth: "auto", p: 0.5 }}>
                          <ClearIcon sx={{ fontSize: "1rem" }} />
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper,
                    "& fieldset": {
                      borderColor: alpha(theme.palette.divider, 0.5),
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                }}
              />
            </Box>

            {/* Filter Controls */}
            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}>
              {/* Report Type Filter */}
              <Box>
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
                  Report Type
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {[
                    { value: "all", label: "All" },
                    { value: "virtual_patient", label: "Virtual Patient" },
                    { value: "standalone", label: "Standalone" },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      size="small"
                      variant={reportTypeFilter === type.value ? "contained" : "outlined"}
                      onClick={() => setReportTypeFilter(type.value as ReportTypeFilter)}
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
                        ...(reportTypeFilter === type.value
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
                      {type.label}
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Score Filter */}
              <Box>
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
                  Score Range
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {[
                    { value: "all", label: "All" },
                    { value: "high", label: "High (≥80%)" },
                    { value: "medium", label: "Medium (60-79%)" },
                    { value: "low", label: "Low (<60%)" },
                  ].map((score) => (
                    <Chip
                      key={score.value}
                      label={score.label}
                      clickable
                      size="small"
                      variant={scoreFilter === score.value ? "filled" : "outlined"}
                      onClick={() => setScoreFilter(score.value as ScoreFilter)}
                      sx={{
                        height: 32,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: 2,
                        transition: "all 0.2s ease-in-out",
                        "& .MuiChip-label": { px: 1.25 },
                        ...(scoreFilter === score.value
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

              {/* Date Filter */}
              <Box>
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
                  Date Range
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {[
                    { value: "all", label: "All" },
                    { value: "recent", label: "Recent (30 days)" },
                    { value: "last_3_months", label: "Last 3 months" },
                    { value: "older", label: "Older" },
                  ].map((date) => (
                    <Chip
                      key={date.value}
                      label={date.label}
                      clickable
                      size="small"
                      variant={dateFilter === date.value ? "filled" : "outlined"}
                      onClick={() => setDateFilter(date.value as DateFilter)}
                      sx={{
                        height: 32,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: 2,
                        transition: "all 0.2s ease-in-out",
                        "& .MuiChip-label": { px: 1.25 },
                        ...(dateFilter === date.value
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

              {/* Results & Clear */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 1,
                  ml: "auto",
                }}>
                <Box
                  sx={{
                    px: spacing.md,
                    py: 0,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  }}>
                  <Typography
                    sx={{
                      ...typography.caption,
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                    {filteredReports.length} of{reports.length} reports
                  </Typography>
                </Box>

                {hasActiveFilters && (
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      fontWeight: 500,
                      minWidth: "auto",
                      px: 1.5,
                      py: 0.5,
                      height: 32,
                      borderRadius: 1.5,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.divider, 0.5),
                      },
                    }}>
                    Clear All
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Charts Section */}
        {chartData.length >= 2 && (
          <Box sx={{ flexShrink: 0, px: 2, pb: 2 }}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
              }}>
              <Typography
                variant="subtitle1"
                sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
                Score Trends
              </Typography>
              <Box sx={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                      }}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line
                      name="Overall"
                      type="monotone"
                      dataKey="overallScore"
                      stroke={lineColors.overall}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Info Gathering"
                      type="monotone"
                      dataKey="infoScore"
                      stroke={lineColors.info}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Skills"
                      type="monotone"
                      dataKey="skillScore"
                      stroke={lineColors.skill}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Med Term"
                      type="monotone"
                      dataKey="medTermScore"
                      stroke={lineColors.medTerm}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Politeness"
                      type="monotone"
                      dataKey="politenessScore"
                      stroke={lineColors.politeness}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                    <Line
                      name="Empathy"
                      type="monotone"
                      dataKey="empathyScore"
                      stroke={lineColors.empathy}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Reports Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            p: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: alpha(theme.palette.divider, 0.3),
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: alpha(theme.palette.text.disabled, 0.5),
              borderRadius: "4px",
              "&:hover": {
                background: alpha(theme.palette.text.secondary, 0.7),
              },
            },
          }}>
          {reports.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <AssignmentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reports found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Complete virtual patient interviews or upload files for AIMHEI analysis to see
                reports here.
              </Typography>
            </Box>
          ) : filteredReports.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <FilterListIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reports match your filters
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your filter criteria or search terms.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.lg,
                pb: spacing.xxl,
              }}>
              <AnimatePresence>
                {filteredReports.map((report, index) => {
                  const reportTypeInfo = getReportTypeInfo(report.report_type)
                  const TypeIcon = reportTypeInfo.icon
                  const scoreColor = getScoreColor(report.percentage_score)

                  return (
                    <MotionCard
                      key={report.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.1, delay: index * 0.02 }}
                      elevation={0}
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        transition: "all 0.2s ease",
                        border: `1px solid ${alpha(reportTypeInfo.color, 0.3)}`,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.3)} 100%)`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.text.disabled, 0.08)}`,
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: `0 12px 32px ${alpha(theme.palette.text.disabled, 0.18)}`,
                          borderColor: alpha(reportTypeInfo.color, 0.6),
                        },
                      }}>
                      <CardContent sx={{ p: spacing.xl }}>
                        {/* Header */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            mb: spacing.lg,
                          }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                ...typography.h3,
                                color: theme.palette.text.primary,
                                lineHeight: 1.3,
                                mb: spacing.sm,
                              }}>
                              {report.report_name || report.case_title || `Report #${report.id}`}
                            </Typography>

                            {/* Type and Date */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: spacing.lg,
                                flexWrap: "wrap",
                              }}>
                              <Chip
                                icon={<TypeIcon sx={{ fontSize: "0.85rem !important" }} />}
                                label={reportTypeInfo.label}
                                size="medium"
                                sx={{
                                  bgcolor: alpha(reportTypeInfo.color, 0.1),
                                  color: reportTypeInfo.color,
                                  border: `1px solid ${alpha(reportTypeInfo.color, 0.3)}`,
                                  ...typography.body2,
                                  height: 32,
                                  fontWeight: 600,
                                  "& .MuiChip-label": { px: spacing.md },
                                }}
                              />

                              <Box sx={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                                <ScheduleIcon
                                  sx={{ color: theme.palette.text.secondary, fontSize: "1rem" }}
                                />
                                <Typography
                                  sx={{
                                    ...typography.body2,
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                  }}>
                                  {formatDate(report.updated_at)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Actions */}
                          <Box sx={{ display: "flex", gap: spacing.md, alignItems: "center" }}>
                            {report.percentage_score !== null && (
                              <Chip
                                label={formatScore(report.percentage_score)}
                                size="medium"
                                sx={{
                                  bgcolor: alpha(scoreColor, 0.1),
                                  color: scoreColor,
                                  border: `1px solid ${alpha(scoreColor, 0.3)}`,
                                  ...typography.body2,
                                  height: 42,
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  "& .MuiChip-label": { px: spacing.lg },
                                }}
                              />
                            )}

                            <Button
                              variant="contained"
                              startIcon={<AssessmentIcon sx={{ fontSize: "1rem" }} />}
                              component={Link}
                              to={`/reports/${report.id}`}
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
                                textDecoration: "none",
                                "&:hover": {
                                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                                  transform: "translateY(-2px)",
                                  boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.light, 0.4)}`,
                                },
                              }}>
                              View Report
                            </Button>

                            {/* Actions Menu */}
                            <IconButton
                              onClick={(e) => handleActionsClick(e, report.id)}
                              sx={{
                                color: theme.palette.text.secondary,
                                height: 42,
                                width: 42,
                                borderRadius: 2.5,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  color: theme.palette.primary.light,
                                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                                },
                              }}>
                              <MoreVertIcon fontSize="medium" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Content Row */}
                        <Box sx={{ display: "flex", gap: spacing.xl }}>
                          {/* Left Section - Report Details */}
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                p: spacing.lg,
                                borderRadius: 2.5,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: spacing.sm,
                                  mb: spacing.md,
                                }}>
                                <PersonIcon
                                  sx={{ fontSize: "1.1rem", color: theme.palette.text.secondary }}
                                />
                                <Typography
                                  sx={{
                                    ...typography.body1,
                                    color: theme.palette.text.secondary,
                                    fontWeight: 600,
                                  }}>
                                  Report Details
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                                  gap: spacing.md,
                                }}>
                                {report.hcp_name && (
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
                                      HCP Name
                                    </Typography>
                                    <Typography
                                      sx={{
                                        ...typography.body2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                      }}>
                                      {report.hcp_name}
                                    </Typography>
                                  </Box>
                                )}

                                {report.patient_id && (
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
                                      Patient ID
                                    </Typography>
                                    <Typography
                                      sx={{
                                        ...typography.body2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                      }}>
                                      {report.patient_id}
                                    </Typography>
                                  </Box>
                                )}

                                {report.ai_model && (
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
                                      AI Model
                                    </Typography>
                                    <Typography
                                      sx={{
                                        ...typography.body2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                      }}>
                                      {report.ai_model}
                                    </Typography>
                                  </Box>
                                )}

                                {report.hcp_year && (
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
                                      HCP Year
                                    </Typography>
                                    <Typography
                                      sx={{
                                        ...typography.body2,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                      }}>
                                      {report.hcp_year}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Box>

                          {/* Right Section - Score Breakdown */}
                          {(report.information_section_score ||
                            report.skill_section_score ||
                            report.medical_terminology_score ||
                            report.politeness_score ||
                            report.empathy_score) && (
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  p: spacing.lg,
                                  borderRadius: 2.5,
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
                                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                                }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: spacing.sm,
                                    mb: spacing.md,
                                  }}>
                                  <TimelineIcon
                                    sx={{ fontSize: "1.1rem", color: theme.palette.secondary.main }}
                                  />
                                  <Typography
                                    sx={{
                                      ...typography.body1,
                                      color: theme.palette.secondary.main,
                                      fontWeight: 600,
                                    }}>
                                    Score Breakdown
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                                    gap: spacing.sm,
                                  }}>
                                  {report.information_section_score && (
                                    <Box sx={{ textAlign: "center" }}>
                                      <Typography
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          mb: spacing.xs,
                                        }}>
                                        Info
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...typography.body2,
                                          color: getScoreColor(report.information_section_score),
                                          fontWeight: 600,
                                        }}>
                                        {formatScore(report.information_section_score)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {report.skill_section_score && (
                                    <Box sx={{ textAlign: "center" }}>
                                      <Typography
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          mb: spacing.xs,
                                        }}>
                                        Skills
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...typography.body2,
                                          color: getScoreColor(report.skill_section_score),
                                          fontWeight: 600,
                                        }}>
                                        {formatScore(report.skill_section_score)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {report.medical_terminology_score && (
                                    <Box sx={{ textAlign: "center" }}>
                                      <Typography
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          mb: spacing.xs,
                                        }}>
                                        Med Terms
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...typography.body2,
                                          color: getScoreColor(report.medical_terminology_score),
                                          fontWeight: 600,
                                        }}>
                                        {formatScore(report.medical_terminology_score)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {report.politeness_score && (
                                    <Box sx={{ textAlign: "center" }}>
                                      <Typography
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          mb: spacing.xs,
                                        }}>
                                        Politeness
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...typography.body2,
                                          color: getScoreColor(report.politeness_score),
                                          fontWeight: 600,
                                        }}>
                                        {formatScore(report.politeness_score)}
                                      </Typography>
                                    </Box>
                                  )}

                                  {report.empathy_score && (
                                    <Box sx={{ textAlign: "center" }}>
                                      <Typography
                                        sx={{
                                          ...typography.caption,
                                          color: theme.palette.text.secondary,
                                          mb: spacing.xs,
                                        }}>
                                        Empathy
                                      </Typography>
                                      <Typography
                                        sx={{
                                          ...typography.body2,
                                          color: getScoreColor(report.empathy_score),
                                          fontWeight: 600,
                                        }}>
                                        {formatScore(report.empathy_score)}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </MotionCard>
                  )
                })}
              </AnimatePresence>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionsClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPaper-root": {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: `0 8px 24px ${alpha(theme.palette.text.disabled, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          },
        }}>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            color: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            py: spacing.sm,
            px: spacing.md,
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}>
          <DeleteIcon fontSize="small" />
          <Typography sx={{ ...typography.body2, fontWeight: 500 }}>Delete Report</Typography>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            boxShadow: `0 20px 60px ${alpha(theme.palette.text.disabled, 0.3)}`,
          },
        }}>
        <DialogTitle
          sx={{
            ...typography.h3,
            color: theme.palette.text.primary,
            pb: spacing.sm,
          }}>
          Delete Report?
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              ...typography.body1,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}>
            Are you sure you want to delete this report? This action cannot be undone and will
            permanently remove all report data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: spacing.lg, gap: spacing.sm }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              color: theme.palette.text.secondary,
              borderColor: alpha(theme.palette.divider, 0.8),
              ...typography.body2,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: spacing.lg,
              "&:hover": {
                borderColor: theme.palette.text.disabled,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
              },
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.background.paper,
              ...typography.body2,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              px: spacing.lg,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "&:disabled": {
                bgcolor: alpha(theme.palette.primary.main, 0.5),
                color: alpha(theme.palette.background.paper, 0.7),
              },
            }}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            boxShadow: `0 8px 24px ${alpha(theme.palette.text.disabled, 0.2)}`,
          }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
