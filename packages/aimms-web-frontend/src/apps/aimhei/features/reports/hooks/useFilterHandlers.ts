/**
 * useFilterHandlers Hook
 *
 * Manages filter and pagination event handlers
 */

import type { ReportFiltersState, DateRange } from "./useReportHistory"

export interface UseFilterHandlersOptions {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: ReportFiltersState
  setFilters: (filters: Partial<ReportFiltersState>) => void
  setPage: (page: number) => void
  setRowsPerPage: (rows: number) => void
}

export interface UseFilterHandlersReturn {
  // Filter accessors
  searchField: string
  setSearchField: (value: string) => void
  modelFilter: string
  setModelFilter: (value: string) => void
  dateFilter: string
  setDateFilter: (value: string) => void
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  scoreFilter: string
  setScoreFilter: (value: string) => void

  // Filter utilities
  clearAllFilters: () => void
  hasActiveFilters: boolean

  // Pagination handlers
  handleChangePage: (event: unknown, newPage: number) => void
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Hook for managing filter and pagination handlers
 */
export const useFilterHandlers = (options: UseFilterHandlersOptions): UseFilterHandlersReturn => {
  const { searchTerm, setSearchTerm, filters, setFilters, setPage, setRowsPerPage } = options

  // Extract filter values from filters object for compatibility
  const { searchField } = filters
  // Don't spread filters to avoid race conditions - setFilters will merge with current store state
  const setSearchField = (value: string) => setFilters({ searchField: value })
  const { modelFilter } = filters
  const setModelFilter = (value: string) => setFilters({ modelFilter: value })
  const { dateFilter } = filters
  const setDateFilter = (value: string) => setFilters({ dateFilter: value })
  const { dateRange } = filters
  const setDateRange = (range: DateRange) => setFilters({
      dateRange: range,
      dateFilter: range.macro || "all", // Keep legacy field in sync
    })
  const scoreFilter = "all" // Not used but keep for compatibility
  const setScoreFilter = (_value: string) => {} // Not used but keep for compatibility

  const clearAllFilters = () => {
    // Reset all filters at once to avoid race conditions
    setFilters({
      searchTerm: "",
      searchField: "all",
      modelFilter: "all",
      dateFilter: "all",
      dateRange: { start: null, end: null, macro: "all" },
    })
  }

  const hasActiveFilters = !!(
    searchTerm ||
    searchField !== "all" ||
    scoreFilter !== "all" ||
    modelFilter !== "all" ||
    dateFilter !== "all" ||
    dateRange.macro !== "all" ||
    dateRange.start ||
    dateRange.end
  )

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return {
    searchField,
    setSearchField,
    modelFilter,
    setModelFilter,
    dateFilter,
    setDateFilter,
    dateRange,
    setDateRange,
    scoreFilter,
    setScoreFilter,
    clearAllFilters,
    hasActiveFilters,
    handleChangePage,
    handleChangeRowsPerPage,
  }
}
