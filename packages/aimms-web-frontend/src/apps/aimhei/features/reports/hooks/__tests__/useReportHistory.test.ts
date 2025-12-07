/**
 * Unit tests for useReportHistory hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useReportHistory } from "../useReportHistory"
import { useAIMHEIStore } from "../../../../stores/aimheiStore"

describe("useReportHistory", () => {
  const mockReports = [
    {
      report_id: 1,
      case_title: "Test Report 1",
      hcp_name: "Dr. Smith",
      patient_id: "PAT-001",
      created_at: "2025-01-15T10:00:00Z",
      percentage_score: 85,
      ai_model: "gpt-4o",
      report_type: "standalone",
    },
    {
      report_id: 2,
      case_title: "Test Report 2",
      hcp_name: "Dr. Jones",
      patient_id: "PAT-002",
      created_at: "2025-01-16T11:00:00Z",
      percentage_score: 92,
      ai_model: "gpt-4o-mini",
      report_type: "standalone",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()

    // Reset Zustand store state before each test (don't replace actions)
    useAIMHEIStore.setState({
      reports: [],
      totalReports: 0,
      reportsLoading: false,
      reportsError: null,
      reportsPage: 0,
      reportsRowsPerPage: 10,
      reportsFilters: {
        searchTerm: "",
        searchField: "case_title",
        modelFilter: "all",
        dateFilter: "all",
        dateRange: { start: null, end: null, macro: "all" },
        selectedFolders: [],
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()

    // Also reset after each test to ensure cleanup
    useAIMHEIStore.setState({
      reports: [],
      totalReports: 0,
      reportsLoading: false,
      reportsError: null,
      reportsPage: 0,
      reportsRowsPerPage: 10,
      reportsFilters: {
        searchTerm: "",
        searchField: "case_title",
        modelFilter: "all",
        dateFilter: "all",
        dateRange: { start: null, end: null, macro: "all" },
        selectedFolders: [],
      },
    })
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      expect(result.current.reports).toEqual([])
      expect(result.current.totalReports).toBe(0)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.page).toBe(0)
      expect(result.current.rowsPerPage).toBe(10)
    })

    it("should initialize with default filters", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      expect(result.current.filters.searchTerm).toBe("")
      expect(result.current.filters.searchField).toBe("case_title")
      expect(result.current.filters.modelFilter).toBe("all")
      expect(result.current.filters.dateFilter).toBe("all")
    })

    it("should not auto-fetch if user is not admin", async () => {
      const fetchMock = vi.fn()
      global.fetch = fetchMock

      renderHook(() =>
        useReportHistory({
        userRole: "student",
        autoFetch: true,
      })
      )

      await waitFor(() => {
        expect(fetchMock).not.toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // FETCHING REPORTS
  // ============================================================================

  describe("Fetching Reports", () => {
    it("should fetch reports for admin users", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockReports,
          total: 2,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        apiUrl: "http://test-api.com",
        autoFetch: true,
      })
      )

      await waitFor(() => {
        expect(result.current.reports).toEqual(mockReports)
        expect(result.current.totalReports).toBe(2)
        expect(result.current.loading).toBe(false)
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("http://test-api.com/api/aimhei-reports/"),
        expect.any(Object)
      )
    })

    it("should handle old format response (array)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockReports,
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: true,
      })
      )

      await waitFor(() => {
        expect(result.current.reports).toEqual(mockReports)
        expect(result.current.totalReports).toBe(2)
      })
    })

    it("should handle fetch errors", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"))
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: true,
      })
      )

      await waitFor(() => {
        expect(result.current.error).toBe("Network error")
        expect(result.current.reports).toEqual([])
        expect(result.current.loading).toBe(false)
      })
    })

    it("should handle non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: true,
      })
      )

      await waitFor(() => {
        expect(result.current.error).toContain("Unauthorized")
        expect(result.current.reports).toEqual([])
      })
    })

    it("should manually refresh reports", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: mockReports,
          total: 2,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.reports).toEqual(mockReports)
        expect(fetchMock).toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // PAGINATION
  // ============================================================================

  describe("Pagination", () => {
    it("should update page number", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.page).toBe(2)
    })

    it("should update rows per page", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.setRowsPerPage(25)
      })

      expect(result.current.rowsPerPage).toBe(25)
    })

    it("should fetch with correct pagination parameters", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
        }),
      })
      global.fetch = fetchMock

      // Set pagination in store before rendering
      useAIMHEIStore.setState({
        reportsPage: 2,
        reportsRowsPerPage: 20,
      })

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining("skip=40&limit=20"),
          expect.any(Object)
        )
      })
    })
  })

  // ============================================================================
  // FILTERS
  // ============================================================================

  describe("Filters", () => {
    it("should update search term filter", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.updateFilter("searchTerm", "test search")
      })

      expect(result.current.filters.searchTerm).toBe("test search")
    })

    it("should update model filter", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.updateFilter("modelFilter", "gpt-4o")
      })

      expect(result.current.filters.modelFilter).toBe("gpt-4o")
    })

    it("should reset page when filter changes", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.setPage(5)
      })

      expect(result.current.page).toBe(5)

      act(() => {
        result.current.updateFilter("searchTerm", "new search")
      })

      expect(result.current.page).toBe(0)
    })

    it("should reset all filters", () => {
      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.updateFilter("searchTerm", "test")
        result.current.updateFilter("modelFilter", "gpt-4o")
        result.current.updateFilter("dateFilter", "last_7_days")
        result.current.setPage(3)
      })

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filters.searchTerm).toBe("")
      expect(result.current.filters.modelFilter).toBe("all")
      expect(result.current.filters.dateFilter).toBe("all")
      expect(result.current.page).toBe(0)
    })

    it("should include filters in API request", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      act(() => {
        result.current.updateFilter("searchTerm", "cardiology")
        result.current.updateFilter("searchField", "case_title")
        result.current.updateFilter("modelFilter", "gpt-4o")
      })

      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        const callUrl = fetchMock.mock.calls[0][0] as string
        expect(callUrl).toContain("search_term=cardiology")
        expect(callUrl).toContain("search_field=case_title")
        expect(callUrl).toContain("ai_model=gpt-4o")
      })
    })

    it("should not include 'all' filters in API request", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        autoFetch: false,
      })
      )

      // Keep default filters (all are "all" or empty)
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        const callUrl = fetchMock.mock.calls[0][0] as string
        expect(callUrl).not.toContain("ai_model")
        expect(callUrl).not.toContain("date_filter")
      })
    })
  })

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  describe("Authorization", () => {
    it("should include auth token in request", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
        }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() =>
        useReportHistory({
        userRole: "admin",
        token: "test-token-123",
        autoFetch: false,
      })
      )

      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer test-token-123",
            }),
          })
        )
      })
    })
  })
})
