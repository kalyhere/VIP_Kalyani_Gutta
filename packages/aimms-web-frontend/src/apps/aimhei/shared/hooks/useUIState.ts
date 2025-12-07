/**
 * useUIState Hook
 *
 * Manages all UI-only state including dialogs, menus, snackbars, and export mode
 */

import { useState } from "react"

export interface SnackbarState {
  open: boolean
  message: string
  severity: "success" | "error"
}

export interface LoadingTileState {
  title: string
  progress: number
  message: string
}

export interface UseUIStateReturn {
  // Loading tile
  loadingTile: LoadingTileState | null
  setLoadingTile: React.Dispatch<React.SetStateAction<LoadingTileState | null>>

  // Card expansion
  expandedCards: Set<number>
  toggleCardExpansion: (reportId: number) => void

  // Export mode
  exportMode: boolean
  setExportMode: (mode: boolean) => void
  selectedReportIds: Set<number>
  setSelectedReportIds: (ids: Set<number>) => void
  exportingCSV: boolean
  setExportingCSV: (exporting: boolean) => void

  // Actions menu
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
  selectedReportIdForAction: number | null
  setSelectedReportIdForAction: (id: number | null) => void

  // Dialogs
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (open: boolean) => void
  shareDialogOpen: boolean
  setShareDialogOpen: (open: boolean) => void

  // Snackbar
  snackbar: SnackbarState
  setSnackbar: (state: SnackbarState) => void
  showSnackbar: (message: string, severity: "success" | "error") => void
  hideSnackbar: () => void
}

/**
 * Hook for managing UI-only state
 */
export const useUIState = (): UseUIStateReturn => {
  const [loadingTile, setLoadingTile] = useState<LoadingTileState | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [exportMode, setExportMode] = useState(false)
  const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set())
  const [exportingCSV, setExportingCSV] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedReportIdForAction, setSelectedReportIdForAction] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  })

  const toggleCardExpansion = (reportId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity })
  }

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  return {
    loadingTile,
    setLoadingTile,
    expandedCards,
    toggleCardExpansion,
    exportMode,
    setExportMode,
    selectedReportIds,
    setSelectedReportIds,
    exportingCSV,
    setExportingCSV,
    anchorEl,
    setAnchorEl,
    selectedReportIdForAction,
    setSelectedReportIdForAction,
    deleteDialogOpen,
    setDeleteDialogOpen,
    shareDialogOpen,
    setShareDialogOpen,
    snackbar,
    setSnackbar,
    showSnackbar,
    hideSnackbar,
  }
}
