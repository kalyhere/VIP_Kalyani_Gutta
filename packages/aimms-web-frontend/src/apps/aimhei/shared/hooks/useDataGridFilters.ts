/**
 * useDataGridFilters Hook
 * Reusable hook for managing DataGrid filtering, sorting, and search state
 */

import { useState, useCallback } from "react"

export interface DataGridFilters {
  searchTerm: string
  sortField: string
  sortOrder: "asc" | "desc"
  filters: Record<string, any>
}

export interface UseDataGridFiltersReturn {
  searchTerm: string
  sortField: string
  sortOrder: "asc" | "desc"
  filters: Record<string, any>

  setSearchTerm: (term: string) => void
  setSortField: (field: string) => void
  setSortOrder: (order: "asc" | "desc") => void
  setFilter: (key: string, value: any) => void
  removeFilter: (key: string) => void
  resetFilters: () => void
  resetAll: () => void
}

/**
 * Custom hook for managing DataGrid filters
 *
 * @example
 * ```tsx
 * const { searchTerm, setSearchTerm, filters, setFilter, resetAll } = useDataGridFilters()
 *
 * <TextField
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 * />
 * ```
 */
export function useDataGridFilters(
  initialState?: Partial<DataGridFilters>,
): UseDataGridFiltersReturn {
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || "")
  const [sortField, setSortField] = useState(initialState?.sortField || "")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialState?.sortOrder || "asc")
  const [filters, setFilters] = useState<Record<string, any>>(initialState?.filters || {})

  /**
   * Set a specific filter value
   */
  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  /**
   * Remove a specific filter
   */
  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  /**
   * Reset all filters to empty
   */
  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  /**
   * Reset everything to initial state
   */
  const resetAll = useCallback(() => {
    setSearchTerm("")
    setSortField("")
    setSortOrder("asc")
    setFilters({})
  }, [])

  return {
    searchTerm,
    sortField,
    sortOrder,
    filters,
    setSearchTerm,
    setSortField,
    setSortOrder,
    setFilter,
    removeFilter,
    resetFilters,
    resetAll,
  }
}
