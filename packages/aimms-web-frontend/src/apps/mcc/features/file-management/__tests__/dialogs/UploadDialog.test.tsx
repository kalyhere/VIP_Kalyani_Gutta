import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import UploadDialog from "../../dialogs/UploadDialog"

describe("UploadDialog", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    uploadedCasesCount: 3,
    existingCasesCount: 5,
    onMerge: vi.fn(),
    onReplace: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the dialog when open is true", () => {
    render(<UploadDialog {...mockProps} />)

    expect(screen.getByText("Upload Medical Cases")).toBeInTheDocument()
  })

  it("does not render the dialog when open is false", () => {
    render(<UploadDialog {...mockProps} open={false} />)

    expect(screen.queryByText("Upload Medical Cases")).not.toBeInTheDocument()
  })

  it("displays the uploaded cases count", () => {
    render(<UploadDialog {...mockProps} />)

    expect(screen.getByText("You are about to upload 3 new case(s).")).toBeInTheDocument()
  })

  it("displays the existing cases count", () => {
    render(<UploadDialog {...mockProps} />)

    expect(screen.getByText("You currently have 5 existing case(s).")).toBeInTheDocument()
  })

  it("displays the choose message", () => {
    render(<UploadDialog {...mockProps} />)

    expect(screen.getByText("Choose how you would like to proceed:")).toBeInTheDocument()
  })

  it("calls onClose when Cancel button is clicked", () => {
    render(<UploadDialog {...mockProps} />)

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onMerge when Merge with Existing button is clicked", () => {
    render(<UploadDialog {...mockProps} />)

    const mergeButton = screen.getByText("Merge with Existing")
    fireEvent.click(mergeButton)

    expect(mockProps.onMerge).toHaveBeenCalled()
  })

  it("calls onReplace when Replace All button is clicked", () => {
    render(<UploadDialog {...mockProps} />)

    const replaceButton = screen.getByText("Replace All")
    fireEvent.click(replaceButton)

    expect(mockProps.onReplace).toHaveBeenCalled()
  })

  it("renders with zero uploaded cases", () => {
    render(<UploadDialog {...mockProps} uploadedCasesCount={0} />)

    expect(screen.getByText("You are about to upload 0 new case(s).")).toBeInTheDocument()
  })

  it("renders with zero existing cases", () => {
    render(<UploadDialog {...mockProps} existingCasesCount={0} />)

    expect(screen.getByText("You currently have 0 existing case(s).")).toBeInTheDocument()
  })
})
