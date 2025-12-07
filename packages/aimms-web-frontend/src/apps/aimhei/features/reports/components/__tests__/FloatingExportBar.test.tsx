import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FloatingExportBar } from "../FloatingExportBar"

describe("FloatingExportBar", () => {
  const defaultProps = {
    selectedCount: 3,
    exporting: false,
    onExport: vi.fn(),
    onCancel: vi.fn(),
  }

  it("should not render when selectedCount is 0", () => {
    const { container } = render(<FloatingExportBar {...defaultProps} selectedCount={0} />)

    expect(container.firstChild).toBeNull()
  })

  it("should render when selectedCount is greater than 0", () => {
    render(<FloatingExportBar {...defaultProps} />)

    expect(screen.getByText("(3 selected)")).toBeInTheDocument()
  })

  it("should display count of 1", () => {
    render(<FloatingExportBar {...defaultProps} selectedCount={1} />)

    expect(screen.getByText("(1 selected)")).toBeInTheDocument()
  })

  it("should display count greater than 1", () => {
    render(<FloatingExportBar {...defaultProps} selectedCount={5} />)

    expect(screen.getByText("(5 selected)")).toBeInTheDocument()
  })

  it("should call onExport when Export CSV button is clicked", () => {
    const onExport = vi.fn()
    render(<FloatingExportBar {...defaultProps} onExport={onExport} />)

    const exportButton = screen.getByText("Export CSV")
    fireEvent.click(exportButton)

    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it("should call onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(<FloatingExportBar {...defaultProps} onCancel={onCancel} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("should show 'Exporting...' text when exporting is true", () => {
    render(<FloatingExportBar {...defaultProps} exporting />)

    expect(screen.getByText("Exporting...")).toBeInTheDocument()
    expect(screen.queryByText("Export CSV")).not.toBeInTheDocument()
  })

  it("should show 'Export CSV' text when exporting is false", () => {
    render(<FloatingExportBar {...defaultProps} exporting={false} />)

    expect(screen.getByText("Export CSV")).toBeInTheDocument()
    expect(screen.queryByText("Exporting...")).not.toBeInTheDocument()
  })

  it("should disable Export button when exporting is true", () => {
    render(<FloatingExportBar {...defaultProps} exporting />)

    const exportButton = screen.getByText("Exporting...")
    expect(exportButton).toBeDisabled()
  })

  it("should enable Export button when exporting is false", () => {
    render(<FloatingExportBar {...defaultProps} exporting={false} />)

    const exportButton = screen.getByText("Export CSV")
    expect(exportButton).not.toBeDisabled()
  })

  it("should show check icon", () => {
    const { container } = render(<FloatingExportBar {...defaultProps} />)

    const icon = container.querySelector('[data-testid="CheckIcon"]')
    expect(icon || container.querySelector("svg")).toBeInTheDocument()
  })

  it("should show download icon when not exporting", () => {
    const { container } = render(<FloatingExportBar {...defaultProps} exporting={false} />)

    const icon = container.querySelector('[data-testid="FileDownloadIcon"]')
    expect(icon || container.querySelector("svg")).toBeInTheDocument()
  })

  it("should show circular progress when exporting", () => {
    const { container } = render(<FloatingExportBar {...defaultProps} exporting />)

    const progress = container.querySelector('[class*="MuiCircularProgress-root"]')
    expect(progress).toBeInTheDocument()
  })
})
