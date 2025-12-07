/**
 * ReportHistoryPanel Component
 * Complete right panel displaying report history with search, filters, export mode, and pagination
 */

import React from "react"
import {
  Grid,
  Paper,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Checkbox,
  TablePagination,
  alpha,
  Autocomplete,
  TextField,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material"
import { motion, AnimatePresence } from "framer-motion"
import RefreshIcon from "@mui/icons-material/Refresh"
import ClearIcon from "@mui/icons-material/Clear"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import ViewIcon from "@mui/icons-material/Visibility"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import CheckIcon from "@mui/icons-material/Check"
import AssessmentIcon from "@mui/icons-material/Assessment"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import PersonIcon from "@mui/icons-material/Person"
import BadgeIcon from "@mui/icons-material/Badge"
import ComputerIcon from "@mui/icons-material/Computer"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import ScheduleIcon from "@mui/icons-material/Schedule"
import ArchiveIcon from "@mui/icons-material/Archive"
import UnarchiveIcon from "@mui/icons-material/Unarchive"
import LabelIcon from "@mui/icons-material/Label"
import FolderIcon from "@mui/icons-material/Folder"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import AllInboxIcon from "@mui/icons-material/AllInbox"
import { format } from "date-fns"
import { useTheme } from "@mui/material"
import { FlexCenterVertical, FlexColumn, FlexCenter } from "@/components/styled"
import { UAAdvancedSearchField } from "../../../../../components/StyledFormComponents"
import { UADateRangePicker, type DateRange } from "../../../../../components/UADateRangePicker"
import { ScoreAvatar } from "../../../shared/components/ScoreAvatar"
import { LoadingTile } from "../../../shared/components/LoadingTile"

const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

const typography = {
  caption: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  h3: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
}

export interface StandaloneReport {
  report_id: number
  case_title?: string
  report_name?: string
  percentage_score: number | null
  updated_at: string
  status: string
  total_points_earned: number | null
  total_points_possible: number | null
  admin_user_id?: number
  admin_user_name?: string
  admin_user_email?: string
  ai_model?: string
  hcp_name?: string
  hcp_year?: string
  patient_id?: string
  human_supervisor?: string
  aispe_location?: string
  interview_date?: string
  created_at?: string
  report_type?: string
  is_archived?: boolean
  archived_at?: string | null
  tags?: string[]
  notes?: string | null
}

export interface ReportHistoryPanelProps {
  standaloneReports: StandaloneReport[]
  totalReports: number
  loadingReports: boolean
  loadingTile: { title: string; progress: number; message: string } | null
  page: number
  rowsPerPage: number
  searchTerm: string
  searchField: string
  modelFilter: string
  dateRange: DateRange
  exportMode: boolean
  organizeMode?: boolean
  selectedReportIds: Set<number>
  expandedCards: Set<number>
  hasActiveFilters: boolean

  refreshReports: () => void
  setSearchTerm: (term: string) => void
  setSearchField: (field: string) => void
  setModelFilter: (filter: string) => void
  setDateRange: (range: DateRange) => void
  clearAllFilters: () => void

  // Archive/Folder filters (admin only)
  showArchived?: boolean
  setShowArchived?: (show: boolean) => void
  selectedFolders?: string[]
  setSelectedFolders?: (folders: string[]) => void
  availableFolders?: string[]
  setExportMode: (mode: boolean) => void
  setOrganizeMode?: (mode: boolean) => void
  handleSelectReport: (reportId: number) => void
  handleSelectAll: () => void
  handleClearSelection?: () => void
  handleCancelExport: () => void
  handleCancelOrganize?: () => void
  handleApplyArchive?: (reportIds: number[], isArchived: boolean) => void
  handleApplyFolder?: (reportIds: number[], folder: string | null) => void
  handleViewReport: (reportId: number) => void
  handleActionsClick: (event: React.MouseEvent<HTMLElement>, reportId: number) => void
  toggleCardExpansion: (reportId: number) => void
  handleChangePage: (event: unknown, newPage: number) => void
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void
  getScoreColor: (score: number | null) => string

  // Report Organization (optional - admin only)
  isAdmin?: boolean
  onArchiveToggle?: (reportId: number, isArchived: boolean) => void
  onTagsClick?: (reportId: number) => void

  // Folder management
  selectedFolder?: string | null
  onSelectFolder?: (folder: string | null) => void
  onCreateFolder?: (folderName: string) => void
  onDeleteFolder?: (folderName: string) => void
}

export const ReportHistoryPanel: React.FC<ReportHistoryPanelProps> = ({
  standaloneReports,
  totalReports,
  loadingReports,
  loadingTile,
  page,
  rowsPerPage,
  searchTerm,
  searchField,
  modelFilter,
  dateRange,
  exportMode,
  organizeMode = false,
  selectedReportIds,
  expandedCards,
  hasActiveFilters,
  refreshReports,
  setSearchTerm,
  setSearchField,
  setModelFilter,
  setDateRange,
  clearAllFilters,
  setExportMode,
  setOrganizeMode,
  handleSelectReport,
  handleSelectAll,
  handleClearSelection,
  handleCancelExport,
  handleCancelOrganize,
  handleApplyArchive,
  handleViewReport,
  handleActionsClick,
  toggleCardExpansion,
  handleChangePage,
  handleChangeRowsPerPage,
  getScoreColor,
  isAdmin = false,
  onArchiveToggle,
  onTagsClick,
  showArchived = false,
  setShowArchived,
  selectedFolders = [],
  setSelectedFolders,
  availableFolders = [],
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const theme = useTheme()
  return (
  <Grid item xs={12} md={isAdmin ? 8 : 7} sx={{ height: "100%" }}>
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
      }}>
      <FlexColumn sx={{ height: "100%" }}>
        <Box
          sx={{
            p: spacing.lg,
            flexShrink: 0,
            pb: spacing.md,
          }}>
          <FlexCenterVertical justifyContent="space-between">
          <Box>
            <Typography
              variant="overline"
              sx={{
                ...typography.caption,
                color: theme.palette.secondary.main,
                display: "block",
                lineHeight: 1.2,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                mb: spacing.xs,
              }}>
              My Reports
            </Typography>
            <Typography
              variant="h6"
              sx={{
                ...typography.h3,
                color: theme.palette.text.primary,
              }}>
              Standalone Analysis Reports
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => refreshReports()}
            disabled={loadingReports}
            sx={{
              color: theme.palette.secondary.main,
              "&:hover": {
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
              },
            }}>
            <RefreshIcon sx={{ fontSize: 20 }} />
          </IconButton>
          </FlexCenterVertical>
        </Box>
        <Divider sx={{ mx: spacing.lg }} />

        {/* Search and Filter Controls */}
        {/* Filters are always shown, even when no results */}
        {Array.isArray(standaloneReports) && (
          <Box sx={{ p: spacing.lg, pb: spacing.md }}>
            <FlexCenterVertical
              justifyContent="space-between"
              sx={{
                gap: 2,
                flexWrap: "wrap",
              }}>
            <Box sx={{ minWidth: "320px", maxWidth: "450px", flexGrow: 1 }}>
              <UAAdvancedSearchField
                value={searchTerm}
                onChange={setSearchTerm}
                searchField={searchField}
                onSearchFieldChange={(field) => setSearchField(field as typeof searchField)}
                searchOptions={[
                  { value: "all", label: "All Fields" },
                  { value: "case_title", label: "Case Title" },
                  { value: "hcp_name", label: "Provider Name" },
                  { value: "patient_id", label: "Patient ID" },
                  { value: "ai_model", label: "AI Model" },
                  { value: "aispe_location", label: "Location" },
                  { value: "human_supervisor", label: "Supervisor" },
                ]}
                fullWidth={false}
                size="small"
                id="report-search"
                name="report-search"
              />
            </Box>

            <FlexCenterVertical
              gap={1.5}
              sx={{
                flexWrap: "wrap",
              }}>
              <UADateRangePicker
                value={dateRange}
                onChange={setDateRange}
                size="small"
                id="report-date-filter"
                name="date-filter"
              />
            </FlexCenterVertical>
            </FlexCenterVertical>
          </Box>
        )}

        {/* Export/Organize Mode Banner - Below Search/Filters */}
        {Array.isArray(standaloneReports) &&
          standaloneReports.length > 0 &&
          (exportMode || organizeMode) && (
            <Box
              sx={{
                px: spacing.lg,
                py: 1.5,
                bgcolor: alpha(theme.palette.secondary.light, 0.06),
                borderBottom: `1px solid ${alpha(theme.palette.secondary.light, 0.15)}`,
              }}>
              <FlexCenterVertical justifyContent="space-between">
                <FlexCenterVertical gap={3}>
              {/* Select All checkbox */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.light, 0.08),
                  },
                }}
                onClick={handleSelectAll}>
                <Checkbox
                  checked={
                    Array.isArray(standaloneReports) &&
                    selectedReportIds.size === standaloneReports.length &&
                    standaloneReports.length > 0
                  }
                  indeterminate={
                    Array.isArray(standaloneReports) &&
                    selectedReportIds.size > 0 &&
                    selectedReportIds.size < standaloneReports.length
                  }
                  onChange={handleSelectAll}
                  size="small"
                  sx={{
                    p: 0,
                    color: alpha(theme.palette.secondary.light, 0.5),
                    "&.Mui-checked": {
                      color: theme.palette.secondary.light,
                    },
                    "&.MuiCheckbox-indeterminate": {
                      color: theme.palette.secondary.light,
                    },
                  }}
                  icon={(
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${alpha(theme.palette.secondary.light, 0.5)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                      }}
                    />
                  )}
                  checkedIcon={(
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: theme.palette.secondary.light,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <CheckIcon sx={{ color: theme.palette.background.paper, fontSize: 14 }} />
                    </Box>
                  )}
                  indeterminateIcon={(
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        bgcolor: theme.palette.secondary.light,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 2,
                          bgcolor: theme.palette.background.paper,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}>
                  Select All
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: "center" }} />
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.8125rem",
                }}>
                {selectedReportIds.size > 0
                  ? `${selectedReportIds.size} of ${Array.isArray(standaloneReports) ? standaloneReports.length : 0} selected`
                  : "Click any report to select"}
              </Typography>
                </FlexCenterVertical>
                <Button
              size="small"
              variant="outlined"
              onClick={exportMode ? handleCancelExport : handleCancelOrganize}
              sx={{
                color: theme.palette.text.secondary,
                borderColor: alpha(theme.palette.divider, 0.5),
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 500,
                px: 2,
                py: 0.5,
                minWidth: "auto",
                borderRadius: 1.5,
                "&:hover": {
                  borderColor: theme.palette.text.disabled,
                  bgcolor: alpha(theme.palette.background.paper, 0.3),
                },
              }}>
              Cancel
            </Button>
              </FlexCenterVertical>
            </Box>
          )}

        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          {loadingReports ? (
            <FlexCenter sx={{ height: "200px" }}>
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }}>Loading reports...</Typography>
            </FlexCenter>
          ) : (
            <Box sx={{ p: 2 }}>
              {!Array.isArray(standaloneReports) || standaloneReports.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {hasActiveFilters ? "No reports match your filters" : "No standalone reports yet"}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {hasActiveFilters
                    ? "Try adjusting your search terms or filter criteria."
                    : "Upload a transcript to generate your first AIMHEI analysis report."}
                </Typography>
              </Box>
            ) : (
              <>
                {/* Loading Tile */}
                {loadingTile && (
                  <LoadingTile
                    title={loadingTile.title}
                    progress={loadingTile.progress}
                    message={loadingTile.message}
                  />
                )}

                <AnimatePresence>
                  {Array.isArray(standaloneReports) &&
                    standaloneReports.map((report, index) => {
                      const scoreColor = getScoreColor(report.percentage_score)

                      return (
                        <motion.div
                          key={report.report_id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.1, delay: index * 0.02 }}
                          style={{ marginBottom: "16px" }}>
                          <Card
                            elevation={0}
                            variant="outlined"
                            onClick={
                              exportMode || organizeMode
                                ? () => handleSelectReport(report.report_id)
                                : undefined
                            }
                            sx={{
                              borderRadius: 3,
                              transition: "all 0.2s ease",
                              border:
                                (exportMode || organizeMode) &&
                                selectedReportIds.has(report.report_id)
                                  ? `2px solid ${theme.palette.secondary.light}`
                                  : exportMode || organizeMode
                                    ? `2px dashed ${alpha(theme.palette.secondary.light, 0.3)}`
                                    : `1px solid ${alpha(scoreColor, 0.3)}`,
                              position: "relative",
                              overflow: "hidden",
                              background:
                                (exportMode || organizeMode) &&
                                selectedReportIds.has(report.report_id)
                                  ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.12)} 100%)`
                                  : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                              boxShadow: `0 2px 8px ${alpha(theme.palette.text.disabled, 0.08)}`,
                              cursor: exportMode || organizeMode ? "pointer" : "default",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: `0 12px 32px ${alpha(theme.palette.text.disabled, 0.18)}`,
                                borderColor:
                                  exportMode || organizeMode
                                    ? theme.palette.secondary.light
                                    : alpha(scoreColor, 0.6),
                                background:
                                  (exportMode || organizeMode) &&
                                  !selectedReportIds.has(report.report_id)
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.04)} 0%, ${alpha(theme.palette.secondary.light, 0.08)} 100%)`
                                    : undefined,
                              },
                            }}>
                            <CardContent sx={{ p: 2.5 }}>
                              {/* Main Header Section */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    flex: 1,
                                  }}>
                                  {/* Checkbox for export/organize mode */}
                                  {(exportMode || organizeMode) && (
                                    <Checkbox
                                      checked={selectedReportIds.has(report.report_id)}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        handleSelectReport(report.report_id)
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      size="small"
                                      sx={{
                                        p: 0,
                                        color: alpha(theme.palette.secondary.light, 0.5),
                                        "&.Mui-checked": {
                                          color: theme.palette.secondary.light,
                                        },
                                      }}
                                      icon={(
                                        <Box
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            border: `2px solid ${alpha(theme.palette.secondary.light, 0.5)}`,
                                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                                          }}
                                        />
                                      )}
                                      checkedIcon={(
                                        <Box
                                          sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            bgcolor: theme.palette.secondary.light,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}>
                                          <CheckIcon sx={{ color: theme.palette.background.paper, fontSize: 16 }} />
                                        </Box>
                                      )}
                                    />
                                  )}
                                  <ScoreAvatar
                                    score={report.percentage_score}
                                    title={report.case_title || report.report_name}
                                    size={40}
                                    showProgress
                                  />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Typography
                                        variant="h6"
                                        sx={{
                                          fontWeight: 600,
                                          lineHeight: 1.2,
                                          color: theme.palette.text.primary,
                                          fontSize: "1.1rem",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}>
                                        {report.case_title
                                          || report.report_name
                                          || `Report ${report.report_id}`}
                                      </Typography>
                                      {report.is_archived && (
                                        <Chip
                                          label="Archived"
                                          size="small"
                                          icon={
                                            <ArchiveIcon sx={{ fontSize: "0.7rem !important" }} />
                                          }
                                          sx={{
                                            bgcolor: alpha(theme.palette.text.secondary, 0.1),
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500,
                                            fontSize: "0.7rem",
                                            height: 20,
                                            "& .MuiChip-icon": {
                                              color: theme.palette.text.secondary,
                                            },
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                      }}>
                                      ID: {report.report_id} •{" "}
                                      {format(new Date(report.updated_at), "MMM d, yyyy h:mm a")}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<ViewIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleViewReport(report.report_id)
                                      }}
                                      sx={{
                                        background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                                        color: theme.palette.background.paper,
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        height: 36,
                                        textTransform: "none",
                                        borderRadius: 2.5,
                                        px: 2,
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.light, 0.3)}`,
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        position: "relative",
                                        overflow: "hidden",
                                        "&::before": {
                                          content: '""',
                                          position: "absolute",
                                          top: 0,
                                          left: "-100%",
                                          width: "100%",
                                          height: "100%",
                                          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.background.paper, 0.2)}, transparent)`,
                                          transition: "left 0.5s ease",
                                        },
                                        "&:hover": {
                                          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                                          transform: "translateY(-2px)",
                                          boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.light, 0.4)}`,
                                          "&::before": {
                                            left: "100%",
                                          },
                                        },
                                      }}>
                                      View Report
                                    </Button>

                                    {/* Actions Menu */}
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleActionsClick(e, report.report_id)}
                                      sx={{
                                        color: theme.palette.text.secondary,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          color: theme.palette.primary.light,
                                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        },
                                      }}>
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </Box>

                              {/* Tags Display - Show if report has tags */}
                              {report.tags && report.tags.length > 0 && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                    mb: 1.5,
                                    mt: 1.5,
                                  }}>
                                  {report.tags.map((tag) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      icon={<LabelIcon sx={{ fontSize: "0.75rem !important" }} />}
                                      sx={{
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.main,
                                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                                        fontWeight: 500,
                                        fontSize: "0.75rem",
                                        height: 24,
                                        "& .MuiChip-icon": {
                                          color: theme.palette.secondary.main,
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}

                              {/* Metadata Summary & Expand Button */}
                              {(() => {
                                const hasMetadata = report.hcp_name
                                report.hcp_year
                                  || report.patient_id
                                  || report.human_supervisor
                                  || report.aispe_location
                                  || report.ai_model
                                  || report.interview_date
                                  || report.created_at

                                const isExpanded = expandedCards.has(report.report_id)

                                if (!hasMetadata) {
                                  return (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontStyle: "italic",
                                        fontSize: "0.7rem",
                                        display: "block",
                                        mt: 1,
                                        pt: 1,
                                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                      }}>
                                      No additional metadata available
                                    </Typography>
                                  )
                                }

                                // Show summary when collapsed
                                if (!isExpanded) {
                                  const summaryItems = []
                                  if (report.hcp_name) summaryItems.push(report.hcp_name)
                                  if (report.patient_id) summaryItems.push(`Patient: ${report.patient_id}`)
                                  if (report.ai_model) summaryItems.push(report.ai_model)

                                  return (
                                    <Box
                                      sx={{
                                        pt: 1,
                                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          fontSize: "0.75rem",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          flex: 1,
                                        }}>
                                        {summaryItems.length > 0
                                          ? summaryItems.join(" • ")
                                          : "Metadata available"}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() => toggleCardExpansion(report.report_id)}
                                        sx={{
                                          ml: 1,
                                          color: "text.secondary",
                                          "&:hover": {
                                            bgcolor: alpha(theme.palette.divider, 0.3),
                                          },
                                        }}>
                                        <ExpandMoreIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Box>
                                  )
                                }

                                // Show full metadata when expanded
                                return (
                                  <Box>
                                    <Box
                                      sx={{
                                        pt: 1,
                                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        mb: 1.5,
                                      }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                                        Report Details
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={() => toggleCardExpansion(report.report_id)}
                                        sx={{
                                          color: "text.secondary",
                                          "&:hover": {
                                            bgcolor: alpha(theme.palette.divider, 0.3),
                                          },
                                        }}>
                                        <ExpandLessIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1,
                                        fontSize: "0.75rem",
                                      }}>
                                      {report.hcp_name && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <PersonIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Provider
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.hcp_name}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.patient_id && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <BadgeIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Patient ID
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.patient_id}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.ai_model && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <ComputerIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              AI Model
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.ai_model}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.aispe_location && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <LocationOnIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Location
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.aispe_location}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.human_supervisor && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <PersonIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Supervisor
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.human_supervisor}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.hcp_year && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <BadgeIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Academic Year
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {report.hcp_year}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.interview_date && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <CalendarTodayIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Interview Date
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {format(
                                                new Date(report.interview_date),
                                                "MMM d, yyyy"
                                              )}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {report.created_at && (
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}>
                                          <ScheduleIcon
                                            sx={{ fontSize: 14, color: theme.palette.text.secondary }}
                                          />
                                          <Box>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.65rem" }}>
                                              Created
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: 500,
                                                fontSize: "0.7rem",
                                                lineHeight: 1.2,
                                              }}>
                                              {format(new Date(report.created_at), "MMM d, yyyy")}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                )
                              })()}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>

                {/* Pagination Controls */}
                {totalReports > 0 && (
                  <FlexCenter
                    sx={{
                      mt: 2,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      pt: 2,
                    }}>
                    <TablePagination
                      component="div"
                      count={totalReports}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50, 100]}
                      slotProps={{
                        select: {
                          id: "report-history-rows-per-page",
                          name: "rows-per-page",
                        },
                      }}
                      sx={{
                        color: theme.palette.text.primary,
                        "& .MuiTablePagination-toolbar": {
                          minHeight: "48px",
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                          fontSize: "0.875rem",
                          color: theme.palette.text.secondary,
                        },
                        "& .MuiTablePagination-select": {
                          fontSize: "0.875rem",
                          color: theme.palette.text.primary,
                        },
                        "& .MuiIconButton-root": {
                          color: theme.palette.secondary.light,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.secondary.light, 0.08),
                          },
                          "&.Mui-disabled": {
                            color: theme.palette.divider,
                          },
                        },
                      }}
                    />
                  </FlexCenter>
                )}
              </>
              )}
            </Box>
          )}
        </Box>
      </FlexColumn>
    </Paper>
  </Grid>
  )
}
