import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useReportHandlers } from "../useReportHandlers"
import { exportReportsToCSV } from "../../../../shared/utils/csvExport"

vi.mock("../../../../shared/utils/csvExport")

describe("useReportHandlers", () => {
  const mockReport = {
    report_id: 1,
    case_title: "Test",
    percentage_score: 85,
    updated_at: "2024-01-15T10:00:00Z",
    status: "completed",
    total_points_earned: 85,
    total_points_possible: 100,
  }

  const defaultOptions = {
    setAnchorEl: vi.fn(),
    setSelectedReportIdForAction: vi.fn(),
    setShareDialogOpen: vi.fn(),
    setDeleteDialogOpen: vi.fn(),
    setSelectedReportIds: vi.fn(),
    toggleSelectedReportId: vi.fn(),
    setExportMode: vi.fn(),
    setExportingCSV: vi.fn(),
    showSnackbar: vi.fn(),
    selectedReportIds: new Set<number>(),
    selectedReportIdForAction: null,
    standaloneReports: [mockReport],
    deleteReport: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should handle actions click", () => {
    const setAnchorEl = vi.fn()
    const setSelectedReportIdForAction = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, setAnchorEl, setSelectedReportIdForAction })
    )

    const event = {
      currentTarget: document.createElement("button"),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent<HTMLElement>

    act(() => {
      result.current.handleActionsClick(event, 1)
    })

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(setAnchorEl).toHaveBeenCalledWith(event.currentTarget)
    expect(setSelectedReportIdForAction).toHaveBeenCalledWith(1)
  })

  it("should handle actions close", () => {
    const setAnchorEl = vi.fn()
    const setSelectedReportIdForAction = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, setAnchorEl, setSelectedReportIdForAction })
    )

    act(() => {
      result.current.handleActionsClose()
    })

    expect(setAnchorEl).toHaveBeenCalledWith(null)
    expect(setSelectedReportIdForAction).toHaveBeenCalledWith(null)
  })

  it("should handle share click", () => {
    const setShareDialogOpen = vi.fn()
    const setAnchorEl = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, setShareDialogOpen, setAnchorEl })
    )

    act(() => {
      result.current.handleShareClick()
    })

    expect(setShareDialogOpen).toHaveBeenCalledWith(true)
    expect(setAnchorEl).toHaveBeenCalledWith(null)
  })

  it("should handle delete click", () => {
    const setDeleteDialogOpen = vi.fn()
    const setAnchorEl = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, setDeleteDialogOpen, setAnchorEl })
    )

    act(() => {
      result.current.handleDeleteClick()
    })

    expect(setDeleteDialogOpen).toHaveBeenCalledWith(true)
    expect(setAnchorEl).toHaveBeenCalledWith(null)
  })

  it("should handle delete confirm successfully", async () => {
    const deleteReport = vi.fn().mockResolvedValue(true)
    const showSnackbar = vi.fn()
    const setDeleteDialogOpen = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({
      ...defaultOptions,
      selectedReportIdForAction: 1,
      deleteReport,
      showSnackbar,
      setDeleteDialogOpen,
    })
    )

    await act(async () => {
      await result.current.handleDeleteConfirm()
    })

    expect(deleteReport).toHaveBeenCalledWith(1)
    expect(showSnackbar).toHaveBeenCalledWith("Report deleted successfully", "success")
    expect(setDeleteDialogOpen).toHaveBeenCalledWith(false)
  })

  it("should handle select report", () => {
    const toggleSelectedReportId = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, toggleSelectedReportId })
    )

    act(() => {
      result.current.handleSelectReport(1)
    })

    expect(toggleSelectedReportId).toHaveBeenCalledWith(1)
  })

  it("should handle select all when none selected", () => {
    const setSelectedReportIds = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({
      ...defaultOptions,
      setSelectedReportIds,
      selectedReportIds: new Set(),
    })
    )

    act(() => {
      result.current.handleSelectAll()
    })

    expect(setSelectedReportIds).toHaveBeenCalledWith(new Set([1]))
  })

  it("should handle CSV export", async () => {
    const mockExportResult = {
      success: true,
      message: "Export successful",
      severity: "success" as const,
    }
    vi.mocked(exportReportsToCSV).mockResolvedValue(mockExportResult)

    const setExportingCSV = vi.fn()
    const showSnackbar = vi.fn()
    const setSelectedReportIds = vi.fn()
    const setExportMode = vi.fn()

    const { result } = renderHook(() =>
      useReportHandlers({
      ...defaultOptions,
      selectedReportIds: new Set([1, 2]),
      setExportingCSV,
      showSnackbar,
      setSelectedReportIds,
      setExportMode,
    })
    )

    await act(async () => {
      await result.current.handleExportCSV()
    })

    expect(setExportingCSV).toHaveBeenCalledWith(true)
    expect(showSnackbar).toHaveBeenCalledWith("Export successful", "success")
    expect(setSelectedReportIds).toHaveBeenCalledWith(new Set())
    expect(setExportMode).toHaveBeenCalledWith(false)
  })

  it("should handle cancel export", () => {
    const setExportMode = vi.fn()
    const setSelectedReportIds = vi.fn()
    const { result } = renderHook(() =>
      useReportHandlers({ ...defaultOptions, setExportMode, setSelectedReportIds })
    )

    act(() => {
      result.current.handleCancelExport()
    })

    expect(setExportMode).toHaveBeenCalledWith(false)
    expect(setSelectedReportIds).toHaveBeenCalledWith(new Set())
  })
})
