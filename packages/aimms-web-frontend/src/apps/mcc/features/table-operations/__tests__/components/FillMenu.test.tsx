import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import FillMenu from "../../components/FillMenu"

describe("FillMenu", () => {
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
    render(<FillMenu {...mockProps} />)

    expect(screen.getByText("Fill Variables")).toBeInTheDocument()
    expect(screen.getByText("Regenerate All")).toBeInTheDocument()
    expect(screen.getByText("Reset to Variables")).toBeInTheDocument()
  })

  it("does not render the menu when anchorEl is null", () => {
    render(<FillMenu {...mockProps} anchorEl={null} />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
  })

  it("calls onFillEmpty when Fill Variables is clicked", () => {
    render(<FillMenu {...mockProps} />)

    const fillItem = screen.getByText("Fill Variables")
    fireEvent.click(fillItem)

    expect(mockProps.onFillEmpty).toHaveBeenCalled()
  })

  it("calls onRegenerateAll when Regenerate All is clicked", () => {
    render(<FillMenu {...mockProps} />)

    const regenerateItem = screen.getByText("Regenerate All")
    fireEvent.click(regenerateItem)

    expect(mockProps.onRegenerateAll).toHaveBeenCalled()
  })

  it("calls onResetAll when Reset to Variables is clicked", () => {
    render(<FillMenu {...mockProps} />)

    const resetItem = screen.getByText("Reset to Variables")
    fireEvent.click(resetItem)

    expect(mockProps.onResetAll).toHaveBeenCalled()
  })

  it("does not render Fill Variables when hasUnfilledVariables is false", () => {
    render(<FillMenu {...mockProps} hasUnfilledVariables={false} />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
  })

  it("does not render Regenerate All when hasGeneratedContent is false", () => {
    render(<FillMenu {...mockProps} hasGeneratedContent={false} />)

    expect(screen.queryByText("Regenerate All")).not.toBeInTheDocument()
  })

  it("does not render Reset to Variables when hasGeneratedContent is false", () => {
    render(<FillMenu {...mockProps} hasGeneratedContent={false} />)

    expect(screen.queryByText("Reset to Variables")).not.toBeInTheDocument()
  })

  it("renders only Fill Variables when only hasUnfilledVariables is true", () => {
    render(<FillMenu {...mockProps} hasUnfilledVariables hasGeneratedContent={false} />)

    expect(screen.getByText("Fill Variables")).toBeInTheDocument()
    expect(screen.queryByText("Regenerate All")).not.toBeInTheDocument()
    expect(screen.queryByText("Reset to Variables")).not.toBeInTheDocument()
  })

  it("renders only Regenerate All and Reset to Variables when only hasGeneratedContent is true", () => {
    render(<FillMenu {...mockProps} hasUnfilledVariables={false} hasGeneratedContent />)

    expect(screen.queryByText("Fill Variables")).not.toBeInTheDocument()
    expect(screen.getByText("Regenerate All")).toBeInTheDocument()
    expect(screen.getByText("Reset to Variables")).toBeInTheDocument()
  })
})
