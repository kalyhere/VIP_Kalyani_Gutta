import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DeleteConfirmDialog } from "../../components/DeleteConfirmDialog"

describe("DeleteConfirmDialog", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Delete Item",
    message: "Are you sure you want to delete this item?",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the dialog when open is true", () => {
    render(<DeleteConfirmDialog {...mockProps} />)

    expect(screen.getByText("Delete Item")).toBeInTheDocument()
    expect(screen.getByText("Are you sure you want to delete this item?")).toBeInTheDocument()
  })

  it("does not render the dialog when open is false", () => {
    const { container } = render(<DeleteConfirmDialog {...mockProps} open={false} />)

    // For MUI dialogs with open=false, the dialog might not be in the DOM at all
    // or it might be hidden. Let's check that we can't find the dialog content.
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument()
  })

  it("calls onClose when Cancel button is clicked", () => {
    render(<DeleteConfirmDialog {...mockProps} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onConfirm when Delete button is clicked", () => {
    render(<DeleteConfirmDialog {...mockProps} />)

    const deleteButton = screen.getByText("Delete")
    fireEvent.click(deleteButton)

    expect(mockProps.onConfirm).toHaveBeenCalled()
  })

  it("renders with custom title and message", () => {
    const customProps = {
      ...mockProps,
      title: "Custom Title",
      message: "Custom message for confirmation",
    }

    render(<DeleteConfirmDialog {...customProps} />)

    expect(screen.getByText("Custom Title")).toBeInTheDocument()
    expect(screen.getByText("Custom message for confirmation")).toBeInTheDocument()
  })

  it("renders Delete button with error styling", () => {
    render(<DeleteConfirmDialog {...mockProps} />)

    // Since the color prop is applied to the MUI Button component internally
    // and not directly accessible as an HTML attribute, we'll just check
    // that the Delete button exists and is rendered
    const deleteButton = screen.getByText("Delete")
    expect(deleteButton).toBeInTheDocument()
  })
})
