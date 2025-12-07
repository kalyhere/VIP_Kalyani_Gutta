/**
 * Unit tests for useReportActions hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useReportActions } from "../useReportActions"

describe("useReportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useReportActions())

      expect(result.current.deleting).toBe(false)
      expect(result.current.sharing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  // ============================================================================
  // DELETE REPORT
  // ============================================================================

  describe("Delete Report", () => {
    it("should successfully delete a report", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = fetchMock

      const onDelete = vi.fn()
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        apiUrl: "http://test-api.com",
        token: "test-token",
        onDelete,
        onSuccess,
      })
      )

      let success: boolean = false

      await act(async () => {
        success = await result.current.deleteReport(123)
      })

      expect(success).toBe(true)
      expect(result.current.deleting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(onDelete).toHaveBeenCalledWith(123)
      expect(onSuccess).toHaveBeenCalledWith("Report deleted successfully")

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api.com/api/aimhei-reports/123",
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      )
    })

    it("should handle delete errors", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Unauthorized" }),
      })
      global.fetch = fetchMock

      const onError = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        onError,
      })
      )

      let success: boolean = true

      await act(async () => {
        success = await result.current.deleteReport(123)
      })

      expect(success).toBe(false)
      expect(result.current.deleting).toBe(false)
      expect(result.current.error).toBe("Unauthorized")
      expect(onError).toHaveBeenCalledWith("Unauthorized")
    })

    it("should handle network errors during delete", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"))
      global.fetch = fetchMock

      const { result } = renderHook(() => useReportActions())

      let success: boolean = true

      await act(async () => {
        success = await result.current.deleteReport(123)
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe("Network error")
    })

    it("should complete delete and reset deleting state", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() => useReportActions())

      await act(async () => {
        await result.current.deleteReport(123)
      })

      // Should not be deleting after completion
      expect(result.current.deleting).toBe(false)
    })
  })

  // ============================================================================
  // SHARE REPORT
  // ============================================================================

  describe("Share Report", () => {
    it("should successfully share a report", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = fetchMock

      const onShare = vi.fn()
      const onSuccess = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        apiUrl: "http://test-api.com",
        onShare,
        onSuccess,
      })
      )

      let success: boolean = false

      await act(async () => {
        success = await result.current.shareReport(123, "colleague@example.com")
      })

      expect(success).toBe(true)
      expect(result.current.sharing).toBe(false)
      expect(onShare).toHaveBeenCalledWith(123)
      expect(onSuccess).toHaveBeenCalledWith("Report shared successfully")

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api.com/api/aimhei-reports/123/share",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ recipient_email: "colleague@example.com" }),
        })
      )
    })

    it("should handle share errors", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Invalid email" }),
      })
      global.fetch = fetchMock

      const onError = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        onError,
      })
      )

      let success: boolean = true

      await act(async () => {
        success = await result.current.shareReport(123, "invalid-email")
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe("Invalid email")
      expect(onError).toHaveBeenCalledWith("Invalid email")
    })

    it("should complete share and reset sharing state", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() => useReportActions())

      await act(async () => {
        await result.current.shareReport(123, "test@example.com")
      })

      expect(result.current.sharing).toBe(false)
    })
  })

  // ============================================================================
  // DOWNLOAD REPORT
  // ============================================================================

  describe("Download Report", () => {
    it("should call download API endpoint", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" })
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      })
      global.fetch = fetchMock

      // Mock URL.createObjectURL - required by downloadReport
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
      global.URL.revokeObjectURL = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        apiUrl: "http://test-api.com",
      })
      )

      await act(async () => {
        await result.current.downloadReport(123)
      })

      expect(fetchMock).toHaveBeenCalledWith(
        "http://test-api.com/api/aimhei-reports/123/download",
        expect.any(Object)
      )
    })
  })

  // ============================================================================
  // VIEW REPORT
  // ============================================================================

  describe("View Report", () => {
    it("should trigger onView callback", async () => {
      const onView = vi.fn()

      const { result } = renderHook(() =>
        useReportActions({
        onView,
      })
      )

      await act(async () => {
        result.current.viewReport(123)
      })

      expect(onView).toHaveBeenCalledWith(123)
    })

    it("should not error if onView is not provided", async () => {
      const { result } = renderHook(() => useReportActions())

      await act(async () => {
        expect(() => {
          result.current.viewReport(123)
        }).not.toThrow()
      })
    })
  })

  // ============================================================================
  // RESET STATE
  // ============================================================================

  describe("Reset State", () => {
    it("should reset all state", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Error occurred" }),
      })
      global.fetch = fetchMock

      const { result } = renderHook(() => useReportActions())

      // Trigger an error
      await act(async () => {
        await result.current.deleteReport(123)
      })

      expect(result.current.error).toBe("Error occurred")

      // Reset state
      act(() => {
        result.current.resetState()
      })

      expect(result.current.deleting).toBe(false)
      expect(result.current.sharing).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })
})
