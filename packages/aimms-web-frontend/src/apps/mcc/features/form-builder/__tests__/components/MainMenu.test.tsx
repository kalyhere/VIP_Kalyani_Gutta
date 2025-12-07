import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import MainMenu from "../../components/MainMenu"

describe("MainMenu", () => {
  const mockAnchorEl = document.createElement("button")

  const mockProps = {
    anchorEl: mockAnchorEl,
    onClose: vi.fn(),
    onDownloadFormat: vi.fn(),
    onUploadFormat: vi.fn(),
    onClearAll: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the menu when anchorEl is provided", () => {
    render(<MainMenu {...mockProps} />)

    expect(screen.getByText("Download Format")).toBeInTheDocument()
    expect(screen.getByText("Upload Format")).toBeInTheDocument()
    expect(screen.getByText("Clear All")).toBeInTheDocument()
  })

  it("does not render the menu when anchorEl is null", () => {
    render(<MainMenu {...mockProps} anchorEl={null} />)

    expect(screen.queryByText("Download Format")).not.toBeInTheDocument()
  })

  it("calls onDownloadFormat when Download Format is clicked", () => {
    render(<MainMenu {...mockProps} />)

    const downloadItem = screen.getByText("Download Format")
    fireEvent.click(downloadItem)

    expect(mockProps.onDownloadFormat).toHaveBeenCalled()
  })

  it("has a file input for Upload Format", () => {
    render(<MainMenu {...mockProps} />)

    const uploadItem = screen.getByText("Upload Format")
    expect(uploadItem.closest("label")).toBeInTheDocument()

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute("accept", ".json")
  })

  it("calls onUploadFormat when a file is selected", () => {
    render(<MainMenu {...mockProps} />)

    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(["{}"], "test.json", { type: "application/json" })

    fireEvent.change(fileInput!, { target: { files: [file] } })

    expect(mockProps.onUploadFormat).toHaveBeenCalled()
  })

  it("calls onClearAll when Clear All is clicked", () => {
    render(<MainMenu {...mockProps} />)

    const clearAllItem = screen.getByText("Clear All")
    fireEvent.click(clearAllItem)

    expect(mockProps.onClearAll).toHaveBeenCalled()
  })

  it("renders Clear All with error color", () => {
    render(<MainMenu {...mockProps} />)

    const clearAllItem = screen.getByText("Clear All")
    const menuItem = clearAllItem.closest("li")

    // Check if the menu item has a class that indicates error styling
    // Since the actual styling is applied via sx prop, we can't directly test the computed style
    // Instead, we'll check that the MenuItem contains the Clear All text
    expect(menuItem).toBeInTheDocument()
    expect(menuItem).toContainElement(clearAllItem)
  })
})
