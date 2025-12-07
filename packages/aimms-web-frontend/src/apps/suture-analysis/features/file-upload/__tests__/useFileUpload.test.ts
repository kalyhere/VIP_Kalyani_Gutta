/**
 * Tests for useFileUpload hook
 * Tests file upload state management and handlers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFileUpload } from "../hooks/useFileUpload"
import { useNotificationStore } from "../../../../../stores/notificationStore"

// Mock notification store
const mockNotify = vi.fn()
vi.mock("../../../../../stores/notificationStore", () => ({
  useNotificationStore: vi.fn((selector) => {
    if (typeof selector === "function") {
      return selector({ notify: mockNotify })
    }
    return { notify: mockNotify }
  }),
}))

describe("useFileUpload", () => {
  beforeEach(() => {
    mockNotify.mockClear()

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with null values", () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.uploadedFile).toBeNull()
      expect(result.current.previewUrl).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe("handleFileChange", () => {
    it("should handle file upload with rawFile", () => {
      const { result } = renderHook(() => useFileUpload())
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "data:image/jpeg;base64,test",
          title: "test.jpg",
        })
      })

      expect(result.current.uploadedFile).toBe(mockFile)
      expect(result.current.error).toBeNull()
    })

    it("should handle file upload with nested files.rawFile", () => {
      const { result } = renderHook(() => useFileUpload())
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      act(() => {
        result.current.handleFileChange({
          files: { rawFile: mockFile },
          rawFile: {} as File, // This should be ignored
          src: "",
          title: "",
        } as any)
      })

      expect(result.current.uploadedFile).toBe(mockFile)
    })

    it("should handle null file input", () => {
      const { result } = renderHook(() => useFileUpload())
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      // First set a file
      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "",
          title: "",
        })
      })

      expect(result.current.uploadedFile).toBe(mockFile)

      // Then clear it
      act(() => {
        result.current.handleFileChange(null)
      })

      expect(result.current.uploadedFile).toBeNull()
    })

    it("should call onFileChange callback when provided", () => {
      const onFileChange = vi.fn()
      const { result } = renderHook(() => useFileUpload(onFileChange))
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "",
          title: "",
        })
      })

      expect(onFileChange).toHaveBeenCalledTimes(1)
    })

    it("should clear error when file changes", () => {
      const { result } = renderHook(() => useFileUpload())

      // Set an error first
      act(() => {
        result.current.setError("Test error")
      })

      expect(result.current.error).toBe("Test error")

      // Upload a file
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })
      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "",
          title: "",
        })
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("handleDropRejected", () => {
    it("should set error and notify user", () => {
      const { result } = renderHook(() => useFileUpload())

      act(() => {
        result.current.handleDropRejected()
      })

      expect(result.current.error).toBe("Only image files are allowed.")
      expect(mockNotify).toHaveBeenCalledWith("Only image files are allowed.", { type: "error" })
    })
  })

  describe("Preview URL Management", () => {
    it("should create preview URL when file is uploaded", () => {
      const { result } = renderHook(() => useFileUpload())
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "",
          title: "",
        })
      })

      expect(result.current.previewUrl).toBe("blob:mock-url")
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile)
    })

    it("should revoke old URL when file changes", async () => {
      const { result, rerender } = renderHook(() => useFileUpload())
      const mockFile1 = new File(["test1"], "test1.jpg", { type: "image/jpeg" })
      const mockFile2 = new File(["test2"], "test2.jpg", { type: "image/jpeg" })

      // Upload first file
      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile1,
          src: "",
          title: "",
        })
      })

      const firstUrl = result.current.previewUrl

      // Upload second file
      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile2,
          src: "",
          title: "",
        })
      })

      // Force cleanup by re-rendering
      rerender()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(firstUrl)
    })

    it("should revoke URL on unmount", () => {
      const { result, unmount } = renderHook(() => useFileUpload())
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" })

      act(() => {
        result.current.handleFileChange({
          rawFile: mockFile,
          src: "",
          title: "",
        })
      })

      const url = result.current.previewUrl

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })
  })

  describe("setError", () => {
    it("should set error message", () => {
      const { result } = renderHook(() => useFileUpload())

      act(() => {
        result.current.setError("Custom error message")
      })

      expect(result.current.error).toBe("Custom error message")
    })

    it("should clear error with null", () => {
      const { result } = renderHook(() => useFileUpload())

      act(() => {
        result.current.setError("Error")
      })

      expect(result.current.error).toBe("Error")

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })
  })
})
