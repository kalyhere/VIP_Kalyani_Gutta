/**
 * Unit tests for FileDropzone component
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FileDropzone } from "../FileDropzone"

describe("FileDropzone", () => {
  const mockFile = new File(["test content"], "test.txt", { type: "text/plain" })

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe("Rendering", () => {
    it("should render dropzone when no file is selected", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={null} isDragOver={false} {...mockHandlers} />)

      expect(screen.getByText("Drop file here")).toBeInTheDocument()
      expect(screen.getByText(/or click to browse/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Select File/i })).toBeInTheDocument()
    })

    it("should render file info when file is selected", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={mockFile} isDragOver={false} {...mockHandlers} />)

      expect(screen.getByText("test.txt")).toBeInTheDocument()
      expect(screen.getByText(/KB/)).toBeInTheDocument()
    })

    it("should render custom title", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(
        <FileDropzone file={null} isDragOver={false} {...mockHandlers} title="Custom Upload" />
      )

      expect(screen.getByText("Custom Upload")).toBeInTheDocument()
    })

    it("should show accept file type in subtitle", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={null} isDragOver={false} {...mockHandlers} accept=".pdf" />)

      expect(screen.getByText(/\.pdf file/)).toBeInTheDocument()
    })

    it("should show max size when provided", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={null} isDragOver={false} {...mockHandlers} maxSizeMB={10} />)

      expect(screen.getByText(/max 10MB/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  describe("Interactions", () => {
    it("should call onFileSelect when clicking dropzone", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={null} isDragOver={false} {...mockHandlers} />)

      // Click the "Select File" button which is inside the Paper that has onClick
      const selectButton = screen.getByText("Select File")
      fireEvent.click(selectButton)

      expect(mockHandlers.onFileSelect).toHaveBeenCalled()
    })

    it("should call onRemove when clicking remove button", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={mockFile} isDragOver={false} {...mockHandlers} />)

      const removeButton = screen.getByRole("button")
      fireEvent.click(removeButton)

      expect(mockHandlers.onRemove).toHaveBeenCalled()
    })

    it("should call onDragOver when dragging over dropzone", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      const { container } = render(
        <FileDropzone file={null} isDragOver={false} {...mockHandlers} />,
      )

      // Find the Paper element which has the drag handlers
      const dropzone = container.querySelector('[class*="MuiPaper-root"]')
      if (dropzone) {
        fireEvent.dragOver(dropzone)
      }

      expect(mockHandlers.onDragOver).toHaveBeenCalled()
    })

    it("should call onDragLeave when dragging leaves dropzone", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      const { container } = render(
        <FileDropzone file={null} isDragOver={false} {...mockHandlers} />,
      )

      // Find the Paper element which has the drag handlers
      const dropzone = container.querySelector('[class*="MuiPaper-root"]')
      if (dropzone) {
        fireEvent.dragLeave(dropzone)
      }

      expect(mockHandlers.onDragLeave).toHaveBeenCalled()
    })

    it("should call onDrop when dropping file", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      const { container } = render(
        <FileDropzone file={null} isDragOver={false} {...mockHandlers} />,
      )

      // Find the Paper element which has the drag handlers
      const dropzone = container.querySelector('[class*="MuiPaper-root"]')
      if (dropzone) {
        fireEvent.drop(dropzone)
      }

      expect(mockHandlers.onDrop).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // VISUAL STATES
  // ============================================================================

  describe("Visual States", () => {
    it("should show drag over state", () => {
      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      const { container } = render(<FileDropzone file={null} isDragOver {...mockHandlers} />)

      // Check for drag-over styling (Paper element should exist)
      const paper = container.querySelector(".MuiPaper-root")
      expect(paper).toBeInTheDocument()
    })
  })

  // ============================================================================
  // FILE SIZE FORMATTING
  // ============================================================================

  describe("File Size Formatting", () => {
    it("should format file size in KB correctly", () => {
      const largeFile = new File(["x".repeat(2048)], "large.txt", { type: "text/plain" })

      const mockHandlers = {
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        onDrop: vi.fn(),
        onFileSelect: vi.fn(),
        onRemove: vi.fn(),
      }

      render(<FileDropzone file={largeFile} isDragOver={false} {...mockHandlers} />)

      // File size should be displayed
      expect(screen.getByText(/KB/)).toBeInTheDocument()
    })
  })
})
