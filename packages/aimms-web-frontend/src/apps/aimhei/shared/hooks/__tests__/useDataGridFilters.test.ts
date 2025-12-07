/**
 * Unit tests for useDataGridFilters hook
 */

import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDataGridFilters } from "../useDataGridFilters"

describe("useDataGridFilters", () => {
  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useDataGridFilters())

      expect(result.current.searchTerm).toBe("")
      expect(result.current.sortField).toBe("")
      expect(result.current.sortOrder).toBe("asc")
      expect(result.current.filters).toEqual({})
    })

    it("should initialize with custom state", () => {
      const { result } = renderHook(() =>
        useDataGridFilters({
        searchTerm: "test search",
        sortField: "name",
        sortOrder: "desc",
        filters: { status: "active" },
      })
      )

      expect(result.current.searchTerm).toBe("test search")
      expect(result.current.sortField).toBe("name")
      expect(result.current.sortOrder).toBe("desc")
      expect(result.current.filters).toEqual({ status: "active" })
    })
  })

  // ============================================================================
  // SEARCH TERM
  // ============================================================================

  describe("Search Term", () => {
    it("should update search term", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setSearchTerm("new search")
      })

      expect(result.current.searchTerm).toBe("new search")
    })
  })

  // ============================================================================
  // SORTING
  // ============================================================================

  describe("Sorting", () => {
    it("should update sort field", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setSortField("email")
      })

      expect(result.current.sortField).toBe("email")
    })

    it("should update sort order", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setSortOrder("desc")
      })

      expect(result.current.sortOrder).toBe("desc")
    })
  })

  // ============================================================================
  // FILTERS
  // ============================================================================

  describe("Filters", () => {
    it("should set a filter", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setFilter("status", "active")
      })

      expect(result.current.filters).toEqual({ status: "active" })
    })

    it("should set multiple filters", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setFilter("status", "active")
        result.current.setFilter("role", "admin")
        result.current.setFilter("verified", true)
      })

      expect(result.current.filters).toEqual({
        status: "active",
        role: "admin",
        verified: true,
      })
    })

    it("should update existing filter", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setFilter("status", "active")
      })

      act(() => {
        result.current.setFilter("status", "inactive")
      })

      expect(result.current.filters).toEqual({ status: "inactive" })
    })

    it("should remove a filter", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setFilter("status", "active")
        result.current.setFilter("role", "admin")
      })

      act(() => {
        result.current.removeFilter("status")
      })

      expect(result.current.filters).toEqual({ role: "admin" })
    })

    it("should reset all filters", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setFilter("status", "active")
        result.current.setFilter("role", "admin")
      })

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filters).toEqual({})
    })
  })

  // ============================================================================
  // RESET ALL
  // ============================================================================

  describe("Reset All", () => {
    it("should reset all state", () => {
      const { result } = renderHook(() => useDataGridFilters())

      act(() => {
        result.current.setSearchTerm("search")
        result.current.setSortField("name")
        result.current.setSortOrder("desc")
        result.current.setFilter("status", "active")
        result.current.setFilter("role", "admin")
      })

      act(() => {
        result.current.resetAll()
      })

      expect(result.current.searchTerm).toBe("")
      expect(result.current.sortField).toBe("")
      expect(result.current.sortOrder).toBe("asc")
      expect(result.current.filters).toEqual({})
    })
  })
})
