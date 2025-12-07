import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import TableRow from "../../components/TableRow"

describe("TableRow", () => {
  const mockRow = {
    id: "row-1",
    cells: [
      { id: "cell-1", content: "Cell 1", isHeader: false },
      { id: "cell-2", content: "Cell 2", isHeader: false },
      { id: "cell-3", content: "{variable}", isHeader: false },
    ],
  }

  const mockTableId = "table-1"
  const mockOnCellChange = vi.fn()
  const mockOnDeleteRow = vi.fn()
  const mockAttemptedFields = new Set<string>()
  const mockIsValidVariableFormat = vi.fn(
    (content) => !content.includes("{") || (content.includes("{") && content.includes("}"))
  )

  beforeEach(() => {
    vi.clearAllMocks()
    mockAttemptedFields.clear()
  })

  it("renders all cells in the row", () => {
    render(
      <TableRow
        row={mockRow}
        tableId={mockTableId}
        isHeader={false}
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    expect(screen.getByDisplayValue("Cell 1")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Cell 2")).toBeInTheDocument()
    expect(screen.getByDisplayValue("{variable}")).toBeInTheDocument()
  })

  it("renders header cells with appropriate styling", () => {
    const headerRow = {
      id: "header-row",
      cells: [
        { id: "header-1", content: "Header 1", isHeader: true },
        { id: "header-2", content: "Header 2", isHeader: true },
      ],
    }

    render(
      <TableRow
        row={headerRow}
        tableId={mockTableId}
        isHeader
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    expect(screen.getByDisplayValue("Header 1")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Header 2")).toBeInTheDocument()
  })

  it("calls onCellChange when a cell is edited", () => {
    render(
      <TableRow
        row={mockRow}
        tableId={mockTableId}
        isHeader={false}
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const cellInput = screen.getByDisplayValue("Cell 1")
    fireEvent.change(cellInput, { target: { value: "Updated Cell 1" } })
    fireEvent.blur(cellInput)

    expect(mockOnCellChange).toHaveBeenCalledWith(
      mockTableId,
      mockRow.id,
      "cell-1",
      "Updated Cell 1"
    )
  })

  it("calls onDeleteRow when delete button is clicked", () => {
    render(
      <TableRow
        row={mockRow}
        tableId={mockTableId}
        isHeader={false}
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const deleteButton = screen.getByLabelText("Delete Row")
    fireEvent.click(deleteButton)

    expect(mockOnDeleteRow).toHaveBeenCalledWith(mockTableId, mockRow.id)
  })

  it("does not render delete button for header row", () => {
    const headerRow = {
      id: "header-row",
      cells: [
        { id: "header-1", content: "Header 1", isHeader: true },
        { id: "header-2", content: "Header 2", isHeader: true },
      ],
    }

    render(
      <TableRow
        row={headerRow}
        tableId={mockTableId}
        isHeader
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    const deleteButton = screen.queryByLabelText("Delete Row")
    expect(deleteButton).not.toBeInTheDocument()
  })

  it("renders cells with AI generated content", () => {
    const rowWithAIContent = {
      id: "row-2",
      cells: [
        {
          id: "cell-4",
          content: "AI Generated",
          isHeader: false,
          isAIGenerated: true,
          originalVariable: "{var}",
        },
        { id: "cell-5", content: "Regular", isHeader: false },
      ],
    }

    render(
      <TableRow
        row={rowWithAIContent}
        tableId={mockTableId}
        isHeader={false}
        onCellChange={mockOnCellChange}
        onDeleteRow={mockOnDeleteRow}
        attemptedFields={mockAttemptedFields}
        isValidVariableFormat={mockIsValidVariableFormat}
      />
    )

    expect(screen.getByDisplayValue("AI Generated")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Regular")).toBeInTheDocument()

    // Check for AI indicator (this will depend on your implementation)
    const aiIndicator = screen.queryByTestId("AutoAwesomeIcon")
    expect(aiIndicator).toBeInTheDocument()
  })
})
