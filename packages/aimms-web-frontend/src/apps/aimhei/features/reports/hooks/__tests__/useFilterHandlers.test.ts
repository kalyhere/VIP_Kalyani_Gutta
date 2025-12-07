import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFilterHandlers, type UseFilterHandlersOptions } from "../useFilterHandlers"
import { type ReportFiltersState } from "../../../../stores/aimheiStore"

describe("useFilterHandlers", () => {
  const defaultOptions: UseFilterHandlersOptions = {
    searchTerm: "",
    setSearchTerm: vi.fn(),
    filters: {
      searchTerm: "",
      searchField: "all",
      modelFilter: "all",
      dateFilter: "all",
      dateRange: { start: null, end: null, macro: "all" },
      selectedFolders: [],
    },
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setRowsPerPage: vi.fn(),
  }

  it("should return filter values from filters object", () => {
    const { result } = renderHook(() => useFilterHandlers(defaultOptions))

    expect(result.current.searchField).toBe("all")
    expect(result.current.modelFilter).toBe("all")
    expect(result.current.dateFilter).toBe("all")
    expect(result.current.dateRange).toEqual({ start: null, end: null, macro: "all" })
  })

  it("should update search field", () => {
    const setFilters = vi.fn()
    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, setFilters }))

    act(() => {
      result.current.setSearchField("case_title")
    })

    expect(setFilters).toHaveBeenCalledWith({
      searchField: "case_title",
    })
  })

  it("should update model filter", () => {
    const setFilters = vi.fn()
    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, setFilters }))

    act(() => {
      result.current.setModelFilter("gpt-4o")
    })

    expect(setFilters).toHaveBeenCalledWith({
      modelFilter: "gpt-4o",
    })
  })

  it("should update date filter", () => {
    const setFilters = vi.fn()
    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, setFilters }))

    act(() => {
      result.current.setDateFilter("today")
    })

    expect(setFilters).toHaveBeenCalledWith({
      dateFilter: "today",
    })
  })

  it("should clear all filters", () => {
    const setFilters = vi.fn()
    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, setFilters }))

    act(() => {
      result.current.clearAllFilters()
    })

    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: "",
        searchField: "all",
        modelFilter: "all",
        dateFilter: "all",
        dateRange: { start: null, end: null, macro: "all" },
      })
    )
  })

  it("should detect active filters when searchTerm exists", () => {
    const { result } = renderHook(() =>
      useFilterHandlers({ ...defaultOptions, searchTerm: "test" })
    )

    expect(result.current.hasActiveFilters).toBe(true)
  })

  it("should detect active filters when searchField is not default", () => {
    const filters: ReportFiltersState = {
      searchTerm: "",
      searchField: "patient_id", // Different from default "all"
      modelFilter: "all",
      dateFilter: "all",
      dateRange: { start: null, end: null, macro: "all" },
      selectedFolders: [],
    }

    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, filters }))

    expect(result.current.hasActiveFilters).toBe(true)
  })

  it("should detect no active filters when all are default", () => {
    const { result } = renderHook(() => useFilterHandlers(defaultOptions))

    expect(result.current.hasActiveFilters).toBe(false)
  })

  it("should handle page change", () => {
    const setPage = vi.fn()
    const { result } = renderHook(() => useFilterHandlers({ ...defaultOptions, setPage }))

    act(() => {
      result.current.handleChangePage(null, 2)
    })

    expect(setPage).toHaveBeenCalledWith(2)
  })

  it("should handle rows per page change and reset page", () => {
    const setPage = vi.fn()
    const setRowsPerPage = vi.fn()
    const { result } = renderHook(() =>
      useFilterHandlers({ ...defaultOptions, setPage, setRowsPerPage })
    )

    const event = { target: { value: "25" } } as React.ChangeEvent<HTMLInputElement>

    act(() => {
      result.current.handleChangeRowsPerPage(event)
    })

    expect(setRowsPerPage).toHaveBeenCalledWith(25)
    expect(setPage).toHaveBeenCalledWith(0)
  })
})
