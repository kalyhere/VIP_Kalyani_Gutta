import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useUIState } from "../useUIState"

describe("useUIState", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUIState())

    expect(result.current.loadingTile).toBeNull()
    expect(result.current.expandedCards.size).toBe(0)
    expect(result.current.exportMode).toBe(false)
    expect(result.current.selectedReportIds.size).toBe(0)
    expect(result.current.exportingCSV).toBe(false)
    expect(result.current.anchorEl).toBeNull()
    expect(result.current.selectedReportIdForAction).toBeNull()
    expect(result.current.deleteDialogOpen).toBe(false)
    expect(result.current.shareDialogOpen).toBe(false)
    expect(result.current.snackbar.open).toBe(false)
  })

  it("should toggle card expansion", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.toggleCardExpansion(1)
    })

    expect(result.current.expandedCards.has(1)).toBe(true)

    act(() => {
      result.current.toggleCardExpansion(1)
    })

    expect(result.current.expandedCards.has(1)).toBe(false)
  })

  it("should set export mode", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setExportMode(true)
    })

    expect(result.current.exportMode).toBe(true)
  })

  it("should set selected report IDs", () => {
    const { result } = renderHook(() => useUIState())

    const ids = new Set([1, 2, 3])

    act(() => {
      result.current.setSelectedReportIds(ids)
    })

    expect(result.current.selectedReportIds).toEqual(ids)
  })

  it("should set anchor element", () => {
    const { result } = renderHook(() => useUIState())
    const element = document.createElement("div")

    act(() => {
      result.current.setAnchorEl(element)
    })

    expect(result.current.anchorEl).toBe(element)
  })

  it("should set selected report ID for action", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setSelectedReportIdForAction(123)
    })

    expect(result.current.selectedReportIdForAction).toBe(123)
  })

  it("should set delete dialog open", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setDeleteDialogOpen(true)
    })

    expect(result.current.deleteDialogOpen).toBe(true)
  })

  it("should set share dialog open", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setShareDialogOpen(true)
    })

    expect(result.current.shareDialogOpen).toBe(true)
  })

  it("should show snackbar", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.showSnackbar("Test message", "success")
    })

    expect(result.current.snackbar).toEqual({
      open: true,
      message: "Test message",
      severity: "success",
    })
  })

  it("should hide snackbar", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.showSnackbar("Test message", "success")
    })

    act(() => {
      result.current.hideSnackbar()
    })

    expect(result.current.snackbar.open).toBe(false)
  })

  it("should set loading tile", () => {
    const { result } = renderHook(() => useUIState())

    const loadingTile = {
      title: "Processing",
      progress: 50,
      message: "Please wait...",
    }

    act(() => {
      result.current.setLoadingTile(loadingTile)
    })

    expect(result.current.loadingTile).toEqual(loadingTile)
  })

  it("should set exporting CSV", () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setExportingCSV(true)
    })

    expect(result.current.exportingCSV).toBe(true)
  })
})
