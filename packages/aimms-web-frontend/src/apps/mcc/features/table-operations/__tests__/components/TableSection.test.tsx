import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import TableSection from "../../components/TableSection"

describe("TableSection", () => {
  const mockTable = {
    id: "table-1",
    title: "Test Table",
    hasHeader: true,
    columns: 3,
    rows: [
      {
        id: "row-1",
        cells: [
          { id: "cell-1", content: "Header 1", isHeader: true },
          { id: "cell-2", content: "Header 2", isHeader: true },
          { id: "cell-3", content: "Header 3", isHeader: true },
        ],
      },
      {
        id: "row-2",
        cells: [
          { id: "cell-4", content: "Data 1", isHeader: false },
          { id: "cell-5", content: "{variable}", isHeader: false },
          { id: "cell-6", content: "Data 3", isHeader: false },
        ],
      },
    ],
  }

  const mockSection = {
    id: "section-1",
    title: "Test Section",
    tables: [mockTable],
  }

  const mockProps = {
    section: mockSection,
    onDeleteSection: vi.fn(),
    onAddTable: vi.fn(),
    onDeleteTable: vi.fn(),
    onCellChange: vi.fn(),
    onAddRow: vi.fn(),
    onDeleteRow: vi.fn(),
    onAddColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
    onSectionTitleChange: vi.fn(),
    attemptedFields: new Set<string>(),
    isValidVariableFormat: vi.fn(
      (content) => !content.includes("{") || (content.includes("{") && content.includes("}"))
    ),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the section title", () => {
    render(<TableSection {...mockProps} />)

    expect(screen.getByDisplayValue("Test Section")).toBeInTheDocument()
  })

  it("renders the table title", () => {
    render(<TableSection {...mockProps} />)

    expect(screen.getByText("Test Table")).toBeInTheDocument()
  })

  it("calls onSectionTitleChange when title is edited", () => {
    render(<TableSection {...mockProps} />)

    const titleInput = screen.getByDisplayValue("Test Section")
    fireEvent.change(titleInput, { target: { value: "Updated Section Title" } })
    fireEvent.blur(titleInput)

    expect(mockProps.onSectionTitleChange).toHaveBeenCalledWith(
      "section-1",
      "Updated Section Title"
    )
  })

  it("calls onDeleteSection when delete button is clicked", () => {
    render(<TableSection {...mockProps} />)

    const deleteButton = screen.getByLabelText("Delete Section")
    fireEvent.click(deleteButton)

    expect(mockProps.onDeleteSection).toHaveBeenCalledWith("section-1")
  })

  it("calls onAddTable when add table button is clicked", () => {
    render(<TableSection {...mockProps} />)

    const addTableButton = screen.getByLabelText("Add Table")
    fireEvent.click(addTableButton)

    expect(mockProps.onAddTable).toHaveBeenCalledWith("section-1")
  })

  it("renders all tables in the section", () => {
    const sectionWithMultipleTables = {
      ...mockSection,
      tables: [
        mockTable,
        {
          ...mockTable,
          id: "table-2",
          title: "Second Table",
        },
      ],
    }

    render(<TableSection {...mockProps} section={sectionWithMultipleTables} />)

    expect(screen.getByText("Test Table")).toBeInTheDocument()
    expect(screen.getByText("Second Table")).toBeInTheDocument()
  })

  it("renders empty state when section has no tables", () => {
    const emptySection = {
      ...mockSection,
      tables: [],
    }

    render(<TableSection {...mockProps} section={emptySection} />)

    expect(screen.getByText(/no tables in this section/i)).toBeInTheDocument()
  })
})
