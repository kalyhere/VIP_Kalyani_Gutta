import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import EditableCell from "../../components/EditableCell"

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
window.IntersectionObserver = mockIntersectionObserver

describe("EditableCell", () => {
  const mockCell = {
    id: "cell-1",
    content: "Initial content",
    isHeader: false,
    colSpan: 1,
  }

  const mockTableId = "table-1"
  const mockRowId = "row-1"
  const mockOnCellChange = vi.fn()
  const mockAttemptedFields = new Set<string>()
  const mockIsValidVariableFormat = vi.fn(
    (content) => !content.includes("{") || (content.includes("{") && content.includes("}"))
  )

  const theme = createTheme()

  const renderWithTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)

  beforeEach(() => {
    vi.clearAllMocks()
    mockAttemptedFields.clear()
  })

  it("renders with initial content", () => {
    renderWithTheme(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("Initial content")
    expect(textField).toBeInTheDocument()
  })

  it("updates local content on change", () => {
    renderWithTheme(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("Initial content")
    fireEvent.change(textField, { target: { value: "New content" } })

    expect(screen.getByDisplayValue("New content")).toBeInTheDocument()
    // Should not call onCellChange yet (only on blur or when brackets are added)
    expect(mockOnCellChange).not.toHaveBeenCalled()
  })

  it("calls onCellChange on blur if content changed", () => {
    render(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("Initial content")
    fireEvent.change(textField, { target: { value: "New content" } })
    fireEvent.blur(textField)

    expect(mockOnCellChange).toHaveBeenCalledWith(
      mockTableId,
      mockRowId,
      mockCell.id,
      "New content"
    )
  })

  it("does not call onCellChange on blur if content is unchanged", () => {
    render(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("Initial content")
    fireEvent.blur(textField)

    expect(mockOnCellChange).not.toHaveBeenCalled()
  })

  it("calls onCellChange immediately when brackets are added", () => {
    render(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("Initial content")
    fireEvent.change(textField, { target: { value: "Initial content {variable}" } })

    expect(mockOnCellChange).toHaveBeenCalledWith(
      mockTableId,
      mockRowId,
      mockCell.id,
      "Initial content {variable}"
    )
  })

  it("shows error state when field is attempted and has invalid variable format", () => {
    mockAttemptedFields.add("cell-1")
    mockIsValidVariableFormat.mockReturnValueOnce(false)

    render(
      <EditableCell
        cell={{ ...mockCell, content: "{invalid" }}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const textField = screen.getByDisplayValue("{invalid")
    expect(textField).toHaveAttribute("aria-invalid", "true")
    expect(mockIsValidVariableFormat).toHaveBeenCalledWith("{invalid")
  })

  it("updates when cell content prop changes", () => {
    const { rerender } = render(
      <EditableCell
        cell={mockCell}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    expect(screen.getByDisplayValue("Initial content")).toBeInTheDocument()

    rerender(
      <EditableCell
        cell={{ ...mockCell, content: "Updated content" }}
        tableId={mockTableId}
        rowId={mockRowId}
        onCellChange={mockOnCellChange}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    expect(screen.getByDisplayValue("Updated content")).toBeInTheDocument()
  })
})
