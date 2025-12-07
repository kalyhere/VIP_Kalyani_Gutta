/**
 * Integration tests for useFileOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFileOperations } from "../../hooks/useFileOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import { resetStore, createMockCase } from "../../../../shared/__tests__/testUtils"
import * as fileOperations from "../../../../shared/utils/fileOperations"

// Mock file operations
vi.mock("../../../../shared/utils/fileOperations", () => ({
  downloadCases: vi.fn(),
  downloadFormat: vi.fn(),
  uploadFile: vi.fn(),
  getDefaultDownloadFileName: vi.fn((type: "cases" | "format") =>
    type === "cases" ? "medical-cases-2024-01-01" : "medical-case-format-2024-01-01"
  ),
}))

describe("useFileOperations", () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
  }

  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    // Mock Date
    const mockTimestamp = 1704067200000 // 2024-01-01T00:00:00.000Z
    const mockDate = new Date(mockTimestamp)
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as any)
    Object.defineProperty(global.Date, "now", {
      value: () => mockTimestamp,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useFileOperations())

    expect(result.current.isUploadDialogOpen).toBe(false)
    expect(result.current.uploadedContent).toBeNull()
    expect(result.current.isDownloadDialogOpen).toBe(false)
    expect(result.current.downloadFileName).toBe("")
    expect(result.current.downloadType).toBe("cases")
  })

  it("should handle starting a download", () => {
    const { result } = renderHook(() => useFileOperations())

    act(() => {
      result.current.handleStartDownload("cases")
    })

    expect(result.current.isDownloadDialogOpen).toBe(true)
    expect(result.current.downloadFileName).toBe("medical-cases-2024-01-01")
    expect(result.current.downloadType).toBe("cases")
  })

  it("should handle downloading cases", () => {
    const { result } = renderHook(() => useFileOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCases([mockCase])
      result.current.handleStartDownload("cases")
    })

    act(() => {
      result.current.setDownloadFileName("test-cases")
    })

    act(() => {
      result.current.handleDownloadMedicalCases()
    })

    expect(fileOperations.downloadCases).toHaveBeenCalledWith([mockCase], "test-cases")
    expect(result.current.isDownloadDialogOpen).toBe(false)
  })

  it("should handle downloading format", () => {
    const { result } = renderHook(() => useFileOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartDownload("format")
    })

    act(() => {
      result.current.setDownloadFileName("test-format")
    })

    act(() => {
      result.current.handleDownloadFormat()
    })

    expect(fileOperations.downloadFormat).toHaveBeenCalledWith(mockCase, "test-format")
    expect(result.current.isDownloadDialogOpen).toBe(false)
  })

  it("should handle file upload when no existing cases", async () => {
    const mockCase = createMockCase({ id: "case-2" })
    vi.mocked(fileOperations.uploadFile).mockResolvedValue({ cases: [mockCase] })

    const { result } = renderHook(() => useFileOperations())

    const file = new File(["{}"], "test.json", { type: "application/json" })
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleFileSelect(event)
    })

    const { cases } = useMCCStore.getState()
    expect(cases).toEqual([mockCase])
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "medicalCases",
      JSON.stringify([mockCase])
    )
    expect(result.current.isUploadDialogOpen).toBe(false)
  })

  it("should handle file upload with existing cases", async () => {
    const existingCase = createMockCase({ id: "case-1", name: "Existing Case" })
    const uploadedCase = createMockCase({ id: "case-2", name: "Uploaded Case" })
    vi.mocked(fileOperations.uploadFile).mockResolvedValue({ cases: [uploadedCase] })

    act(() => {
      useMCCStore.getState().setCases([existingCase])
    })

    const { result } = renderHook(() => useFileOperations())

    const file = new File(["{}"], "test.json", { type: "application/json" })
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleFileSelect(event)
    })

    expect(result.current.uploadedContent).toEqual({ cases: [uploadedCase] })
    expect(result.current.isUploadDialogOpen).toBe(true)
  })

  it("should handle merging cases", async () => {
    const existingCase = createMockCase({ id: "case-1", name: "Existing Case" })
    const uploadedCase = createMockCase({ id: "case-2", name: "New Case" })

    act(() => {
      useMCCStore.getState().setCases([existingCase])
    })

    const { result } = renderHook(() => useFileOperations())

    act(() => {
      result.current.setUploadedContent({ cases: [uploadedCase] })
    })

    act(() => {
      result.current.handleMergeCases()
    })

    const { cases } = useMCCStore.getState()
    expect(cases).toEqual([existingCase, uploadedCase])
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "medicalCases",
      JSON.stringify([existingCase, uploadedCase])
    )
    expect(result.current.isUploadDialogOpen).toBe(false)
    expect(result.current.uploadedContent).toBeNull()
  })

  it("should handle replacing cases", async () => {
    const existingCase = createMockCase({ id: "case-1", name: "Existing Case" })
    const uploadedCase = createMockCase({ id: "case-2", name: "Replacement Case" })

    act(() => {
      useMCCStore.getState().setCases([existingCase])
    })

    const { result } = renderHook(() => useFileOperations())

    act(() => {
      result.current.setUploadedContent({ cases: [uploadedCase] })
    })

    act(() => {
      result.current.handleReplaceCases()
    })

    const { cases } = useMCCStore.getState()
    expect(cases).toEqual([uploadedCase])
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "medicalCases",
      JSON.stringify([uploadedCase])
    )
    expect(result.current.isUploadDialogOpen).toBe(false)
    expect(result.current.uploadedContent).toBeNull()
  })

  it("should handle format upload", async () => {
    const mockCase = createMockCase({ id: "case-1", name: "Test Case", sections: [] })
    const uploadedCase = createMockCase({
      id: "case-1",
      sections: [{ id: "section-1", title: "New Section", tables: [] }],
    })
    vi.mocked(fileOperations.uploadFile).mockResolvedValue({ cases: [uploadedCase] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
    })

    const { result } = renderHook(() => useFileOperations())

    const file = new File(["{}"], "test.json", { type: "application/json" })
    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleUploadFormat(event)
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.sections).toEqual(uploadedCase.sections)
  })

  it("should handle file upload errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const windowAlert = vi.spyOn(window, "alert").mockImplementation(() => {})
    vi.mocked(fileOperations.uploadFile).mockRejectedValue(new Error("Invalid file"))

    const { result } = renderHook(() => useFileOperations())

    const file = new File(["{}"], "test.json", { type: "application/json" })
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleFileSelect(event)
    })

    expect(consoleError).toHaveBeenCalled()
    expect(windowAlert).toHaveBeenCalledWith("Invalid file format")

    consoleError.mockRestore()
    windowAlert.mockRestore()
  })

  it("should handle format upload errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const windowAlert = vi.spyOn(window, "alert").mockImplementation(() => {})
    vi.mocked(fileOperations.uploadFile).mockRejectedValue(new Error("Invalid file"))

    act(() => {
      useMCCStore.getState().setCurrentCase(createMockCase())
    })

    const { result } = renderHook(() => useFileOperations())

    const file = new File(["{}"], "test.json", { type: "application/json" })
    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleUploadFormat(event)
    })

    expect(consoleError).toHaveBeenCalled()
    expect(windowAlert).toHaveBeenCalledWith("Invalid format file")

    consoleError.mockRestore()
    windowAlert.mockRestore()
  })

  it("should handle upload click", () => {
    const mockFileInput = document.createElement("input")
    const mockClick = vi.fn()
    mockFileInput.click = mockClick

    const { result } = renderHook(() => {
      const hook = useFileOperations()
      // @ts-ignore - we need to set this for testing
      hook.fileInputRef.current = mockFileInput
      return hook
    })

    act(() => {
      result.current.handleUploadClick()
    })

    expect(mockClick).toHaveBeenCalled()
  })
})
