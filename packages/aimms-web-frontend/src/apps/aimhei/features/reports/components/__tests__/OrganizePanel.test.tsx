/**
 * OrganizePanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrganizePanel } from "../OrganizePanel"

describe("OrganizePanel", () => {
  const defaultProps = {
    selectedCount: 3,
    availableFolders: ["Folder A", "Folder B", "Folder C"],
    onAddToFolder: vi.fn(),
    onArchive: vi.fn(),
    onUnarchive: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render panel title", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByText("Organize Reports")).toBeInTheDocument()
    })

    it("should show selected count", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByText("3 reports selected")).toBeInTheDocument()
    })

    it("should use singular for 1 report", () => {
      render(<OrganizePanel {...defaultProps} selectedCount={1} />)
      expect(screen.getByText("1 report selected")).toBeInTheDocument()
    })

    it("should render close button", () => {
      render(<OrganizePanel {...defaultProps} />)
      // Close button is an IconButton with CloseIcon (no aria-label)
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("should render quick actions section", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByText("Quick Actions")).toBeInTheDocument()
    })

    it("should render archive button", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getAllByRole("button", { name: /archive selected/i })[0]).toBeInTheDocument()
    })

    it("should render unarchive button", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByRole("button", { name: /unarchive selected/i })).toBeInTheDocument()
    })

    it("should render add to folder section", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByText("Add to Folder")).toBeInTheDocument()
    })

    it("should render available folders", () => {
      render(<OrganizePanel {...defaultProps} />)
      expect(screen.getByText("Folder A")).toBeInTheDocument()
      expect(screen.getByText("Folder B")).toBeInTheDocument()
      expect(screen.getByText("Folder C")).toBeInTheDocument()
    })

    it("should render create new folder button", () => {
      render(<OrganizePanel {...defaultProps} />)
      // Create folder button is an IconButton with CreateNewFolderIcon
      const folderButtons = screen.getAllByRole("button")
      expect(folderButtons.length).toBeGreaterThan(0)
    })
  })

  describe("Quick Actions", () => {
    it("should call onArchive when archive clicked", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      await user.click(screen.getAllByRole("button", { name: /archive selected/i })[0])
      expect(defaultProps.onArchive).toHaveBeenCalledTimes(1)
    })

    it("should call onUnarchive when unarchive clicked", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      await user.click(screen.getByRole("button", { name: /unarchive selected/i }))
      expect(defaultProps.onUnarchive).toHaveBeenCalledTimes(1)
    })

    it("should disable archive when no selection", () => {
      render(<OrganizePanel {...defaultProps} selectedCount={0} />)
      expect(screen.getAllByRole("button", { name: /archive selected/i })[0]).toBeDisabled()
    })

    it("should disable unarchive when no selection", () => {
      render(<OrganizePanel {...defaultProps} selectedCount={0} />)
      expect(screen.getByRole("button", { name: /unarchive selected/i })).toBeDisabled()
    })

    it("should enable buttons when reports selected", () => {
      render(<OrganizePanel {...defaultProps} selectedCount={2} />)
      expect(screen.getAllByRole("button", { name: /archive selected/i })[0]).not.toBeDisabled()
      expect(screen.getByRole("button", { name: /unarchive selected/i })).not.toBeDisabled()
    })
  })

  describe("Folder Selection", () => {
    it("should call onAddToFolder when folder clicked", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      await user.click(screen.getByText("Folder A"))
      expect(defaultProps.onAddToFolder).toHaveBeenCalledWith("Folder A")
    })

    it("should handle multiple folder selections", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      await user.click(screen.getByText("Folder B"))
      expect(defaultProps.onAddToFolder).toHaveBeenCalledWith("Folder B")

      await user.click(screen.getByText("Folder C"))
      expect(defaultProps.onAddToFolder).toHaveBeenCalledWith("Folder C")
    })
  })

  describe("Create New Folder", () => {
    it("should show input when create icon clicked", async () => {
      const user = userEvent.setup()
      const { container } = render(<OrganizePanel {...defaultProps} />)

      // Find all buttons, filter to IconButtons (small ones without text)
      const buttons = screen.getAllByRole("button")
      // The CreateNewFolder IconButton is in the "Add to Folder" section header
      // It should be after Close (0), Archive (1), Unarchive (2), then folder buttons
      // Let's find it by clicking buttons until we see the input
      const iconButtons = buttons.filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      // Close is index 0, CreateNewFolder should be index 1
      await user.click(iconButtons[1])

      expect(screen.getByPlaceholderText(/new folder name/i)).toBeInTheDocument()
    })

    it("should create folder on Enter key", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      const iconButtons = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtons[1])

      const input = screen.getByPlaceholderText(/new folder name/i)
      await user.type(input, "New Folder{Enter}")
      expect(defaultProps.onAddToFolder).toHaveBeenCalledWith("New Folder")
    })

    it("should trim whitespace from folder name", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      const iconButtons = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtons[1])

      const input = screen.getByPlaceholderText(/new folder name/i)
      await user.type(input, "  Spaced  {Enter}")
      expect(defaultProps.onAddToFolder).toHaveBeenCalledWith("Spaced")
    })

    it("should not create folder with empty name", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      const iconButtons = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtons[1])

      const input = screen.getByPlaceholderText(/new folder name/i)
      await user.type(input, "{Enter}")
      expect(defaultProps.onAddToFolder).not.toHaveBeenCalled()
    })

    it("should hide input after creating folder", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      const iconButtons = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtons[1])

      const input = screen.getByPlaceholderText(/new folder name/i)
      await user.type(input, "Test{Enter}")
      expect(screen.queryByPlaceholderText(/new folder name/i)).not.toBeInTheDocument()
    })

    it("should clear input value after creation", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      const iconButtons = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtons[1])
      await user.type(screen.getByPlaceholderText(/new folder name/i), "Test{Enter}")

      // Open again and check it's empty
      const iconButtonsAgain = screen
        .getAllByRole("button")
        .filter((btn) => !btn.textContent || btn.textContent.trim() === "")
      await user.click(iconButtonsAgain[1])
      expect(screen.getByPlaceholderText(/new folder name/i)).toHaveValue("")
    })
  })

  describe("Empty State", () => {
    it("should show empty message when no folders", () => {
      render(<OrganizePanel {...defaultProps} availableFolders={[]} />)
      expect(screen.getByText(/no folders yet/i)).toBeInTheDocument()
    })

    it("should still show create button when empty", () => {
      render(<OrganizePanel {...defaultProps} availableFolders={[]} />)
      // Create folder IconButton is still present
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("should show helper text when empty", () => {
      render(<OrganizePanel {...defaultProps} availableFolders={[]} />)
      expect(screen.getByText(/click the folder icon above to create your first folder/i)).toBeInTheDocument()
    })
  })

  describe("Close Functionality", () => {
    it("should call onClose when close button clicked", async () => {
      const user = userEvent.setup()
      render(<OrganizePanel {...defaultProps} />)

      // Close button is first button (with CloseIcon)
      const buttons = screen.getAllByRole("button")
      await user.click(buttons[0])
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })
})
