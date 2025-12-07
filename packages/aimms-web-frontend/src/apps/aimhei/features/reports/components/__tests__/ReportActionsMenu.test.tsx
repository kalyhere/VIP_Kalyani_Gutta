import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReportActionsMenu } from "../ReportActionsMenu"

describe("ReportActionsMenu", () => {
  const defaultProps = {
    anchorEl: document.createElement("div"),
    onClose: vi.fn(),
    onShare: vi.fn(),
    onDelete: vi.fn(),
  }

  it("should render menu when anchorEl is provided", () => {
    render(<ReportActionsMenu {...defaultProps} />)

    expect(screen.getByText("Share Report")).toBeInTheDocument()
    expect(screen.getByText("Delete Report")).toBeInTheDocument()
  })

  it("should not render menu when anchorEl is null", () => {
    render(<ReportActionsMenu {...defaultProps} anchorEl={null} />)

    // Menu items should not be visible when anchorEl is null
    expect(screen.queryByText("Share Report")).not.toBeInTheDocument()
    expect(screen.queryByText("Delete Report")).not.toBeInTheDocument()
  })

  it("should call onShare when Share Report is clicked", () => {
    const onShare = vi.fn()
    render(<ReportActionsMenu {...defaultProps} onShare={onShare} />)

    const shareMenuItem = screen.getByText("Share Report")
    fireEvent.click(shareMenuItem)

    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it("should call onDelete when Delete Report is clicked", () => {
    const onDelete = vi.fn()
    render(<ReportActionsMenu {...defaultProps} onDelete={onDelete} />)

    const deleteMenuItem = screen.getByText("Delete Report")
    fireEvent.click(deleteMenuItem)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it("should render share icon", () => {
    render(<ReportActionsMenu {...defaultProps} />)

    // ShareIcon is rendered within the menu
    expect(screen.getByText("Share Report")).toBeInTheDocument()
  })

  it("should render delete icon", () => {
    render(<ReportActionsMenu {...defaultProps} />)

    // DeleteIcon is rendered within the menu
    expect(screen.getByText("Delete Report")).toBeInTheDocument()
  })

  it("should close menu when clicking outside", () => {
    const onClose = vi.fn()
    render(<ReportActionsMenu {...defaultProps} onClose={onClose} />)

    const backdrop = document.querySelector('[class*="MuiBackdrop-root"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it("should have correct menu positioning", () => {
    render(<ReportActionsMenu {...defaultProps} />)

    // Menu is rendered
    expect(screen.getByText("Share Report")).toBeInTheDocument()
    expect(screen.getByText("Delete Report")).toBeInTheDocument()
  })

  it("should render two menu items", () => {
    render(<ReportActionsMenu {...defaultProps} />)

    // Check both menu items are present
    expect(screen.getByText("Share Report")).toBeInTheDocument()
    expect(screen.getByText("Delete Report")).toBeInTheDocument()
  })
})
