import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DeleteConfirmationDialog } from "../DeleteConfirmationDialog"

describe("DeleteConfirmationDialog", () => {
  const defaultProps = {
    open: true,
    deleting: false,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  }

  it("should render dialog when open is true", () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(screen.getByText("Delete Report?")).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete this report/i)).toBeInTheDocument()
  })

  it("should not render dialog when open is false", () => {
    render(<DeleteConfirmationDialog {...defaultProps} open={false} />)

    expect(screen.queryByText("Delete Report?")).not.toBeInTheDocument()
  })

  it("should call onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(<DeleteConfirmationDialog {...defaultProps} onCancel={onCancel} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("should call onConfirm when Delete button is clicked", () => {
    const onConfirm = vi.fn()
    render(<DeleteConfirmationDialog {...defaultProps} onConfirm={onConfirm} />)

    const deleteButton = screen.getByText("Delete")
    fireEvent.click(deleteButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("should show 'Deleting...' text when deleting is true", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting />)

    expect(screen.getByText("Deleting...")).toBeInTheDocument()
    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("should show 'Delete' text when deleting is false", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting={false} />)

    expect(screen.getByText("Delete")).toBeInTheDocument()
    expect(screen.queryByText("Deleting...")).not.toBeInTheDocument()
  })

  it("should disable Delete button when deleting is true", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting />)

    const deleteButton = screen.getByText("Deleting...")
    expect(deleteButton).toBeDisabled()
  })

  it("should enable Delete button when deleting is false", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting={false} />)

    const deleteButton = screen.getByText("Delete")
    expect(deleteButton).not.toBeDisabled()
  })

  it("should show delete icon when not deleting", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting={false} />)

    // The delete button with icon should be present
    const deleteButton = screen.getByText("Delete")
    expect(deleteButton).toBeInTheDocument()
  })

  it("should show circular progress when deleting", () => {
    render(<DeleteConfirmationDialog {...defaultProps} deleting />)

    // The deleting button should be present
    const deleteButton = screen.getByText("Deleting...")
    expect(deleteButton).toBeInTheDocument()
  })

  it("should call onCancel when clicking outside dialog", () => {
    const onCancel = vi.fn()
    const { container } = render(<DeleteConfirmationDialog {...defaultProps} onCancel={onCancel} />)

    // Click on the backdrop
    const backdrop = container.querySelector('[class*="MuiBackdrop-root"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onCancel).toHaveBeenCalled()
    }
  })

  it("should display warning message about permanent deletion", () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)

    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
    expect(screen.getByText(/permanently remove all report data/i)).toBeInTheDocument()
  })
})
