import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import TableActions from "../../components/TableActions"

describe("TableActions", () => {
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

  const mockTableWithGeneratedContent = {
    ...mockTable,
    rows: [
      ...mockTable.rows,
      {
        id: "row-3",
        cells: [
          {
            id: "cell-7",
            content: "AI Generated",
            isHeader: false,
            isAIGenerated: true,
            originalVariable: "{var}",
          },
          { id: "cell-8", content: "Regular", isHeader: false },
          {
            id: "cell-9",
            content: "AI Generated",
            isHeader: false,
            isAIGenerated: true,
            originalVariable: "{var2}",
          },
        ],
      },
    ],
  }

  const mockProps = {
    table: mockTable,
    isGenerating: false,
    onDeleteTable: vi.fn(),
    onAddRow: vi.fn(),
    onDeleteRow: vi.fn(),
    onAddColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
    hasUnfilledVariables: vi.fn().mockReturnValue(true),
    hasGeneratedContent: vi.fn().mockReturnValue(false),
    handleFillEmpty: vi.fn(),
    handleRegenerateAll: vi.fn(),
    handleResetAll: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the delete table button", () => {
    render(<TableActions {...mockProps} />)

    const deleteButton = screen.getByTestId("CloseIcon").closest("button")
    expect(deleteButton).toBeInTheDocument()
  })

  it("calls onDeleteTable when delete button is clicked", () => {
    render(<TableActions {...mockProps} />)

    const deleteButton = screen.getByTestId("CloseIcon").closest("button")
    fireEvent.click(deleteButton!)

    expect(mockProps.onDeleteTable).toHaveBeenCalledWith("table-1")
  })

  it("renders AI Actions button when table has unfilled variables", () => {
    render(<TableActions {...mockProps} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    expect(aiButton).toBeInTheDocument()
  })

  it("does not render AI Actions button when table has no unfilled variables or generated content", () => {
    const props = {
      ...mockProps,
      hasUnfilledVariables: vi.fn().mockReturnValue(false),
      hasGeneratedContent: vi.fn().mockReturnValue(false),
    }

    render(<TableActions {...props} />)

    const aiButton = screen.queryByRole("button", { name: /ai actions/i })
    expect(aiButton).not.toBeInTheDocument()
  })

  it("opens menu when AI Actions button is clicked", () => {
    render(<TableActions {...mockProps} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    fireEvent.click(aiButton)

    const menu = screen.getByRole("menu")
    expect(menu).toBeInTheDocument()

    const fillMenuItem = screen.getByRole("menuitem", { name: /fill variables/i })
    expect(fillMenuItem).toBeInTheDocument()
  })

  it("calls handleFillEmpty when Fill Variables menu item is clicked", () => {
    render(<TableActions {...mockProps} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    fireEvent.click(aiButton)

    const fillMenuItem = screen.getByRole("menuitem", { name: /fill variables/i })
    fireEvent.click(fillMenuItem)

    expect(mockProps.handleFillEmpty).toHaveBeenCalledWith("table-1")
  })

  it("shows Regenerate All and Reset to Variables options when table has generated content", () => {
    const props = {
      ...mockProps,
      table: mockTableWithGeneratedContent,
      hasGeneratedContent: vi.fn().mockReturnValue(true),
    }

    render(<TableActions {...props} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    fireEvent.click(aiButton)

    const regenerateMenuItem = screen.getByRole("menuitem", { name: /regenerate all/i })
    expect(regenerateMenuItem).toBeInTheDocument()

    const resetMenuItem = screen.getByRole("menuitem", { name: /reset to variables/i })
    expect(resetMenuItem).toBeInTheDocument()
  })

  it("calls handleRegenerateAll when Regenerate All menu item is clicked", () => {
    const props = {
      ...mockProps,
      table: mockTableWithGeneratedContent,
      hasGeneratedContent: vi.fn().mockReturnValue(true),
    }

    render(<TableActions {...props} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    fireEvent.click(aiButton)

    const regenerateMenuItem = screen.getByRole("menuitem", { name: /regenerate all/i })
    fireEvent.click(regenerateMenuItem)

    expect(props.handleRegenerateAll).toHaveBeenCalledWith("table-1")
  })

  it("calls handleResetAll when Reset to Variables menu item is clicked", () => {
    const props = {
      ...mockProps,
      table: mockTableWithGeneratedContent,
      hasGeneratedContent: vi.fn().mockReturnValue(true),
    }

    render(<TableActions {...props} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    fireEvent.click(aiButton)

    const resetMenuItem = screen.getByRole("menuitem", { name: /reset to variables/i })
    fireEvent.click(resetMenuItem)

    expect(props.handleResetAll).toHaveBeenCalledWith("table-1")
  })

  it("disables AI Actions button when isGenerating is true", () => {
    const props = {
      ...mockProps,
      isGenerating: true,
    }

    render(<TableActions {...props} />)

    const aiButton = screen.getByRole("button", { name: /ai actions/i })
    expect(aiButton).toBeDisabled()
  })

  it("renders row and column action buttons", () => {
    render(<TableActions {...mockProps} />)

    // Find the add row button by finding the AddIcon near the "Rows:" text
    const rowsText = screen.getByText(/rows:/i)
    const rowsContainer = rowsText.closest("div")
    const addRowButton = rowsContainer?.querySelector('button:has(svg[data-testid="AddIcon"])')
    expect(addRowButton).toBeInTheDocument()

    // Find the add column button by finding the AddIcon near the "Columns:" text
    const columnsText = screen.getByText(/columns:/i)
    const columnsContainer = columnsText.closest("div")
    const addColumnButton = columnsContainer?.querySelector(
      'button:has(svg[data-testid="AddIcon"])'
    )
    expect(addColumnButton).toBeInTheDocument()
  })

  it("calls onAddRow when Add Row button is clicked", () => {
    render(<TableActions {...mockProps} />)

    // Find the add row button by finding the AddIcon near the "Rows:" text
    const rowsText = screen.getByText(/rows:/i)
    const rowsContainer = rowsText.closest("div")
    const addRowButton = rowsContainer?.querySelector('button:has(svg[data-testid="AddIcon"])')
    fireEvent.click(addRowButton!)

    expect(mockProps.onAddRow).toHaveBeenCalledWith("table-1")
  })

  it("calls onAddColumn when Add Column button is clicked", () => {
    render(<TableActions {...mockProps} />)

    // Find the add column button by finding the AddIcon near the "Columns:" text
    const columnsText = screen.getByText(/columns:/i)
    const columnsContainer = columnsText.closest("div")
    const addColumnButton = columnsContainer?.querySelector(
      'button:has(svg[data-testid="AddIcon"])'
    )
    fireEvent.click(addColumnButton!)

    expect(mockProps.onAddColumn).toHaveBeenCalledWith("table-1")
  })
})
