/**
 * useReportHandlers Hook
 *
 * Manages all event handlers for reports, dialogs, and export functionality
 */

import { exportReportsToCSV } from "../../../shared/utils/csvExport"
import type { StandaloneReport } from "./useReportHistory"

export interface UseReportHandlersOptions {
  // UI state
  setAnchorEl: (el: HTMLElement | null) => void
  setSelectedReportIdForAction: (id: number | null) => void
  setShareDialogOpen: (open: boolean) => void
  setDeleteDialogOpen: (open: boolean) => void
  setSelectedReportIds: (ids: Set<number> | number[]) => void
  toggleSelectedReportId: (reportId: number) => void
  toggleReportSelection: (reportId: number) => void
  organizeMode: boolean
  setExportMode: (mode: boolean) => void
  setExportingCSV: (exporting: boolean) => void
  showSnackbar: (message: string, severity: "success" | "error") => void

  // Data
  selectedReportIds: Set<number>
  selectedReportIdForAction: number | null
  standaloneReports: StandaloneReport[]

  // Actions
  deleteReport: (id: number) => Promise<boolean | void>
  selectAllReports: () => void
  clearSelection: () => void
}

export interface UseReportHandlersReturn {
  // Actions menu
  handleActionsClick: (event: React.MouseEvent<HTMLElement>, reportId: number) => void
  handleActionsClose: () => void
  handleShareClick: () => void
  handleDeleteClick: () => void

  // Delete confirmation
  handleDeleteConfirm: () => Promise<void>
  handleDeleteCancel: () => void

  // Multi-select
  handleSelectReport: (reportId: number) => void
  handleSelectAll: () => void

  // CSV Export
  handleExportCSV: () => Promise<void>
  handleCancelExport: () => void
}

/**
 * Hook for managing report event handlers
 */
export const useReportHandlers = (options: UseReportHandlersOptions): UseReportHandlersReturn => {
  const {
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
  } = options

  // Actions menu handlers
  const handleActionsClick = (event: React.MouseEvent<HTMLElement>, reportId: number) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedReportIdForAction(reportId)
  }

  const handleActionsClose = () => {
    setAnchorEl(null)
    setSelectedReportIdForAction(null)
  }

  const handleShareClick = () => {
    setShareDialogOpen(true)
    setAnchorEl(null) // Close the menu but keep selectedReportIdForAction
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
    setAnchorEl(null) // Close the menu but keep selectedReportIdForAction
  }

  const handleDeleteConfirm = async () => {
    if (!selectedReportIdForAction) return

    try {
      await deleteReport(selectedReportIdForAction)
      showSnackbar("Report deleted successfully", "success")
    } catch (error) {
      console.error("Error deleting report:", error)
      showSnackbar(error instanceof Error ? error.message : "Failed to delete report", "error")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedReportIdForAction(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setSelectedReportIdForAction(null)
  }

  // Multi-select handlers
  const handleSelectReport = (reportId: number) => {
    // Use different toggle function based on mode
    if (organizeMode) {
      toggleReportSelection(reportId)
    } else {
      toggleSelectedReportId(reportId)
    }
  }

  const handleSelectAll = () => {
    if (!Array.isArray(standaloneReports)) return

    if (organizeMode) {
      // In organize mode, use the Zustand store functions
      if (selectedReportIds.size === standaloneReports.length) {
        clearSelection()
      } else {
        selectAllReports()
      }
    } else {
      // In export mode, use setSelectedReportIds
      if (selectedReportIds.size === standaloneReports.length) {
        setSelectedReportIds(new Set())
      } else {
        setSelectedReportIds(new Set(standaloneReports.map((r) => r.report_id)))
      }
    }
  }

  // CSV Export handler
  const handleExportCSV = async () => {
    setExportingCSV(true)
    const result = await exportReportsToCSV(selectedReportIds)
    setExportingCSV(false)

    showSnackbar(result.message, result.severity)

    if (result.success) {
      setSelectedReportIds(new Set())
      setExportMode(false)
    }
  }

  const handleCancelExport = () => {
    setExportMode(false)
    setSelectedReportIds(new Set())
  }

  return {
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
  }
}
