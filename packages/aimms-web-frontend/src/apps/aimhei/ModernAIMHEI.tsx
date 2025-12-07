import React, { useState, useEffect, useMemo } from "react"
import {
  Container,
  Paper,
  Grid,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Box,
  useTheme,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { ShareReportDialog } from "@/features/reports"
import { adminApiClient } from "@/services/adminApiClient"

// Zustand Store
import { useAIMHEIStore } from "./stores/aimheiStore"

// Upload feature
import { useFileUpload, useAIMHEIConfig, useCriteriaUpload, UploadPanel } from "./features/upload"

// Reports feature
import {
  useReportHistory,
  useReportActions,
  useReportHandlers,
  useFilterHandlers,
  ReportHistoryPanel,
  ReportActionsMenu,
  ReportViewSection,
  FloatingExportBar,
  type StandaloneReport,
} from "./features/reports"

// Processing feature
import { useAIMHEIProcessing } from "./features/processing"

// Shared
import {
  useDebounce,
  useUserRole,
  DashboardHeader,
  DeleteConfirmationDialog,
  spacing,
  getScoreColor,
  submitTranscriptForProcessing,
} from "./shared"

// Report Organization Components
import { FolderToolbar } from "./features/reports/components/FolderToolbar"
import { DeleteFolderDialog } from "./features/reports/components/DeleteFolderDialog"

export const ModernAIMHEI: React.FC = () => {
  const theme = useTheme()

  // Zustand Store - View Management
  const mainView = useAIMHEIStore((state) => state.mainView)
  const selectedReportId = useAIMHEIStore((state) => state.selectedReportId)
  const setMainView = useAIMHEIStore((state) => state.setMainView)
  const setSelectedReportId = useAIMHEIStore((state) => state.setSelectedReportId)

  // Hook 1: File Upload - replaces transcriptFile, isDragOver, fileInputRef, drag handlers
  const {
    file: transcriptFile,
    isDragOver,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleFileChange,
    removeFile,
  } = useFileUpload({
    onFileSelect: (file, cleanedFilename) => {
      updateConfig("report_name", cleanedFilename)
    },
    acceptedTypes: [".txt", "text/plain"],
  })

  // Hook 2: AIMHEI Configuration - replaces config, interviewDate, validationErrors, updateConfig, validateForm
  const { config, interviewDate, validationErrors, updateConfig, setInterviewDate, validateForm } =    useAIMHEIConfig()

  // Hook 3: User Role - replaces user role fetching logic
  const { userRole } = useUserRole()

  // Hook 4: Report History - replaces standaloneReports, page, rowsPerPage, filters, searchTerm, etc.
  const {
    reports: standaloneReports,
    totalReports,
    loading: loadingReports,
    page,
    rowsPerPage,
    filters,
    searchTerm,
    setPage,
    setRowsPerPage,
    setSearchTerm,
    setFilters,
    fetchReports,
    refreshReports,
  } = useReportHistory({
    userRole,
    autoFetch: false,
  })

  // Folder state from Zustand
  const availableFolders = useAIMHEIStore((state) => state.availableFolders)
  const setAvailableFolders = useAIMHEIStore((state) => state.setAvailableFolders)
  const folderCounts = useAIMHEIStore((state) => state.folderCounts)
  const setFolderCounts = useAIMHEIStore((state) => state.setFolderCounts)
  const unorganizedCount = useAIMHEIStore((state) => state.unorganizedCount)
  const setUnorganizedCount = useAIMHEIStore((state) => state.setUnorganizedCount)
  const actualTotalReports = useAIMHEIStore((state) => state.actualTotalReports)
  const setActualTotalReports = useAIMHEIStore((state) => state.setActualTotalReports)
  const selectedFolder = useAIMHEIStore((state) => state.selectedFolder)
  const setSelectedFolder = useAIMHEIStore((state) => state.setSelectedFolder)
  const deleteFolderDialogOpen = useAIMHEIStore((state) => state.deleteFolderDialogOpen)
  const setDeleteFolderDialogOpen = useAIMHEIStore((state) => state.setDeleteFolderDialogOpen)
  const folderToDelete = useAIMHEIStore((state) => state.folderToDelete)
  const setFolderToDelete = useAIMHEIStore((state) => state.setFolderToDelete)
  const reportsInFolderToDelete = useAIMHEIStore((state) => state.reportsInFolderToDelete)
  const setReportsInFolderToDelete = useAIMHEIStore((state) => state.setReportsInFolderToDelete)

  // Fetch reports when user role is detected
  useEffect(() => {
    if (userRole === "admin") {
      fetchReports()
    }
  }, [userRole, fetchReports])

  // Fetch available folders and counts when admin
  useEffect(() => {
    if (userRole === "admin") {
      adminApiClient.getAllFolders().then(setAvailableFolders).catch(console.error)
      adminApiClient
        .getFolderCounts()
        .then((data) => {
          setFolderCounts(data.folder_counts)
          setUnorganizedCount(data.unorganized_count)
          setActualTotalReports(data.total_reports)
        })
        .catch(console.error)
    }
  }, [userRole])

  // Hook 5: Processing - replaces processing, processingProgress, processingMessage, jobId, result, error
  const {
    processing,
    processingProgress,
    processingMessage,
    jobId,
    result,
    error,
    startProcessing,
    resetProcessing,
  } = useAIMHEIProcessing({
    onComplete: async (completedJobId) => {
      await refreshReports()
    },
  })

  // Hook 6: Report Actions - replaces delete/share/download functions
  const { deleteReport, shareReport, downloadReport, deleting, sharing } = useReportActions({
    onDelete: (reportId) => {
      refreshReports()
    },
  })

  // Hook 7: Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Hook 8: Criteria Upload - replaces useCustomCriteria, criteriaFile, handlers
  const {
    useCustomCriteria,
    criteriaFile,
    isCriteriaDragOver,
    criteriaFileInputRef,
    setUseCustomCriteria,
    handleCriteriaDragOver,
    handleCriteriaDragLeave,
    handleCriteriaDrop,
    handleCriteriaFileSelect,
    handleCriteriaFileChange,
    removeCriteriaFile,
  } = useCriteriaUpload({
    onValidationError: (message) => showSnackbar(message, "error"),
    onValidationSuccess: (message) => showSnackbar(message, "success"),
  })

  // Zustand Store - UI State (replacing useUIState hook)
  const loadingTile = useAIMHEIStore((state) => state.loadingTile)
  const setLoadingTile = useAIMHEIStore((state) => state.setLoadingTile)
  const expandedCardsArray = useAIMHEIStore((state) => state.expandedCardsArray)
  const expandedCards = useMemo(() => new Set(expandedCardsArray), [expandedCardsArray])
  const toggleCardExpansion = useAIMHEIStore((state) => state.toggleCardExpansion)
  const exportMode = useAIMHEIStore((state) => state.exportMode)
  const setExportMode = useAIMHEIStore((state) => state.setExportMode)
  const organizeMode = useAIMHEIStore((state) => state.bulkOperationMode)
  const setOrganizeMode = useAIMHEIStore((state) => state.setBulkOperationMode)
  const bulkSelectedReportIds = useAIMHEIStore((state) => state.bulkSelectedReportIds)
  const selectedReportIdsArray = useAIMHEIStore((state) => state.selectedReportIdsArray)
  // Use bulkSelectedReportIds in organize mode, selectedReportIdsArray in export mode
  const selectedReportIds = useMemo(
    () => (organizeMode ? bulkSelectedReportIds : new Set(selectedReportIdsArray)),
    [organizeMode, bulkSelectedReportIds, selectedReportIdsArray],
  )
  const setSelectedReportIds = useAIMHEIStore((state) => state.setSelectedReportIds)
  const toggleSelectedReportId = useAIMHEIStore((state) => state.toggleSelectedReportId)
  const toggleReportSelection = useAIMHEIStore((state) => state.toggleReportSelection)
  const exportingCSV = useAIMHEIStore((state) => state.exportingCSV)
  const setExportingCSV = useAIMHEIStore((state) => state.setExportingCSV)
  const selectedReportIdForAction = useAIMHEIStore((state) => state.selectedReportIdForAction)
  const setSelectedReportIdForAction = useAIMHEIStore((state) => state.setSelectedReportIdForAction)
  const deleteDialogOpen = useAIMHEIStore((state) => state.deleteDialogOpen)
  const setDeleteDialogOpen = useAIMHEIStore((state) => state.setDeleteDialogOpen)
  const shareDialogOpen = useAIMHEIStore((state) => state.shareDialogOpen)
  const setShareDialogOpen = useAIMHEIStore((state) => state.setShareDialogOpen)
  const showSnackbar = useAIMHEIStore((state) => state.showSnackbar)
  const hideSnackbar = useAIMHEIStore((state) => state.hideSnackbar)

  // Snackbar state (individual selectors to avoid creating new objects on each render)
  const snackbarOpen = useAIMHEIStore((state) => state.snackbarOpen)
  const snackbarMessage = useAIMHEIStore((state) => state.snackbarMessage)
  const snackbarSeverity = useAIMHEIStore((state) => state.snackbarSeverity)
  const snackbar = { open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity }

  // Additional Report Organization State
  const clearSelection = useAIMHEIStore((state) => state.clearSelection)
  const selectAllReports = useAIMHEIStore((state) => state.selectAllReports)
  const reports = useAIMHEIStore((state) => state.reports)
  const setReports = useAIMHEIStore((state) => state.setReports)
  const updateReportFilter = useAIMHEIStore((state) => state.updateReportFilter)

  // Local UI state that doesn't need to be in store (menu anchor)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Hook 10: Report Handlers - replaces all event handler functions
  const {
    handleActionsClick,
    handleActionsClose,
    handleShareClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleSelectReport,
    handleSelectAll,
    handleExportCSV,
    handleCancelExport,
  } = useReportHandlers({
    setAnchorEl,
    setSelectedReportIdForAction,
    setShareDialogOpen,
    setDeleteDialogOpen,
    setSelectedReportIds,
    toggleSelectedReportId,
    toggleReportSelection,
    organizeMode,
    setExportMode,
    setExportingCSV,
    showSnackbar,
    selectedReportIds,
    selectedReportIdForAction,
    standaloneReports,
    deleteReport,
    selectAllReports,
    clearSelection,
  })

  // Hook 11: Filter Handlers - replaces filter and pagination handlers
  const {
    searchField,
    setSearchField,
    modelFilter,
    setModelFilter,
    dateRange,
    setDateRange,
    scoreFilter,
    setScoreFilter,
    clearAllFilters,
    hasActiveFilters,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useFilterHandlers({
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    setPage,
    setRowsPerPage,
  })

  const handleViewReport = (reportId: number) => {
    setSelectedReportId(reportId)
    setMainView("reportReview")
  }

  const handleBackToUpload = () => {
    setMainView("upload")
    resetProcessing()
    setSelectedReportId(null)
  }

  // Organize Mode Handlers
  const handleToggleOrganizeMode = () => {
    setOrganizeMode(true)
  }

  const handleExitOrganizeMode = () => {
    setOrganizeMode(false)
    setSelectedReportIds([])
  }

  const handleCancelOrganize = () => {
    setOrganizeMode(false)
    setSelectedReportIds([])
  }

  const handleClearSelection = () => {
    setSelectedReportIds([])
  }

  const handleExport = () => {
    setExportMode(true)
  }

  const handleApplyFolder = async (reportIds: number[], folder: string | null) => {
    try {
      // Use bulkSetFolder to set the folder for reports
      await adminApiClient.bulkSetFolder(reportIds, folder)
      await refreshReports()
      // Refresh available folders and counts
      const updatedFolders = await adminApiClient.getAllFolders()
      setAvailableFolders(updatedFolders)
      const folderCountsData = await adminApiClient.getFolderCounts()
      setFolderCounts(folderCountsData.folder_counts)
      setUnorganizedCount(folderCountsData.unorganized_count)
      setActualTotalReports(folderCountsData.total_reports)

      const folderName = folder || "Unorganized"
      showSnackbar(`${reportIds.length} report(s) moved to "${folderName}"`, "success")
      setSelectedReportIds([])
      setOrganizeMode(false)
    } catch (error: any) {
      showSnackbar(error.message || "Failed to move reports", "error")
    }
  }

  // Folder handlers
  const handleFolderSelect = async (folder: string | null) => {
    // If in organize mode with selected reports, move them to the folder
    if (organizeMode && selectedReportIds.size > 0) {
      try {
        // Handle special "unorganized" value
        const folderValue = folder && folder !== "unorganized" ? folder : null
        await adminApiClient.bulkSetFolder(Array.from(selectedReportIds), folderValue)
        await refreshReports()
        const updatedFolders = await adminApiClient.getAllFolders()
        setAvailableFolders(updatedFolders)
        showSnackbar(
          folderValue
            ? `${selectedReportIds.size} report(s) moved to "${folderValue}"`
            : `${selectedReportIds.size} report(s) moved to Unorganized`,
          "success",
        )
        setSelectedReportIds([])
        setOrganizeMode(false)
      } catch (error: any) {
        showSnackbar(error.message || "Failed to move reports", "error")
      }
    } else {
      // Normal mode: just select the folder to filter reports
      setSelectedFolder(folder)
      // Handle special cases for filtering
      if (folder === null) {
        // "All Reports" - clear the filter
        setFilters({ selectedFolders: [] })
      } else if (folder === "") {
        // "Unorganized" - use special marker for backend
        setFilters({ selectedFolders: ["__unorganized__"] })
      } else {
        // Specific folder
        setFilters({ selectedFolders: [folder] })
      }
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      // Create folder in backend
      await adminApiClient.createFolder(folderName)

      // Refresh folder list
      const updatedFolders = await adminApiClient.getAllFolders()
      setAvailableFolders(updatedFolders)

      // Automatically select the new folder
      setSelectedFolder(folderName)
      setFilters({ selectedFolders: [folderName] })

      showSnackbar(`Folder "${folderName}" created successfully`, "success")
    } catch (error: any) {
      showSnackbar(error.message || "Failed to create folder", "error")
    }
  }

  const handleRenameFolder = async (oldName: string, newName: string) => {
    try {
      // Call backend to rename folder across ALL reports
      const result = await adminApiClient.renameFolder(oldName, newName)

      // Refresh folder list and counts first
      const updatedFolders = await adminApiClient.getAllFolders()
      setAvailableFolders(updatedFolders)
      const folderCountsData = await adminApiClient.getFolderCounts()
      setFolderCounts(folderCountsData.folder_counts)
      setUnorganizedCount(folderCountsData.unorganized_count)
      setActualTotalReports(folderCountsData.total_reports)

      // If this folder was selected, update the selection and trigger refresh
      if (selectedFolder === oldName) {
        setSelectedFolder(newName)
        setFilters({ selectedFolders: [newName] })
        // The filter update will trigger a re-fetch automatically via useEffect
      } else {
        // Not viewing this folder, just do a standard refresh
        await refreshReports()
      }

      showSnackbar(
        `Folder renamed from "${oldName}" to "${newName}" (${result.reports_updated} reports updated)`,
        "success",
      )
    } catch (error: any) {
      showSnackbar(error.message || "Failed to rename folder", "error")
    }
  }

  const handleDeleteFolder = async (folderName: string) => {
    try {
      // Fetch all reports in this folder from the API
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const params = new URLSearchParams({
        folder: folderName,
        skip: "0",
        limit: "100", // Max allowed by backend
      })

      const response = await fetch(`${apiUrl}/api/aimhei-reports/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()

      // Open dialog with the fetched reports (API returns 'data' not 'reports')
      setFolderToDelete(folderName)
      setReportsInFolderToDelete(data.data || [])
      setDeleteFolderDialogOpen(true)
    } catch (error) {
      console.error("Failed to load reports for folder:", error)
      showSnackbar("Failed to load reports in folder", "error")
    }
  }

  const handleConfirmDeleteFolder = async (
    reportMappings: { reportId: number; destinationFolder: string }[],
  ) => {
    if (!folderToDelete) return

    try {
      // Move each report to its destination
      for (const mapping of reportMappings) {
        const folder =          mapping.destinationFolder === "Unorganized" ? null : mapping.destinationFolder
        await adminApiClient.bulkSetFolder([mapping.reportId], folder)
      }

      // Delete the folder from backend
      await adminApiClient.deleteFolder(folderToDelete)

      // If this folder was selected, deselect it
      if (selectedFolder === folderToDelete) {
        setSelectedFolder(null)
        setFilters({ selectedFolders: [] })
      }

      // Refresh data
      await refreshReports()
      const updatedFolders = await adminApiClient.getAllFolders()
      setAvailableFolders(updatedFolders)
      const folderCountsData = await adminApiClient.getFolderCounts()
      setFolderCounts(folderCountsData.folder_counts)
      setUnorganizedCount(folderCountsData.unorganized_count)
      setActualTotalReports(folderCountsData.total_reports)

      showSnackbar(`Folder "${folderToDelete}" deleted successfully`, "success")

      // Close dialog
      setDeleteFolderDialogOpen(false)
      setFolderToDelete(null)
      setReportsInFolderToDelete([])
    } catch (error: any) {
      showSnackbar(error.message || "Failed to delete folder", "error")
    }
  }

  const processTranscript = async () => {
    // Validate form before processing
    const isValid = validateForm(!!transcriptFile)
    if (!isValid) {
      // Validation errors are already set by validateForm in the hook
      return
    }

    // Show loading tile immediately
    const loadingTitle =
      config.report_name || transcriptFile?.name.replace(/\.[^/.]+$/, "") || "Report"
    setLoadingTile({
      title: loadingTitle,
      progress: 0,
      message: "Submitting transcript for processing...",
    })

    try {
      // TypeScript safety check (should not be needed due to validation)
      if (!transcriptFile) {
        console.error("No transcript file selected")
        return
      }

      // Submit transcript for async processing
      const data = await submitTranscriptForProcessing({
        transcriptFile,
        config,
        criteriaFile,
      })

      if (data.success && data.job_id) {
        // Start processing using the hook - this handles SSE/polling automatically
        await startProcessing(data.job_id)

        // After report is created, if a folder is selected, assign it to that folder
        // Note: report_id is not available in SubmitTranscriptResult, would need backend changes
        if (selectedFolder) {
          try {
            // TODO: Backend needs to return report_id in SubmitTranscriptResult
            // const folderValue = selectedFolder === '' ? null : selectedFolder
            // await adminApiClient.bulkSetFolder([data.report_id], folderValue)
            const updatedFolders = await adminApiClient.getAllFolders()
            setAvailableFolders(updatedFolders)
            const folderCountsData = await adminApiClient.getFolderCounts()
            setFolderCounts(folderCountsData.folder_counts)
            setUnorganizedCount(folderCountsData.unorganized_count)
            setActualTotalReports(folderCountsData.total_reports)
          } catch (error) {
            console.error("Failed to assign folder to new report:", error)
          }
        }
      } else {
        throw new Error(data.message || "Invalid response format")
      }
    } catch (err) {
      console.error("Error processing transcript:", err)
      setLoadingTile(null)
    }
  }

  // setupServerSentEvents, setupPolling, and fetchJobResult functions removed
  // These are now handled by the useAIMHEIProcessing hook

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container
        maxWidth={false}
        sx={{
          py: spacing.lg,
          minHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          maxWidth: "1800px",
          px: 3,
        }}>
        {/* Dashboard Header */}
        <DashboardHeader
          selectedReportId={selectedReportId}
          processing={processing}
          reportCount={Array.isArray(standaloneReports) ? standaloneReports.length : 0}
        />

        {/* Main Content Area */}
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            p: { xs: spacing.md, sm: spacing.lg },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            "@media print": {
              height: "auto",
              overflow: "visible",
              border: `1px solid ${theme.palette.divider}`,
            },
          }}>
          {mainView === "reportReview" && selectedReportId ? (
            // Full screen report view
            <ReportViewSection
              selectedReportId={selectedReportId}
              onBackToUpload={handleBackToUpload}
            />
          ) : (
            /* Two Panel Layout with Top Toolbar */
            <>
              {/* Unified Command Bar Toolbar - Admin Only */}
              {userRole === "admin" && (
                <FolderToolbar
                  onSelectFolder={handleFolderSelect}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onSearchChange={setSearchTerm}
                  onSearchFieldChange={setSearchField}
                  onModelFilterChange={setModelFilter}
                  onDateRangeChange={setDateRange}
                  onRefresh={refreshReports}
                  onToggleOrganizeMode={handleToggleOrganizeMode}
                  onExitOrganizeMode={handleExitOrganizeMode}
                  onMoveToFolder={async (folder: string) => {
                    const reportIds = Array.from(selectedReportIds)
                    const folderValue = folder === "Unorganized" ? null : folder
                    await handleApplyFolder(reportIds, folderValue)
                  }}
                  onExport={handleExport}
                />
              )}

              <Grid
                container
                spacing={spacing.lg}
                sx={{ flex: 1, height: "100%", overflow: "auto" }}>
                {/* Upload Panel */}
                <Grid item xs={12} md={userRole === "admin" ? 4 : 5} sx={{ height: "100%" }}>
                  <UploadPanel
                    transcriptFile={transcriptFile}
                    isDragOver={isDragOver}
                    fileInputRef={fileInputRef}
                    validationErrors={validationErrors}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    handleFileSelect={handleFileSelect}
                    handleFileChange={handleFileChange}
                    removeFile={removeFile}
                    useCustomCriteria={useCustomCriteria}
                    setUseCustomCriteria={setUseCustomCriteria}
                    criteriaFile={criteriaFile}
                    isCriteriaDragOver={isCriteriaDragOver}
                    criteriaFileInputRef={criteriaFileInputRef}
                    handleCriteriaDragOver={handleCriteriaDragOver}
                    handleCriteriaDragLeave={handleCriteriaDragLeave}
                    handleCriteriaDrop={handleCriteriaDrop}
                    handleCriteriaFileSelect={handleCriteriaFileSelect}
                    handleCriteriaFileChange={handleCriteriaFileChange}
                    removeCriteriaFile={removeCriteriaFile}
                    config={config}
                    interviewDate={interviewDate}
                    processing={processing}
                    processingProgress={processingProgress}
                    processingMessage={processingMessage}
                    jobId={jobId}
                    error={error}
                    updateConfig={updateConfig}
                    setInterviewDate={setInterviewDate}
                    processTranscript={processTranscript}
                  />
                </Grid>

                {/* Right Panel - All Admin Reports Table */}
                <ReportHistoryPanel
                  standaloneReports={standaloneReports}
                  totalReports={totalReports}
                  loadingReports={loadingReports}
                  loadingTile={loadingTile}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  searchTerm={searchTerm}
                  searchField={searchField}
                  modelFilter={modelFilter}
                  dateRange={dateRange}
                  exportMode={exportMode}
                  selectedReportIds={selectedReportIds}
                  expandedCards={expandedCards}
                  hasActiveFilters={hasActiveFilters}
                  refreshReports={refreshReports}
                  setSearchTerm={setSearchTerm}
                  setSearchField={setSearchField}
                  setModelFilter={setModelFilter}
                  setDateRange={setDateRange}
                  clearAllFilters={clearAllFilters}
                  setExportMode={setExportMode}
                  handleSelectReport={handleSelectReport}
                  handleSelectAll={handleSelectAll}
                  handleCancelExport={handleCancelExport}
                  handleViewReport={handleViewReport}
                  handleActionsClick={handleActionsClick}
                  toggleCardExpansion={toggleCardExpansion}
                  handleChangePage={handleChangePage}
                  handleChangeRowsPerPage={handleChangeRowsPerPage}
                  getScoreColor={(score) => getScoreColor(score, theme)}
                  isAdmin={userRole === "admin"}
                  selectedFolders={filters.selectedFolders}
                  setSelectedFolders={(folders) => setFilters({ selectedFolders: folders })}
                  availableFolders={availableFolders}
                  organizeMode={organizeMode}
                  setOrganizeMode={setOrganizeMode}
                  handleCancelOrganize={handleCancelOrganize}
                  handleApplyFolder={handleApplyFolder}
                  handleClearSelection={handleClearSelection}
                  selectedFolder={selectedFolder}
                  onSelectFolder={handleFolderSelect}
                  onCreateFolder={handleCreateFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              </Grid>
            </>
          )}
        </Paper>

        {/* Actions Menu */}
        <ReportActionsMenu
          anchorEl={anchorEl}
          onClose={handleActionsClose}
          onShare={handleShareClick}
          onDelete={handleDeleteClick}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          deleting={deleting}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />

        {/* Share Report Dialog */}
        <ShareReportDialog
          open={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false)
            setSelectedReportIdForAction(null)
          }}
          reportId={selectedReportIdForAction ?? 0}
          reportName={
            Array.isArray(standaloneReports)
              ? standaloneReports.find((r) => r.report_id === selectedReportIdForAction)?.case_title
              : undefined
          }
          reportScore={
            Array.isArray(standaloneReports)
              ? (standaloneReports.find((r) => r.report_id === selectedReportIdForAction)
                  ?.percentage_score ?? undefined)
              : undefined
          }
        />

        {/* Delete Folder Dialog */}
        <DeleteFolderDialog
          open={deleteFolderDialogOpen}
          folderName={folderToDelete || ""}
          reportsInFolder={reportsInFolderToDelete}
          availableFolders={availableFolders}
          onClose={() => {
            setDeleteFolderDialogOpen(false)
            setFolderToDelete(null)
            setReportsInFolderToDelete([])
          }}
          onConfirm={handleConfirmDeleteFolder}
        />

        {/* Floating Export Bar */}
        {exportMode && (
          <FloatingExportBar
            selectedCount={selectedReportIds.size}
            exporting={exportingCSV}
            onExport={handleExportCSV}
            onCancel={handleCancelExport}
          />
        )}

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={hideSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert
            onClose={hideSnackbar}
            severity={snackbar.severity}
            sx={{
              borderRadius: 2,
              boxShadow: `0 8px 24px ${alpha(theme.palette.text.secondary, 0.2)}`,
            }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  )
}
