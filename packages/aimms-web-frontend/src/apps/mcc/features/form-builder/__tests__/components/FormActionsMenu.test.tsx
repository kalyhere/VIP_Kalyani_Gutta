import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import FormActionsMenu from "../../components/FormActionsMenu"

describe("FormActionsMenu", () => {
  const mockAnchorEl = document.createElement("button")

  const mockProps = {
    anchorEl: mockAnchorEl,
    onClose: vi.fn(),
    hasUnfilledVariables: true,
    hasGeneratedContent: true,
    onFillEmpty: vi.fn(),
    onRegenerateAll: vi.fn(),
    onResetAll: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the menu when anchorEl is provided", () => {
    render(<FormActionsMenu {...mockProps} />)

    expect(screen.getByText("Fill Variables")).toBeInTheDocument()
    expect(screen.getByText("Regenerate All")).toBeInTheDocument()
    expect(screen.getByText("Reset to Variables")).toBeInTheDocument()
  })

  it("does not render the menu when anchorEl is null", () => {
    render(<FormActionsMenu {...mockProps} anchorEl={null} />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
  })

  it("calls onFillEmpty and onClose when Fill Variables is clicked", () => {
    render(<FormActionsMenu {...mockProps} />)

    const fillItem = screen.getByText("Fill Variables")
    fireEvent.click(fillItem)

    expect(mockProps.onFillEmpty).toHaveBeenCalled()
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onRegenerateAll and onClose when Regenerate All is clicked", () => {
    render(<FormActionsMenu {...mockProps} />)

    const regenerateItem = screen.getByText("Regenerate All")
    fireEvent.click(regenerateItem)

    expect(mockProps.onRegenerateAll).toHaveBeenCalled()
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("calls onResetAll and onClose when Reset to Variables is clicked", () => {
    render(<FormActionsMenu {...mockProps} />)

    const resetItem = screen.getByText("Reset to Variables")
    fireEvent.click(resetItem)

    expect(mockProps.onResetAll).toHaveBeenCalled()
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("does not render Fill Variables when hasUnfilledVariables is false", () => {
    render(<FormActionsMenu {...mockProps} hasUnfilledVariables={false} />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
  })

  it("does not render Regenerate All when hasGeneratedContent is false", () => {
    render(<FormActionsMenu {...mockProps} hasGeneratedContent={false} />)

    expect(screen.queryByText("Regenerate All")).not.toBeInTheDocument()
  })

  it("does not render Reset to Variables when hasGeneratedContent is false", () => {
    render(<FormActionsMenu {...mockProps} hasGeneratedContent={false} />)

    expect(screen.queryByText("Reset to Variables")).not.toBeInTheDocument()
  })

  it("renders only Fill Variables when only hasUnfilledVariables is true", () => {
    render(<FormActionsMenu {...mockProps} hasUnfilledVariables hasGeneratedContent={false} />)

    expect(screen.getByText("Fill Variables")).toBeInTheDocument()
    expect(screen.queryByText("Regenerate All")).not.toBeInTheDocument()
    expect(screen.queryByText("Reset to Variables")).not.toBeInTheDocument()
  })

  it("renders only Regenerate All and Reset to Variables when only hasGeneratedContent is true", () => {
    render(<FormActionsMenu {...mockProps} hasUnfilledVariables={false} hasGeneratedContent />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
    expect(screen.getByText("Regenerate All")).toBeInTheDocument()
    expect(screen.getByText("Reset to Variables")).toBeInTheDocument()
  })

  it("renders nothing when both hasUnfilledVariables and hasGeneratedContent are false", () => {
    render(
      <FormActionsMenu {...mockProps} hasUnfilledVariables={false} hasGeneratedContent={false} />
    )

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
    expect(screen.queryByText("Regenerate All")).not.toBeInTheDocument()
    expect(screen.queryByText("Reset to Variables")).not.toBeInTheDocument()
  })
})
