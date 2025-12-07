import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import AddSectionDialog from "../../components/AddSectionDialog"

describe("AddSectionDialog", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    newSectionTitle: "New Section",
    onTitleChange: vi.fn(),
    onAdd: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the dialog when open is true", () => {
    render(<AddSectionDialog {...mockProps} />)

    expect(screen.getByText("Add New Section")).toBeInTheDocument()
    expect(screen.getByLabelText("Section Title")).toBeInTheDocument()
  })

  it("does not render the dialog when open is false", () => {
    render(<AddSectionDialog {...mockProps} open={false} />)

    // The dialog might be in the DOM but not visible to the user
    const dialogTitle = screen.queryByText("Add New Section")
    expect(dialogTitle).not.toBeVisible()
  })

  it("displays the current section title value", () => {
    render(<AddSectionDialog {...mockProps} />)

    const titleInput = screen.getByLabelText("Section Title")
    expect(titleInput).toHaveValue("New Section")
  })

  it("calls onTitleChange when input value changes", () => {
    render(<AddSectionDialog {...mockProps} />)

    const titleInput = screen.getByLabelText("Section Title")
    fireEvent.change(titleInput, { target: { value: "Updated Section Title" } })

    expect(mockProps.onTitleChange).toHaveBeenCalledWith("Updated Section Title")
  })

  it("calls onClose when Cancel button is clicked", () => {
    render(<AddSectionDialog {...mockProps} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onAdd when Add button is clicked", () => {
    render(<AddSectionDialog {...mockProps} />)

    const addButton = screen.getByText("Add")
    fireEvent.click(addButton)

    expect(mockProps.onAdd).toHaveBeenCalled()
  })

  it("focuses on the title input when dialog opens", () => {
    render(<AddSectionDialog {...mockProps} />)

    const titleInput = screen.getByLabelText("Section Title")
    expect(document.activeElement).toBe(titleInput)
  })
})
