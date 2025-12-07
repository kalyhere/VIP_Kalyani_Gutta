import React, { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
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
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
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
  Assessment as AssessmentIcon,
  Feedback as FeedbackIcon,
  Grading as GradingIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from "@mui/icons-material"
import { format } from "date-fns"
import { useTheme } from "@mui/material/styles"
import { ReportDetail, RubricDataGrid, ShareReportDialog } from "@/features/reports"
import type { CompletedReportDetailItem } from "@/types/faculty-types"

// Define UA Brand Colors

// Helper component for displaying a score section
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

const CompactScoreItem: React.FC<ScoreItemProps> = ({ title, score, icon }) => {
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

// Helper function to format score as percentage string
const formatScore = (score: number | null): string => {
  if (score === null || typeof score !== "number") return "N/A"
  return `${Math.round(score)}%`
}

// --- Color Palette ---
const getScoreColors = (theme: any) => ({
  success: theme.palette.secondary.main,
  warning: theme.palette.secondary.light,
  error: theme.palette.primary.main,
  info: theme.palette.text.disabled,
})

export interface FacultyReportDetailProps {
  reportId: number
  reportData?: CompletedReportDetailItem // Optional: pre-fetched report data (for shared/public views)
  onFinalize?: () => void
  isFaculty?: boolean
  onFinalizeComplete?: () => void
}

export const FacultyReportDetail: React.FC<FacultyReportDetailProps> = ({
  reportId,
  reportData: preFetchedData,
  onFinalize,
  isFaculty = true,
  onFinalizeComplete,
}) => {
    const fetchInProgress = useRef(false)
    const [reportData, setReportData] = useState<CompletedReportDetailItem | null>(
      preFetchedData || null
    )
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [editedReport, setEditedReport] = useState<CompletedReportDetailItem | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [currentEditField, setCurrentEditField] = useState<{
      field: string
      value: any
    } | null>(null)
    const [activeTab, setActiveTab] = useState(0)
    const theme = useTheme()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const reportContainerRef = useRef<HTMLDivElement>(null)
    const [searchParams, setSearchParams] = useSearchParams()
    const [highlightedImprovementSection, setHighlightedImprovementSection] = useState<
      string | null
    >(null)

    // Check for print parameter and trigger print when report is loaded
    useEffect(() => {
      if (searchParams.get("print") === "true" && reportData && !loading) {
        // Remove the print parameter from URL
        searchParams.delete("print")
        setSearchParams(searchParams, { replace: true })

        // Trigger print after a short delay to ensure content is rendered
        setTimeout(() => {
          handlePrint()
        }, 1000)
      }
    }, [searchParams, reportData, loading])

    useEffect(() => {
      // If pre-fetched data is provided, use it and skip fetch
      if (preFetchedData) {
        setReportData(preFetchedData)
        setEditedReport(preFetchedData)
        setLoading(false)
        return
      }

      // Skip if we're already fetching
      if (fetchInProgress.current) return
      fetchInProgress.current = true

      const fetchReport = async () => {
        setLoading(true)
        setError(null)
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/aimhei-reports/${reportId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              },
            }
          )

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ detail: "Failed to fetch report details." }))
            throw new Error(errorData.detail || "Failed to fetch report details")
          }

          const data: CompletedReportDetailItem = await response.json()
          setReportData(data)
          setEditedReport(data)
        } catch (err) {
          console.error("Failed to fetch report:", err)
          setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
          setLoading(false)
          fetchInProgress.current = false
        }
      }

      fetchReport()

      return () => {
        fetchInProgress.current = false
      }
    }, [reportId])

    const handleEditClick = () => {
      setEditMode(true)
      setEditedReport(reportData)
    }

    const handleCancelEdit = () => {
      setEditMode(false)
      setEditedReport(reportData)
    }

    const handleSaveClick = async () => {
      if (!editedReport) return

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/aimhei-reports/${reportId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(editedReport),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to save report changes")
        }

        const updatedData = await response.json()

        // Batch state updates together
        setReportData(updatedData)
        setEditedReport(updatedData)
        setEditMode(false)

        // Note: onSave callback removed to prevent hooks rendering issues with memo
        // The parent component doesn't need to be notified since the update is self-contained
      } catch (err) {
        console.error("Failed to save report:", err)
        setError(err instanceof Error ? err.message : "Failed to save report changes")
      }
    }

    const handleFieldEdit = (field: keyof CompletedReportDetailItem, value: any) => {
      if (!editedReport) return
      setCurrentEditField({ field: field.toString(), value })
      setEditDialogOpen(true)
    }

    const handleEditDialogClose = () => {
      setEditDialogOpen(false)
      setCurrentEditField(null)
    }

    const handleEditDialogSave = () => {
      if (!editedReport || !currentEditField) return

      setEditedReport({
        ...editedReport,
        [currentEditField.field]: currentEditField.value,
      })
      handleEditDialogClose()
    }

    const handleRubricUpdate = (updatedRubric: any[]) => {
      if (!editedReport) return

      // Calculate Information Section score
      const infoSectionItems = updatedRubric.filter(
        (item) =>
          !item.section_title.includes("Skill Section") &&
          !item.criteria.includes("Medical Terminology") &&
          !item.criteria.includes("Politeness") &&
          !item.criteria.includes("Empathy") &&
          !item.criteria.includes("Scoring") // Exclude summary scoring items
      )

      const infoSectionYesCount = infoSectionItems.filter((item) => item.output === "YES").length

      const infoSectionTotal = infoSectionItems.length
      const infoSectionScore =
        infoSectionTotal > 0 ? (infoSectionYesCount / infoSectionTotal) * 100 : 0

      // Calculate Skill Section scores
      let medicalTermScore = 0
      let politenessScore = 0
      let empathyScore = 0

      // Find the specific scoring items
      const medicalTermItem = updatedRubric.find(
        (item) => item.criteria === "Medical Terminology Scoring"
      )
      const politenessItem = updatedRubric.find((item) => item.criteria === "Politeness Scoring")
      const empathyItem = updatedRubric.find((item) => item.criteria === "Empathy Scoring")

      // Calculate Medical Terminology score
      if (medicalTermItem) {
        const [yesCount, noCount] = medicalTermItem.output
          .split("/")
          .map((part: string) => parseInt(part.split(":")[1]))
        const total = yesCount + noCount
        medicalTermScore = total > 0 ? (yesCount / 10) * 100 : 100
      }

      // Calculate Politeness score
      if (politenessItem) {
        const avg = parseFloat(politenessItem.output.split("/")[0].split(":")[1])
        politenessScore = avg * 10
      }

      // Calculate Empathy score
      if (empathyItem) {
        const avg = parseFloat(empathyItem.output.split("/")[0].split(":")[1])
        empathyScore = avg * 10
      }

      // Calculate total Skill Section score (average of all three components)
      const skillScores = [medicalTermScore, politenessScore, empathyScore]
      const skillSectionScore =
        skillScores.length > 0 ? skillScores.reduce((a, b) => a + b, 0) / skillScores.length : 0

      // Calculate final score (average of info and skill sections)
      const finalScore = (infoSectionScore + skillSectionScore) / 2

      setEditedReport({
        ...editedReport,
        rubric_detail: updatedRubric,
        percentage_score: Math.round(finalScore),
        total_points_earned: infoSectionYesCount,
        total_points_possible: infoSectionItems.length,
        information_section_score: Math.round(infoSectionScore),
        skill_section_score: Math.round(skillSectionScore),
        medical_terminology_score: Math.round(medicalTermScore),
        politeness_score: Math.round(politenessScore),
        empathy_score: Math.round(empathyScore),
      })
    }

    // Calculate score difference for display
    const scoreDifference =
      editedReport?.percentage_score != null && reportData?.percentage_score != null
      ? editedReport.percentage_score - reportData.percentage_score
      : 0

    const handleFinalizeClick = () => {
      setConfirmDialogOpen(true)
    }

    const handleConfirmFinalize = async () => {
      setConfirmDialogOpen(false)
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/aimhei-reports/${reportId}/finalize`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error("Failed to finalize review")
        }

        onFinalize?.()
        onFinalizeComplete?.()
      } catch (err) {
        console.error("Failed to finalize review:", err)
        setError(err instanceof Error ? err.message : "Failed to finalize review")
      }
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue)
    }

    const handleToggleAll = () => {
      if (!editedReport?.rubric_detail) return

      const updatedRubric = editedReport.rubric_detail.map((item) => {
        // Only toggle items that have YES/NO outputs and aren't summary scoring items
        if (
          (item.output === "YES" || item.output === "NO") &&
          item.criteria &&
          !item.criteria.includes("Scoring")
        ) {
          return {
            ...item,
            output: item.output === "YES" ? "NO" : "YES",
          }
        }
        return item
      })

      handleRubricUpdate(updatedRubric)
    }

    const handleSetAllTo = (value: "YES" | "NO") => {
      if (!editedReport?.rubric_detail) return

      const updatedRubric = editedReport.rubric_detail.map((item) => {
        // Handle YES/NO items
        if (
          (item.output === "YES" || item.output === "NO") &&
          item.criteria &&
          !item.criteria.includes("Scoring")
        ) {
          return {
            ...item,
            output: value,
          }
        }

        // Handle Medical Terminology Scoring
        if (item.criteria === "Medical Terminology Scoring") {
          return {
            ...item,
            output: value === "YES" ? "YES:10/NO:0" : "YES:0/NO:10",
          }
        }

        // Handle Politeness and Empathy Scoring
        if (item.criteria === "Politeness Scoring" || item.criteria === "Empathy Scoring") {
          return {
            ...item,
            output: value === "YES" ? "avg:10.0" : "avg:0.0",
          }
        }

        return item
      })

      handleRubricUpdate(updatedRubric)
    }

    const handlePrint = async () => {
      if (!reportContainerRef.current) return

      const container = reportContainerRef.current

      // Expand all accordions
      const accordions = container.querySelectorAll('[aria-expanded="false"]')
      accordions.forEach((accordion) => {
        const button = accordion as HTMLElement
        button.click()
      })

      await new Promise((resolve) => setTimeout(resolve, 300))

      // Click all "Expand All" buttons in the RubricDataGrid (both Information and Skills sections)
      const allButtons = Array.from(container.querySelectorAll("button"))
      const expandAllButtons = allButtons.filter((btn) => {
        const hasExpandIcon = btn.querySelector('[data-testid="UnfoldMoreIcon"]')
        btn.textContent?.includes("Expand") ||
          btn.getAttribute("title")?.includes("Expand All") ||
          btn.getAttribute("aria-label")?.includes("Expand All")
        return hasExpandIcon
      })

      console.log(`Found ${expandAllButtons.length} "Expand All" buttons to click`)
      expandAllButtons.forEach((button) => {
        console.log(
          "Clicking expand button:",
          button.getAttribute("title") || button.getAttribute("aria-label")
        )
        button.click()
      })

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Expand any remaining collapsed table rows
      const tableRows = container.querySelectorAll(
        'tr[style*="cursor: pointer"], tr[style*="cursor:pointer"]'
      )
      const rowsToExpand: HTMLElement[] = []

      tableRows.forEach((row) => {
        if (row instanceof HTMLElement) {
          const expandIcon = row.querySelector('[class*="MuiSvgIcon"]')
          if (expandIcon) {
            const iconTransform = window.getComputedStyle(expandIcon).transform
            const isCollapsed =
              iconTransform === "none" || iconTransform.includes("matrix(1, 0, 0, 1")
            if (isCollapsed) {
              rowsToExpand.push(row)
            }
          }
        }
      })

      for (const row of rowsToExpand) {
        row.click()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Wait for expansions to complete
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Open print dialog
      window.print()
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

    if (!reportData) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">No report data available.</Alert>
        </Box>
      )
    }

    return (
      <Box
        ref={reportContainerRef}
        sx={{
          display: "flex",
          flexDirection: "column",
        }}>
        <ReportDetail
          mockReportDataSource={editMode ? editedReport! : reportData}
          onFieldEdit={isFaculty && editMode ? handleFieldEdit : undefined}
          showDetailedPerformance={false}
          highlightedImprovementSection={highlightedImprovementSection}
          onClearHighlight={() => setHighlightedImprovementSection(null)}
          customOverviewContent={
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                mt: 2,
              }}>
              {successMessage && (
                <Alert
                  severity="success"
                  onClose={() => {
                    setSuccessMessage(null)
                    onFinalizeComplete?.()
                  }}
                  sx={{
                    mb: 2,
                    borderRadius: 1,
                    flexShrink: 0,
                  }}>
                  {successMessage}
                </Alert>
              )}
              <Box
                className="report-action-bar"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexShrink: 0, // Don't shrink the controls
                }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: "medium",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  {/* <AssessmentIcon sx={{ color: theme.palette.secondary.main }} /> */}
                  Detailed Performance Rubric
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {isFaculty && (
                    <>
                      {editMode && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color:
                              scoreDifference > 0
                                ? "success.main"
                                : scoreDifference < 0
                                  ? "error.main"
                                  : "text.secondary",
                          }}>
                          <Typography variant="body2">
                            Score: 
{' '}
{reportData?.percentage_score}% →
{" "}
                            {editedReport?.percentage_score}%
                          </Typography>
                          {scoreDifference !== 0 && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: scoreDifference > 0 ? "success.main" : "error.main",
                                fontWeight: "bold",
                              }}>
                              ({scoreDifference > 0 ? "+" : ""}
                              {scoreDifference}
                              %)
                            </Typography>
                          )}
                        </Box>
                      )}
                      {editMode && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveClick}>
                          Save Changes
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<ShareIcon />}
                        onClick={() => setShareDialogOpen(true)}
                        sx={{ ml: 1 }}>
                        Share Report
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={editMode ? handleCancelEdit : handleEditClick}
                        sx={{ ml: 1 }}>
                        {editMode ? "Cancel Edit" : "Edit Report"}
                      </Button>
                    </>
                  )}
                  {/* Print button - visible to everyone */}
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handlePrint}
                    sx={{ ml: isFaculty ? 1 : 0 }}>
                    Print Report
                  </Button>
                </Box>
              </Box>
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper,
                  mb: 3, // Add bottom margin for spacing
                }}>
                <RubricDataGrid
                  rubricData={
                    (editMode ? editedReport?.rubric_detail : reportData?.rubric_detail) || []
                  }
                  onRubricUpdate={isFaculty && editMode ? handleRubricUpdate : undefined}
                  isFaculty={isFaculty && editMode}
                  strengths_weaknesses={
                    editMode ? editedReport?.strengths_weaknesses : reportData?.strengths_weaknesses
                  }
                  onJumpToImprovement={(sectionTitle) =>
                    setHighlightedImprovementSection(sectionTitle)
                  }
                />
              </Box>
            </Box>
          }
        />

        <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={currentEditField?.value || ""}
              onChange={(e) =>
                setCurrentEditField((prev) => (prev ? { ...prev, value: e.target.value } : null))
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditDialogClose}>Cancel</Button>
            <Button onClick={handleEditDialogSave} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>Confirm Finalization</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to finalize this review? This action will:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Make the review visible to the student" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Lock the review from further edits" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Return you to the class overview" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmFinalize}
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

        {/* Share Report Dialog */}
        {reportData && (
          <ShareReportDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            reportId={reportId}
            reportName={reportData.report_name || reportData.case_title}
            reportScore={reportData.percentage_score ?? undefined}
          />
        )}
      </Box>
    )
}
