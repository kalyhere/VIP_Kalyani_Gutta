/**
 * useReportHistory Hook
 * Manages AIMHEI report history with pagination, filtering, and search using Zustand store
 */

import { useCallback, useEffect } from "react"
import {
  useAIMHEIStore,
  type StandaloneReport,
  type ReportFiltersState,
  type DateRange,
  type UserRole,
} from "../../../stores/aimheiStore"

export type { StandaloneReport, ReportFiltersState, DateRange }

export interface UseReportHistoryReturn {
  // Data
  reports: StandaloneReport[]
  totalReports: number
  loading: boolean
  error: string | null

  // Pagination
  page: number
  rowsPerPage: number
  setPage: (page: number) => void
  setRowsPerPage: (rowsPerPage: number) => void

  // Filters
  filters: ReportFiltersState
  searchTerm: string
  updateFilter: (key: keyof ReportFiltersState, value: string) => void
  setSearchTerm: (term: string) => void
  setFilters: (filters: Partial<ReportFiltersState>) => void
  resetFilters: () => void

  // Actions
  fetchReports: () => Promise<void>
  refreshReports: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Custom hook for managing AIMHEI report history
 *
 * @example
 * ```tsx
 * const { reports, loading, page, setPage, filters, updateFilter, refresh } = useReportHistory({
 *   userRole: 'admin',
 *   apiUrl: 'http://localhost:8000'
 * })
 *
 * <DataGrid
 *   rows={reports}
 *   loading={loading}
 *   page={page}
 *   onPageChange={(_e, newPage) => setPage(newPage)}
 * />
 * ```
 */
export function useReportHistory(options?: {
  userRole?: UserRole
  apiUrl?: string
  token?: string | null
  autoFetch?: boolean
}): UseReportHistoryReturn {
  const {
    userRole = null,
    apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000",
    token = null,
    autoFetch = true,
  } = options || {}

  // Get state from Zustand store
  const reports = useAIMHEIStore((state) => state.reports)
  const totalReports = useAIMHEIStore((state) => state.totalReports)
  const loading = useAIMHEIStore((state) => state.reportsLoading)
  const error = useAIMHEIStore((state) => state.reportsError)
  const page = useAIMHEIStore((state) => state.reportsPage)
  const rowsPerPage = useAIMHEIStore((state) => state.reportsRowsPerPage)
  const filters = useAIMHEIStore((state) => state.reportsFilters)

  // Get actions from Zustand store
  const setReports = useAIMHEIStore((state) => state.setReports)
  const setTotalReports = useAIMHEIStore((state) => state.setTotalReports)
  const setLoading = useAIMHEIStore((state) => state.setReportsLoading)
  const setError = useAIMHEIStore((state) => state.setReportsError)
  const setPage = useAIMHEIStore((state) => state.setReportsPage)
  const setRowsPerPage = useAIMHEIStore((state) => state.setReportsRowsPerPage)
  const updateReportFilter = useAIMHEIStore((state) => state.updateReportFilter)
  const setReportsFilters = useAIMHEIStore((state) => state.setReportsFilters)
  const resetReportsFilters = useAIMHEIStore((state) => state.resetReportsFilters)

  /**
   * Build API URL with filters
   */
  const buildReportsUrl = useCallback(
    (skip: number, limit: number): string => {
      const params = new URLSearchParams({
        report_type: "standalone",
        skip: skip.toString(),
        limit: limit.toString(),
      })

      // Add search parameters if present
      if (filters.searchTerm) {
        params.append("search_term", filters.searchTerm)
        params.append("search_field", filters.searchField)
      }

      // Add AI model filter if not "all"
      if (filters.modelFilter && filters.modelFilter !== "all") {
        params.append("ai_model", filters.modelFilter)
      }

      // Add date range filter if specified
      if (filters.dateRange) {
        // If macro is set and not "all", use it
        if (filters.dateRange.macro && filters.dateRange.macro !== "all") {
          params.append("date_filter", filters.dateRange.macro)
        }
        // Otherwise, use custom start/end dates if they're set
        else if (filters.dateRange.start || filters.dateRange.end) {
          if (filters.dateRange.start) {
            params.append("start_date", filters.dateRange.start)
          }
          if (filters.dateRange.end) {
            params.append("end_date", filters.dateRange.end)
          }
        }
      }

      // Add folder filter (admin only)
      if (filters.selectedFolders && filters.selectedFolders.length > 0 && userRole === "admin") {
        // selectedFolders now contains a single folder name
        params.append("folder", filters.selectedFolders[0])
      }

      return `${apiUrl}/api/aimhei-reports/?${params.toString()}`
    },
    [apiUrl, filters, userRole]
  )

  /**
   * Fetch reports from API
   */
  const fetchReports = useCallback(async (): Promise<void> => {
    if (userRole !== "admin") {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const skip = page * rowsPerPage
      const url = buildReportsUrl(skip, rowsPerPage)
      const authToken = token || localStorage.getItem("auth_token")

      const response = await fetch(url, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`)
      }

      const data = await response.json()

      // Handle both old format (array) and new format (paginated object)
      if (Array.isArray(data)) {
        setReports(data)
        setTotalReports(data.length)
      } else {
        setReports(data.data || [])
        setTotalReports(data.total || 0)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch reports"
      setError(errorMsg)
      setReports([])
      setTotalReports(0)
    } finally {
      setLoading(false)
    }
  }, [userRole, page, rowsPerPage, buildReportsUrl, token])

  /**
   * Convenience method to set search term
   */
  const setSearchTerm = useCallback(
    (term: string) => {
      updateReportFilter("searchTerm", term)
    },
    [updateReportFilter],
  )

  /**
   * Refresh reports (alias for fetchReports)
   */
  const refresh = fetchReports

  /**
   * Auto-fetch reports when dependencies change
   */
  useEffect(() => {
    if (autoFetch && userRole === "admin") {
      fetchReports()
    }
  }, [autoFetch, userRole, page, rowsPerPage, filters, fetchReports])

  return {
    // Data
    reports,
    totalReports,
    loading,
    error,

    // Pagination
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,

    // Filters
    filters,
    searchTerm: filters.searchTerm,
    updateFilter: updateReportFilter,
    setSearchTerm,
    setFilters: setReportsFilters,
    resetFilters: resetReportsFilters,

    // Actions
    fetchReports,
    refreshReports: fetchReports,
    refresh,
  }
}
