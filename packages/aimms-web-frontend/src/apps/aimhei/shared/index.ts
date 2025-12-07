/**
 * Shared Resources
 * Components, hooks, and utilities used across features
 */

// Components
export { ScoreAvatar, type ScoreAvatarProps } from "./components/ScoreAvatar"
export { LoadingTile, type LoadingTileProps } from "./components/LoadingTile"
export { DashboardHeader, type DashboardHeaderProps } from "./components/DashboardHeader"
export {
  DeleteConfirmationDialog,
  type DeleteConfirmationDialogProps,
} from "./components/DeleteConfirmationDialog"

// Hooks
export { useDebounce } from "./hooks/useDebounce"
export {
  useUIState,
  type UseUIStateReturn,
  type SnackbarState,
  type LoadingTileState,
} from "./hooks/useUIState"
export { useUserRole, type UseUserRoleReturn, type UserRole } from "./hooks/useUserRole"
export {
  useDataGridFilters,
  type UseDataGridFiltersReturn,
  type DataGridFilters,
} from "./hooks/useDataGridFilters"

// Utils
export { exportReportsToCSV, type ExportResult } from "./utils/csvExport"
export {
  getScoreColor,
  getAvatarColor,
  submitTranscriptForProcessing,
  type SubmitTranscriptParams,
  type SubmitTranscriptResult,
} from "./utils/helpers"

// Constants
export { typography, spacing, fadeVariants } from "./constants"
