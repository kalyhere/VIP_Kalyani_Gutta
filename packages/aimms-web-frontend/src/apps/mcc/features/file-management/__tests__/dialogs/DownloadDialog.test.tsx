import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import DownloadDialog from "../../dialogs/DownloadDialog"

describe("DownloadDialog", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    fileName: "test-file",
    onFileNameChange: vi.fn(),
    onDownload: vi.fn(),
    downloadType: "format" as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the dialog when open is true", () => {
    render(<DownloadDialog {...mockProps} />)

    expect(screen.getByText("Download Format")).toBeInTheDocument()
    expect(screen.getByLabelText("File Name")).toBeInTheDocument()
  })

  it("renders the dialog with cases title when downloadType is cases", () => {
    render(<DownloadDialog {...mockProps} downloadType="cases" />)

    expect(screen.getByText("Download Medical Cases")).toBeInTheDocument()
  })

  it("does not render the dialog when open is false", () => {
    render(<DownloadDialog {...mockProps} open={false} />)

    expect(screen.queryByText("Download Format")).not.toBeInTheDocument()
  })

  it("displays the current file name value", () => {
    render(<DownloadDialog {...mockProps} />)

    const fileNameInput = screen.getByLabelText("File Name")
    expect(fileNameInput).toHaveValue("test-file")
  })

  it("shows .json suffix in the input", () => {
    render(<DownloadDialog {...mockProps} />)

    expect(screen.getByText(".json")).toBeInTheDocument()
  })

  it("shows helper text about .json extension", () => {
    render(<DownloadDialog {...mockProps} />)

    expect(screen.getByText(".json will be added automatically")).toBeInTheDocument()
  })

  it("calls onFileNameChange when input value changes", () => {
    render(<DownloadDialog {...mockProps} />)

    const fileNameInput = screen.getByLabelText("File Name")
    fireEvent.change(fileNameInput, { target: { value: "new-file-name" } })

    expect(mockProps.onFileNameChange).toHaveBeenCalledWith("new-file-name")
  })

  it("calls onClose when Cancel button is clicked", () => {
    render(<DownloadDialog {...mockProps} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onDownload when Download button is clicked", () => {
    render(<DownloadDialog {...mockProps} />)

    const downloadButton = screen.getByText("Download")
    fireEvent.click(downloadButton)

    expect(mockProps.onDownload).toHaveBeenCalled()
  })

  it("disables the Download button when fileName is empty", () => {
    render(<DownloadDialog {...mockProps} fileName="" />)

    const downloadButton = screen.getByText("Download")
    expect(downloadButton).toBeDisabled()
  })

  it("disables the Download button when fileName contains only whitespace", () => {
    render(<DownloadDialog {...mockProps} fileName="   " />)

    const downloadButton = screen.getByText("Download")
    expect(downloadButton).toBeDisabled()
  })
})
