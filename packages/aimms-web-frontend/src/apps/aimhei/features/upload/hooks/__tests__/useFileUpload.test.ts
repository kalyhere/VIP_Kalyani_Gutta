/**
 * Unit tests for useFileUpload hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFileUpload } from "../useFileUpload"

describe("useFileUpload", () => {
  let mockOnFileSelect: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnFileSelect = vi.fn()
    mockOnError = vi.fn()
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with null file", () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.file).toBeNull()
      expect(result.current.isDragOver).toBe(false)
    })

    it("should initialize with a fileInputRef", () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.fileInputRef).toBeDefined()
      expect(result.current.fileInputRef.current).toBeNull() // Not attached to DOM
    })

    it("should accept callbacks in options", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
        onError: mockOnError,
      })
      )

      expect(result.current).toBeDefined()
    })
  })

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================

  describe("Drag and Drop", () => {
    it("should set isDragOver to true on drag over", () => {
      const { result } = renderHook(() => useFileUpload())

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [] },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDragOver(mockEvent)
      })

      expect(result.current.isDragOver).toBe(true)
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it("should set isDragOver to false on drag leave", () => {
      const { result } = renderHook(() => useFileUpload())

      // First set to true
      const dragOverEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDragOver(dragOverEvent)
      })

      expect(result.current.isDragOver).toBe(true)

      // Then drag leave
      const dragLeaveEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDragLeave(dragLeaveEvent)
      })

      expect(result.current.isDragOver).toBe(false)
      expect(dragLeaveEvent.preventDefault).toHaveBeenCalled()
    })

    it("should handle file drop with valid .txt file", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
        onError: mockOnError,
      })
      )

      const mockFile = new File(["transcript content"], "interview.txt", {
        type: "text/plain",
      })

      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [mockFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      expect(result.current.file).toBe(mockFile)
      expect(result.current.isDragOver).toBe(false)
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile, "Interview")
      expect(mockOnError).not.toHaveBeenCalled()
    })

    it("should call onError when dropping non-.txt file", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
        onError: mockOnError,
      })
      )

      const mockFile = new File(["pdf content"], "document.pdf", {
        type: "application/pdf",
      })

      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [mockFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      expect(result.current.file).toBeNull()
      expect(mockOnError).toHaveBeenCalledWith("Please drop a .txt transcript file")
      expect(mockOnFileSelect).not.toHaveBeenCalled()
    })

    it("should handle multiple files and select first valid one", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
      })
      )

      const pdfFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" })
      const txtFile = new File(["text"], "transcript.txt", { type: "text/plain" })

      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [pdfFile, txtFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(dropEvent)
      })

      expect(result.current.file).toBe(txtFile)
      expect(mockOnFileSelect).toHaveBeenCalledWith(txtFile, "Transcript")
    })
  })

  // ============================================================================
  // FILE INPUT
  // ============================================================================

  describe("File Input", () => {
    it("should handle file input change with valid file", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
      })
      )

      const mockFile = new File(["content"], "patient-interview.txt", {
        type: "text/plain",
      })

      const changeEvent = {
        target: {
          files: [mockFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileChange(changeEvent)
      })

      expect(result.current.file).toBe(mockFile)
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile, "Patient Interview")
    })

    it("should call onError when selecting invalid file", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onError: mockOnError,
      })
      )

      const mockFile = new File(["content"], "image.jpg", { type: "image/jpeg" })

      const changeEvent = {
        target: {
          files: [mockFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileChange(changeEvent)
      })

      expect(result.current.file).toBeNull()
      expect(mockOnError).toHaveBeenCalledWith("Please select a .txt transcript file")
    })

    it("should handle fileInputRef click", () => {
      const { result } = renderHook(() => useFileUpload())

      // Mock the ref with a click function
      const mockClick = vi.fn()
      result.current.fileInputRef.current = { click: mockClick } as any

      act(() => {
        result.current.handleFileSelect()
      })

      expect(mockClick).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // FILE REMOVAL
  // ============================================================================

  describe("File Removal", () => {
    it("should remove file and reset state", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        onFileSelect: mockOnFileSelect,
      })
      )

      // First add a file
      const mockFile = new File(["content"], "test.txt", { type: "text/plain" })

      const changeEvent = {
        target: {
          files: [mockFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileChange(changeEvent)
      })

      expect(result.current.file).toBe(mockFile)

      // Then remove it
      act(() => {
        result.current.removeFile()
      })

      expect(result.current.file).toBeNull()
    })

    it("should clear fileInputRef value when removing file", () => {
      const { result } = renderHook(() => useFileUpload())

      // Mock the ref
      const mockInput = { value: "fake-path.txt" } as any
      result.current.fileInputRef.current = mockInput

      act(() => {
        result.current.removeFile()
      })

      expect(mockInput.value).toBe("")
    })
  })

  // ============================================================================
  // FILENAME CLEANING
  // ============================================================================

  describe("Filename Cleaning", () => {
    it("should clean filename with underscores", () => {
      const { result } = renderHook(() => useFileUpload())

      const cleaned = result.current.getCleanedFilename("patient_interview_2024.txt")

      expect(cleaned).toBe("Patient Interview 2024")
    })

    it("should clean filename with hyphens", () => {
      const { result } = renderHook(() => useFileUpload())

      const cleaned = result.current.getCleanedFilename("john-doe-transcript.txt")

      expect(cleaned).toBe("John Doe Transcript")
    })

    it("should capitalize first letter of each word", () => {
      const { result } = renderHook(() => useFileUpload())

      const cleaned = result.current.getCleanedFilename("medical-history-intake.txt")

      expect(cleaned).toBe("Medical History Intake")
    })

    it("should remove file extension", () => {
      const { result } = renderHook(() => useFileUpload())

      const cleaned = result.current.getCleanedFilename("transcript.txt")

      expect(cleaned).toBe("Transcript")
    })

    it("should handle mixed separators", () => {
      const { result } = renderHook(() => useFileUpload())

      const cleaned = result.current.getCleanedFilename("patient_interview-notes_2024.txt")

      expect(cleaned).toBe("Patient Interview Notes 2024")
    })
  })

  // ============================================================================
  // CUSTOM ACCEPTED TYPES
  // ============================================================================

  describe("Custom Accepted Types", () => {
    it("should accept custom file types", () => {
      const { result } = renderHook(() =>
        useFileUpload({
        acceptedTypes: [".md", ".csv"],
        onFileSelect: mockOnFileSelect,
      })
      )

      const mdFile = new File(["# Markdown"], "notes.md", {
        type: "text/markdown",
      })

      const changeEvent = {
        target: {
          files: [mdFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileChange(changeEvent)
      })

      expect(result.current.file).toBe(mdFile)
      expect(mockOnFileSelect).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // STABILITY
  // ============================================================================

  describe("Function Stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useFileUpload())

      const initialHandlers = {
        handleDragOver: result.current.handleDragOver,
        handleDragLeave: result.current.handleDragLeave,
        handleDrop: result.current.handleDrop,
        handleFileSelect: result.current.handleFileSelect,
        handleFileChange: result.current.handleFileChange,
        removeFile: result.current.removeFile,
      }

      rerender()

      expect(result.current.handleDragOver).toBe(initialHandlers.handleDragOver)
      expect(result.current.handleDragLeave).toBe(initialHandlers.handleDragLeave)
      expect(result.current.handleDrop).toBe(initialHandlers.handleDrop)
      expect(result.current.handleFileSelect).toBe(initialHandlers.handleFileSelect)
      expect(result.current.handleFileChange).toBe(initialHandlers.handleFileChange)
      expect(result.current.removeFile).toBe(initialHandlers.removeFile)
    })
  })
})
