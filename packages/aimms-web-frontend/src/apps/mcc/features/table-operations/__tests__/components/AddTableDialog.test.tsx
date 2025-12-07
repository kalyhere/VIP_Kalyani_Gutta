import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import AddTableDialog from "../../components/AddTableDialog"

describe("AddTableDialog", () => {
  const mockData = {
    title: "Test Table",
    rows: 3,
    columns: 4,
    hasHeader: true,
  }

  const mockProps = {
    open: true,
    onClose: vi.fn(),
    data: mockData,
    onDataChange: vi.fn(),
    onAdd: vi.fn(),
    isValid: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the dialog when open is true", () => {
    render(<AddTableDialog {...mockProps} />)

    expect(screen.getByText("Insert Table")).toBeInTheDocument()
  })

  it("does not render the dialog when open is false", () => {
    render(<AddTableDialog {...mockProps} open={false} />)

    // The dialog might be in the DOM but not visible to the user
    // Use queryByText which returns null if not found, or the element if found
    const dialogTitle = screen.queryByText("Insert Table")
    expect(dialogTitle).not.toBeVisible()
  })

  it("displays the current table title", () => {
    render(<AddTableDialog {...mockProps} />)

    const titleInput = screen.getByLabelText("Table Title")
    expect(titleInput).toHaveValue("Test Table")
  })

  it("displays the current number of rows", () => {
    render(<AddTableDialog {...mockProps} />)

    const rowsInput = screen.getByLabelText("Number of Rows")
    expect(rowsInput).toHaveValue(3) // Changed from string to number
  })

  it("displays the current number of columns", () => {
    render(<AddTableDialog {...mockProps} />)

    const columnsInput = screen.getByLabelText("Number of Columns")
    expect(columnsInput).toHaveValue(4) // Changed from string to number
  })

  it("displays the header checkbox checked when hasHeader is true", () => {
    render(<AddTableDialog {...mockProps} />)

    const headerCheckbox = screen.getByLabelText("Include header row") // Changed to lowercase
    expect(headerCheckbox).toBeChecked()
  })

  it("displays the header checkbox unchecked when hasHeader is false", () => {
    const dataWithoutHeader = { ...mockData, hasHeader: false }
    render(<AddTableDialog {...mockProps} data={dataWithoutHeader} />)

    const headerCheckbox = screen.getByLabelText("Include header row") // Changed to lowercase
    expect(headerCheckbox).not.toBeChecked()
  })

  it("calls onDataChange when title is changed", () => {
    render(<AddTableDialog {...mockProps} />)

    const titleInput = screen.getByLabelText("Table Title")
    fireEvent.change(titleInput, { target: { value: "New Table Title" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      title: "New Table Title",
    })
  })

  it("calls onDataChange when rows are changed", () => {
    render(<AddTableDialog {...mockProps} />)

    const rowsInput = screen.getByLabelText("Number of Rows")
    fireEvent.change(rowsInput, { target: { value: "5" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      rows: 5,
    })
  })

  it("calls onDataChange when columns are changed", () => {
    render(<AddTableDialog {...mockProps} />)

    const columnsInput = screen.getByLabelText("Number of Columns")
    fireEvent.change(columnsInput, { target: { value: "6" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      columns: 6,
    })
  })

  it("calls onDataChange when header checkbox is toggled", () => {
    render(<AddTableDialog {...mockProps} />)

    const headerCheckbox = screen.getByLabelText("Include header row") // Changed to lowercase
    fireEvent.click(headerCheckbox)

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      hasHeader: false,
    })
  })

  it("calls onClose when Cancel button is clicked", () => {
    render(<AddTableDialog {...mockProps} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onAdd when Insert button is clicked", () => {
    // Changed from Add to Insert
    render(<AddTableDialog {...mockProps} />)

    const insertButton = screen.getByText("Insert") // Changed from Add to Insert
    fireEvent.click(insertButton)

    expect(mockProps.onAdd).toHaveBeenCalled()
  })

  it("disables the Insert button when isValid is false", () => {
    // Changed from Add to Insert
    render(<AddTableDialog {...mockProps} isValid={false} />)

    const insertButton = screen.getByText("Insert") // Changed from Add to Insert
    expect(insertButton).toBeDisabled()
  })

  it("limits rows to a maximum of 10", () => {
    render(<AddTableDialog {...mockProps} />)

    const rowsInput = screen.getByLabelText("Number of Rows")
    fireEvent.change(rowsInput, { target: { value: "15" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      rows: 10,
    })
  })

  it("limits columns to a maximum of 10", () => {
    render(<AddTableDialog {...mockProps} />)

    const columnsInput = screen.getByLabelText("Number of Columns")
    fireEvent.change(columnsInput, { target: { value: "15" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      columns: 10,
    })
  })

  it("enforces a minimum of 1 for rows", () => {
    render(<AddTableDialog {...mockProps} />)

    const rowsInput = screen.getByLabelText("Number of Rows")
    fireEvent.change(rowsInput, { target: { value: "0" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      rows: 1,
    })
  })

  it("enforces a minimum of 1 for columns", () => {
    render(<AddTableDialog {...mockProps} />)

    const columnsInput = screen.getByLabelText("Number of Columns")
    fireEvent.change(columnsInput, { target: { value: "0" } })

    expect(mockProps.onDataChange).toHaveBeenCalledWith({
      ...mockData,
      columns: 1,
    })
  })
})
