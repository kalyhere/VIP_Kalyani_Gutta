/**
 * AIMHEI Store - Zustand v5
 * Manages state for the AIMHEI workflow (upload, configuration, processing)
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"

// ===== Types =====

export interface AIMHEIConfig {
  model: string
  report_name: string
  hcp_name: string
  hcp_year: string
  patient_id: string
  human_supervisor: string
  interview_date: string
  aispe_location: string
  formatting_process: string
}

export type MainView = "upload" | "reportReview"

export type ProcessingStatus = "idle" | "running" | "complete" | "error"

export type UserRole = "admin" | "student" | null

export interface StandaloneReport {
  report_id: number
  case_title: string
  percentage_score: number | null
  updated_at: string
  status: string
  total_points_earned: number | null
  total_points_possible: number | null
  admin_user_id?: number
  admin_user_name?: string
  admin_user_email?: string
  report_name?: string
  ai_model?: string
  hcp_name?: string
  hcp_year?: string
  patient_id?: string
  human_supervisor?: string
  aispe_location?: string
  interview_date?: string
  created_at?: string
  report_type?: string
  folder?: string | null
}

export interface DateRange {
  start: string | null // ISO date string
  end: string | null // ISO date string
  macro?: "all" | "today" | "week" | "month"
}

export interface ReportFiltersState {
  searchTerm: string
  searchField: string
  modelFilter: string
  dateFilter: string // Legacy - kept for backward compatibility
  dateRange: DateRange
  selectedFolders: string[]
}

interface AIMHEIState {
  // View State
  mainView: MainView
  selectedReportId: number | null

  // User State
  userRole: UserRole
  userRoleLoading: boolean

  // Report History State
  reports: StandaloneReport[]
  totalReports: number
  reportsLoading: boolean
  reportsError: string | null
  reportsPage: number
  reportsRowsPerPage: number
  reportsFilters: ReportFiltersState

  // Report Actions State
  deleting: boolean
  sharing: boolean

  // Upload State (managed by hooks but could be centralized)
  // File state is kept in hooks for now due to File object serialization

  // Configuration State (managed by hooks but could be centralized)
  // Config state is kept in hooks for now

  // Processing State
  processing: boolean
  processingProgress: number
  processingMessage: string
  processingStatus: ProcessingStatus
  jobId: string | null
  result: any | null
  error: string | null

  // UI State (using arrays internally, converting to Sets for compatibility)
  loadingTile: { title: string; progress: number; message: string } | null
  expandedCardsArray: number[] // Internal array storage
  exportMode: boolean
  selectedReportIdsArray: number[] // Internal array storage
  exportingCSV: boolean

  // Bulk Operations State (for report organization)
  bulkOperationMode: boolean
  bulkSelectedReportIds: Set<number>

  // Dialog State
  deleteDialogOpen: boolean
  shareDialogOpen: boolean
  selectedReportIdForAction: number | null

  // Snackbar State
  snackbarOpen: boolean
  snackbarMessage: string
  snackbarSeverity: "success" | "error" | "warning" | "info"

  // Folder Management State
  availableFolders: string[]
  folderCounts: Record<string, number>
  unorganizedCount: number
  actualTotalReports: number
  selectedFolder: string | null
  deleteFolderDialogOpen: boolean
  folderToDelete: string | null
  reportsInFolderToDelete: StandaloneReport[]

  // Actions - View Management
  setMainView: (view: MainView) => void
  setSelectedReportId: (id: number | null) => void

  // Actions - User State
  setUserRole: (role: UserRole) => void
  setUserRoleLoading: (loading: boolean) => void

  // Actions - Report History
  setReports: (reports: StandaloneReport[]) => void
  setTotalReports: (total: number) => void
  setReportsLoading: (loading: boolean) => void
  setReportsError: (error: string | null) => void
  setReportsPage: (page: number) => void
  setReportsRowsPerPage: (rowsPerPage: number) => void
  updateReportFilter: (key: keyof ReportFiltersState, value: string) => void
  setReportsFilters: (filters: Partial<ReportFiltersState>) => void
  resetReportsFilters: () => void

  // Actions - Report Actions
  setDeleting: (deleting: boolean) => void
  setSharing: (sharing: boolean) => void

  // Actions - Processing
  startProcessing: (jobId: string) => void
  updateProcessingProgress: (progress: number, message: string) => void
  completeProcessing: (result: any) => void
  setProcessingError: (error: string) => void
  resetProcessing: () => void

  // Actions - UI State
  setLoadingTile: (tile: { title: string; progress: number; message: string } | null) => void
  toggleCardExpansion: (cardId: number) => void
  setExportMode: (enabled: boolean) => void
  setSelectedReportIds: (ids: Set<number> | number[]) => void
  toggleSelectedReportId: (reportId: number) => void
  setExportingCSV: (exporting: boolean) => void

  // Actions - Dialogs
  setDeleteDialogOpen: (open: boolean) => void
  setShareDialogOpen: (open: boolean) => void
  setSelectedReportIdForAction: (id: number | null) => void

  // Actions - Snackbar
  showSnackbar: (message: string, severity: "success" | "error" | "warning" | "info") => void
  hideSnackbar: () => void

  // Actions - Bulk Operations
  setBulkOperationMode: (enabled: boolean) => void
  toggleReportSelection: (reportId: number) => void
  selectAllReports: () => void
  clearSelection: () => void

  // Actions - Folder Management
  setAvailableFolders: (folders: string[]) => void
  setFolderCounts: (counts: Record<string, number>) => void
  setUnorganizedCount: (count: number) => void
  setActualTotalReports: (count: number) => void
  setSelectedFolder: (folder: string | null) => void
  setDeleteFolderDialogOpen: (open: boolean) => void
  setFolderToDelete: (folder: string | null) => void
  setReportsInFolderToDelete: (reports: StandaloneReport[]) => void

  // Actions - Reset
  reset: () => void
}

// ===== Initial State =====

const DEFAULT_FILTERS: ReportFiltersState = {
  searchTerm: "",
  searchField: "all",
  modelFilter: "all",
  dateFilter: "all", // Legacy
  dateRange: { start: null, end: null, macro: "all" },
  selectedFolders: [],
}

const initialState = {
  // View State
  mainView: "upload" as MainView,
  selectedReportId: null,

  // User State
  userRole: null as UserRole,
  userRoleLoading: true,

  // Report History State
  reports: [] as StandaloneReport[],
  totalReports: 0,
  reportsLoading: false,
  reportsError: null as string | null,
  reportsPage: 0,
  reportsRowsPerPage: 5,
  reportsFilters: DEFAULT_FILTERS,

  // Report Actions State
  deleting: false,
  sharing: false,

  // Processing State
  processing: false,
  processingProgress: 0,
  processingMessage: "",
  processingStatus: "idle" as ProcessingStatus,
  jobId: null,
  result: null,
  error: null,

  // UI State
  loadingTile: null,
  expandedCardsArray: [],
  exportMode: false,
  selectedReportIdsArray: [],
  exportingCSV: false,

  // Bulk Operations State
  bulkOperationMode: false,
  bulkSelectedReportIds: new Set<number>(),

  // Dialog State
  deleteDialogOpen: false,
  shareDialogOpen: false,
  selectedReportIdForAction: null,

  // Snackbar State
  snackbarOpen: false,
  snackbarMessage: "",
  snackbarSeverity: "info" as const,

  // Folder Management State
  availableFolders: [],
  folderCounts: {},
  unorganizedCount: 0,
  actualTotalReports: 0,
  selectedFolder: null,
  deleteFolderDialogOpen: false,
  folderToDelete: null,
  reportsInFolderToDelete: [],
}

// ===== Store =====

export const useAIMHEIStore = create<AIMHEIState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // View Management Actions
      setMainView: (view) => set({ mainView: view }, false, "setMainView"),

      setSelectedReportId: (id) => set({ selectedReportId: id }, false, "setSelectedReportId"),

      // User State Actions
      setUserRole: (role) => set({ userRole: role }, false, "setUserRole"),

      setUserRoleLoading: (loading) => set({ userRoleLoading: loading }, false, "setUserRoleLoading"),

      // Report History Actions
      setReports: (reports) => set({ reports }, false, "setReports"),

      setTotalReports: (total) => set({ totalReports: total }, false, "setTotalReports"),

      setReportsLoading: (loading) => set({ reportsLoading: loading }, false, "setReportsLoading"),

      setReportsError: (error) => set({ reportsError: error }, false, "setReportsError"),

      setReportsPage: (page) => set({ reportsPage: page }, false, "setReportsPage"),

      setReportsRowsPerPage: (rowsPerPage) =>
        set({ reportsRowsPerPage: rowsPerPage, reportsPage: 0 }, false, "setReportsRowsPerPage"),

      updateReportFilter: (key, value) =>
        set(
        (state) => ({
          reportsFilters: { ...state.reportsFilters, [key]: value },
          reportsPage: 0,
        }),
        false,
        "updateReportFilter"
      ),

      setReportsFilters: (filters) =>
        set(
        (state) => ({
          reportsFilters: { ...state.reportsFilters, ...filters },
          reportsPage: 0,
        }),
        false,
        "setReportsFilters"
        ),

      resetReportsFilters: () =>
        set({ reportsFilters: DEFAULT_FILTERS, reportsPage: 0 }, false, "resetReportsFilters"),

      // Report Actions
      setDeleting: (deleting) => set({ deleting }, false, "setDeleting"),

      setSharing: (sharing) => set({ sharing }, false, "setSharing"),

      // Processing Actions
      startProcessing: (jobId) =>
        set(
        {
          processing: true,
          processingStatus: "running",
          jobId,
          processingProgress: 0,
          processingMessage: "Starting...",
          error: null,
        },
        false,
        "startProcessing"
        ),

      updateProcessingProgress: (progress, message) =>
        set(
        (state) => ({
          processingProgress: progress,
          processingMessage: message,
          loadingTile: state.loadingTile ? { ...state.loadingTile, progress, message } : null,
        }),
        false,
        "updateProcessingProgress"
        ),

      completeProcessing: (result) =>
        set(
        {
          processing: false,
          processingStatus: "complete",
          processingProgress: 100,
          result,
          loadingTile: null,
        },
        false,
        "completeProcessing"
        ),

      setProcessingError: (error) =>
        set(
        {
          processing: false,
          processingStatus: "error",
          error,
          loadingTile: null,
        },
        false,
        "setProcessingError"
        ),

      resetProcessing: () =>
        set(
        {
          processing: false,
          processingProgress: 0,
          processingMessage: "",
          processingStatus: "idle",
          jobId: null,
          result: null,
          error: null,
          loadingTile: null,
        },
        false,
        "resetProcessing"
      ),

      // UI State Actions
      setLoadingTile: (tile) => set({ loadingTile: tile }, false, "setLoadingTile"),

      toggleCardExpansion: (cardId) =>
        set(
        (state) => {
          const arr = [...state.expandedCardsArray]
          const index = arr.indexOf(cardId)
          if (index > -1) {
            arr.splice(index, 1)
          } else {
            arr.push(cardId)
          }
          return { expandedCardsArray: arr }
        },
        false,
        "toggleCardExpansion"
        ),

      setExportMode: (enabled) =>
        set(
        {
          exportMode: enabled,
          selectedReportIdsArray: enabled ? get().selectedReportIdsArray : [],
        },
        false,
        "setExportMode"
        ),

      setSelectedReportIds: (ids) =>
        set({ selectedReportIdsArray: Array.from(ids) }, false, "setSelectedReportIds"),

      toggleSelectedReportId: (reportId) =>
        set(
        (state) => {
          const arr = [...state.selectedReportIdsArray]
          const index = arr.indexOf(reportId)
          if (index > -1) {
            arr.splice(index, 1)
          } else {
            arr.push(reportId)
          }
          return { selectedReportIdsArray: arr }
        },
        false,
        "toggleSelectedReportId"
        ),

      setExportingCSV: (exporting) => set({ exportingCSV: exporting }, false, "setExportingCSV"),

      // Dialog Actions
      setDeleteDialogOpen: (open) => set({ deleteDialogOpen: open }, false, "setDeleteDialogOpen"),

      setShareDialogOpen: (open) => set({ shareDialogOpen: open }, false, "setShareDialogOpen"),

      setSelectedReportIdForAction: (id) =>
        set({ selectedReportIdForAction: id }, false, "setSelectedReportIdForAction"),

      // Snackbar Actions
      showSnackbar: (message, severity) =>
        set(
        {
          snackbarOpen: true,
          snackbarMessage: message,
          snackbarSeverity: severity,
        },
        false,
        "showSnackbar"
      ),

      hideSnackbar: () =>
        set(
        {
          snackbarOpen: false,
        },
        false,
        "hideSnackbar"
      ),

      // Bulk Operations Actions
      setBulkOperationMode: (enabled) =>
        set(
        {
          bulkOperationMode: enabled,
          bulkSelectedReportIds: enabled ? get().bulkSelectedReportIds : new Set<number>(),
        },
        false,
        "setBulkOperationMode"
        ),

      toggleReportSelection: (reportId) =>
        set(
        (state) => {
          // Only allow selection when bulk operation mode is enabled
          if (!state.bulkOperationMode) {
            return {}
          }
          const newSet = new Set(state.bulkSelectedReportIds)
          if (newSet.has(reportId)) {
            newSet.delete(reportId)
          } else {
            newSet.add(reportId)
          }
          return { bulkSelectedReportIds: newSet }
        },
        false,
        "toggleReportSelection"
        ),

      selectAllReports: () =>
        set(
        (state) => ({
          bulkSelectedReportIds: new Set(state.reports.map((r) => r.report_id)),
        }),
        false,
        "selectAllReports"
        ),

      clearSelection: () =>
        set(
        {
          bulkSelectedReportIds: new Set<number>(),
        },
        false,
        "clearSelection"
        ),

      // Folder Management Actions
      setAvailableFolders: (folders) => set({ availableFolders: folders }, false, "setAvailableFolders"),

      setFolderCounts: (counts) => set({ folderCounts: counts }, false, "setFolderCounts"),

      setUnorganizedCount: (count) => set({ unorganizedCount: count }, false, "setUnorganizedCount"),

      setActualTotalReports: (count) => set({ actualTotalReports: count }, false, "setActualTotalReports"),

      setSelectedFolder: (folder) => set({ selectedFolder: folder }, false, "setSelectedFolder"),

      setDeleteFolderDialogOpen: (open) => set({ deleteFolderDialogOpen: open }, false, "setDeleteFolderDialogOpen"),

      setFolderToDelete: (folder) => set({ folderToDelete: folder }, false, "setFolderToDelete"),

      setReportsInFolderToDelete: (reports) => set({ reportsInFolderToDelete: reports }, false, "setReportsInFolderToDelete"),

      // Reset Action
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "AIMHEIStore" }
  )
)

// ===== Selectors (for better performance) =====

// View selectors
export const selectMainView = (state: AIMHEIState) => state.mainView
export const selectSelectedReportId = (state: AIMHEIState) => state.selectedReportId

// User selectors
export const selectUserRole = (state: AIMHEIState) => state.userRole
export const selectUserRoleLoading = (state: AIMHEIState) => state.userRoleLoading

// Report History selectors
export const selectReports = (state: AIMHEIState) => state.reports
export const selectTotalReports = (state: AIMHEIState) => state.totalReports
export const selectReportsLoading = (state: AIMHEIState) => state.reportsLoading
export const selectReportsError = (state: AIMHEIState) => state.reportsError
export const selectReportsPage = (state: AIMHEIState) => state.reportsPage
export const selectReportsRowsPerPage = (state: AIMHEIState) => state.reportsRowsPerPage
export const selectReportsFilters = (state: AIMHEIState) => state.reportsFilters

// Report Actions selectors
export const selectDeleting = (state: AIMHEIState) => state.deleting
export const selectSharing = (state: AIMHEIState) => state.sharing

// Processing selectors
export const selectProcessing = (state: AIMHEIState) => state.processing
export const selectProcessingProgress = (state: AIMHEIState) => state.processingProgress
export const selectProcessingMessage = (state: AIMHEIState) => state.processingMessage
export const selectProcessingStatus = (state: AIMHEIState) => state.processingStatus
export const selectJobId = (state: AIMHEIState) => state.jobId
export const selectResult = (state: AIMHEIState) => state.result
export const selectError = (state: AIMHEIState) => state.error

// UI State selectors
export const selectLoadingTile = (state: AIMHEIState) => state.loadingTile
export const selectExpandedCards = (state: AIMHEIState) => new Set(state.expandedCardsArray)
export const selectExportMode = (state: AIMHEIState) => state.exportMode
export const selectSelectedReportIds = (state: AIMHEIState) => new Set(state.selectedReportIdsArray)
export const selectExportingCSV = (state: AIMHEIState) => state.exportingCSV

// Dialog selectors
export const selectDeleteDialogOpen = (state: AIMHEIState) => state.deleteDialogOpen
export const selectShareDialogOpen = (state: AIMHEIState) => state.shareDialogOpen
export const selectSelectedReportIdForAction = (state: AIMHEIState) =>
  state.selectedReportIdForAction

// Snackbar selectors
export const selectSnackbar = (state: AIMHEIState) => ({
  open: state.snackbarOpen,
  message: state.snackbarMessage,
  severity: state.snackbarSeverity,
})

// ===== Convenience Hooks =====

// Hook to get user state
export const useUserState = () =>
  useAIMHEIStore((state) => ({
  userRole: state.userRole,
  userRoleLoading: state.userRoleLoading,
}))

// Hook to get user actions
export const useUserActions = () =>
  useAIMHEIStore((state) => ({
  setUserRole: state.setUserRole,
  setUserRoleLoading: state.setUserRoleLoading,
}))

// Hook to get all report history state
export const useReportHistoryState = () =>
  useAIMHEIStore((state) => ({
  reports: state.reports,
  totalReports: state.totalReports,
  loading: state.reportsLoading,
  error: state.reportsError,
  page: state.reportsPage,
  rowsPerPage: state.reportsRowsPerPage,
  filters: state.reportsFilters,
}))

// Hook to get all report history actions
export const useReportHistoryActions = () =>
  useAIMHEIStore((state) => ({
  setReports: state.setReports,
  setTotalReports: state.setTotalReports,
  setReportsLoading: state.setReportsLoading,
  setReportsError: state.setReportsError,
  setReportsPage: state.setReportsPage,
  setReportsRowsPerPage: state.setReportsRowsPerPage,
  updateReportFilter: state.updateReportFilter,
  setReportsFilters: state.setReportsFilters,
  resetReportsFilters: state.resetReportsFilters,
}))

// Hook to get report actions state
export const useReportActionsState = () =>
  useAIMHEIStore((state) => ({
  deleting: state.deleting,
  sharing: state.sharing,
}))

// Hook to get report actions
export const useReportActionsActions = () =>
  useAIMHEIStore((state) => ({
  setDeleting: state.setDeleting,
  setSharing: state.setSharing,
}))

// Hook to get all processing-related state
export const useProcessingState = () =>
  useAIMHEIStore((state) => ({
  processing: state.processing,
  processingProgress: state.processingProgress,
  processingMessage: state.processingMessage,
  processingStatus: state.processingStatus,
  jobId: state.jobId,
  result: state.result,
  error: state.error,
}))

// Hook to get all processing actions
export const useProcessingActions = () =>
  useAIMHEIStore((state) => ({
  startProcessing: state.startProcessing,
  updateProcessingProgress: state.updateProcessingProgress,
  completeProcessing: state.completeProcessing,
  setProcessingError: state.setProcessingError,
  resetProcessing: state.resetProcessing,
}))

// Hook to get all UI state
export const useUIStateFromStore = () =>
  useAIMHEIStore((state) => ({
  loadingTile: state.loadingTile,
  expandedCards: new Set(state.expandedCardsArray),
  exportMode: state.exportMode,
  selectedReportIds: new Set(state.selectedReportIdsArray),
  exportingCSV: state.exportingCSV,
  deleteDialogOpen: state.deleteDialogOpen,
  shareDialogOpen: state.shareDialogOpen,
  selectedReportIdForAction: state.selectedReportIdForAction,
  snackbar: {
    open: state.snackbarOpen,
    message: state.snackbarMessage,
    severity: state.snackbarSeverity,
  },
}))

// Hook to get all UI actions
export const useUIActions = () =>
  useAIMHEIStore((state) => ({
  setLoadingTile: state.setLoadingTile,
  toggleCardExpansion: state.toggleCardExpansion,
  setExportMode: state.setExportMode,
  setSelectedReportIds: state.setSelectedReportIds,
  setExportingCSV: state.setExportingCSV,
  setDeleteDialogOpen: state.setDeleteDialogOpen,
  setShareDialogOpen: state.setShareDialogOpen,
  setSelectedReportIdForAction: state.setSelectedReportIdForAction,
  showSnackbar: state.showSnackbar,
  hideSnackbar: state.hideSnackbar,
}))
