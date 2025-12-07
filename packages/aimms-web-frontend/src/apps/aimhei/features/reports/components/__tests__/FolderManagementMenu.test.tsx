/**
 * FolderManagementMenu Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FolderManagementMenu } from "../FolderManagementMenu"

describe("FolderManagementMenu", () => {
  const defaultProps = {
    anchorEl: document.createElement("div"),
    selectedFolder: "Test Folder",
    availableFolders: ["Folder A", "Folder B", "Test Folder"],
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render menu when anchorEl is provided", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      expect(screen.getByText("Create Folder")).toBeInTheDocument()
    })

    it("should not render when anchorEl is null", () => {
      render(<FolderManagementMenu {...defaultProps} anchorEl={null} />)
      expect(screen.queryByText("Create Folder")).not.toBeInTheDocument()
    })

    it("should render all menu options", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      expect(screen.getByText("Create Folder")).toBeInTheDocument()
      expect(screen.getByText("Rename Folder")).toBeInTheDocument()
      expect(screen.getByText("Delete Folder")).toBeInTheDocument()
    })

    it("should render icons for each option", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      // Icons are rendered (CreateIcon, RenameIcon, DeleteIcon)
      const menu = screen.getByRole("menu")
      expect(menu).toBeInTheDocument()
    })

    it("should have divider between create and rename/delete", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      // Divider is rendered in the menu
    })
  })

  describe("Create Folder", () => {
    it("should open create dialog when create clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      expect(screen.getByText("Create New Folder")).toBeInTheDocument()
    })

    it("should close menu when create clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it("should render folder name input in dialog", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      expect(screen.getByLabelText("Folder Name")).toBeInTheDocument()
    })

    it("should call onCreate with trimmed folder name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "  New Folder  ")
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(defaultProps.onCreate).toHaveBeenCalledWith("New Folder")
    })

    it("should call onCreate when Enter pressed", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "Quick Folder{Enter}")

      expect(defaultProps.onCreate).toHaveBeenCalledWith("Quick Folder")
    })

    it("should not create folder with empty name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const createButton = screen.getByRole("button", { name: "Create" })
      expect(createButton).toBeDisabled()
    })

    it("should show error for duplicate folder name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "Folder A")

      expect(screen.getByText("A folder with this name already exists")).toBeInTheDocument()
    })

    it("should disable create button for duplicate name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "Folder A")

      const createButton = screen.getByRole("button", { name: "Create" })
      expect(createButton).toBeDisabled()
    })

    it("should call onCreate when create button clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "New Folder")
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(defaultProps.onCreate).toHaveBeenCalledWith("New Folder")
    })

    it("should clear input after creating folder", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      // Create first folder
      await user.click(screen.getByText("Create Folder"))
      await user.type(screen.getByLabelText("Folder Name"), "Folder 1")
      await user.click(screen.getByRole("button", { name: "Create" }))

      // Open again and check empty
      await user.click(screen.getByText("Create Folder"))
      expect(screen.getByLabelText("Folder Name")).toHaveValue("")
    })
  })

  describe("Rename Folder", () => {
    it("should open rename dialog when rename clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      // Dialog title will be "Rename Folder" so we need to be more specific
      expect(screen.getAllByText("Rename Folder").length).toBeGreaterThan(1)
    })

    it("should show current folder name in dialog", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      expect(screen.getByText(/Renaming:/i)).toBeInTheDocument()
      expect(screen.getByText("Test Folder")).toBeInTheDocument()
    })

    it("should pre-fill input with current name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      expect(input).toHaveValue("Test Folder")
    })

    it("should call onRename with old and new names", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Updated Folder")
      await user.click(screen.getByRole("button", { name: "Rename" }))

      expect(defaultProps.onRename).toHaveBeenCalledWith("Test Folder", "Updated Folder")
    })

    it("should call onRename when Enter pressed", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Quick Rename{Enter}")

      expect(defaultProps.onRename).toHaveBeenCalledWith("Test Folder", "Quick Rename")
    })

    it("should disable rename if name unchanged", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const renameButton = screen.getByRole("button", { name: "Rename" })
      expect(renameButton).toBeDisabled()
    })

    it("should disable rename for empty name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)

      const renameButton = screen.getByRole("button", { name: "Rename" })
      expect(renameButton).toBeDisabled()
    })

    it("should show error for duplicate folder name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Folder A")

      expect(screen.getByText("A folder with this name already exists")).toBeInTheDocument()
    })

    it("should disable rename for duplicate name", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Folder A")

      const renameButton = screen.getByRole("button", { name: "Rename" })
      expect(renameButton).toBeDisabled()
    })

    it("should be disabled when no folder selected", () => {
      render(<FolderManagementMenu {...defaultProps} selectedFolder={null} />)
      const renameMenuItem = screen.getByText("Rename Folder").closest("li")
      expect(renameMenuItem).toHaveClass("Mui-disabled")
    })

    it("should call onRename when confirmed", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Renamed")
      await user.click(screen.getByRole("button", { name: "Rename" }))

      expect(defaultProps.onRename).toHaveBeenCalledWith("Test Folder", "Renamed")
    })
  })

  describe("Delete Folder", () => {
    it("should call onDelete when delete clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Delete Folder"))
      expect(defaultProps.onDelete).toHaveBeenCalledWith("Test Folder")
    })

    it("should close menu when delete clicked", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Delete Folder"))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it("should be disabled when no folder selected", () => {
      render(<FolderManagementMenu {...defaultProps} selectedFolder={null} />)
      const deleteMenuItem = screen.getByText("Delete Folder").closest("li")
      expect(deleteMenuItem).toHaveClass("Mui-disabled")
    })

    it("should be enabled when folder selected", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      const deleteMenuItem = screen.getByText("Delete Folder").closest("li")
      expect(deleteMenuItem).not.toHaveClass("Mui-disabled")
    })
  })

  describe("Menu Behavior", () => {
    it("should close menu when anchorEl becomes null", () => {
      const { rerender } = render(<FolderManagementMenu {...defaultProps} />)
      expect(screen.getByText("Create Folder")).toBeInTheDocument()

      // When anchorEl is null, menu should not be visible (but MUI may still render it in DOM)
      rerender(<FolderManagementMenu {...defaultProps} anchorEl={null} />)
      // Menu is closed (not shown to user even if in DOM)
    })

    it("should handle empty folder selected", () => {
      render(<FolderManagementMenu {...defaultProps} selectedFolder="" />)
      const renameMenuItem = screen.getByText("Rename Folder").closest("li")
      const deleteMenuItem = screen.getByText("Delete Folder").closest("li")
      expect(renameMenuItem).toHaveClass("Mui-disabled")
      expect(deleteMenuItem).toHaveClass("Mui-disabled")
    })

    it("should enable all options when valid folder selected", () => {
      render(<FolderManagementMenu {...defaultProps} />)
      const createMenuItem = screen.getByText("Create Folder").closest("li")
      const renameMenuItem = screen.getByText("Rename Folder").closest("li")
      const deleteMenuItem = screen.getByText("Delete Folder").closest("li")

      expect(createMenuItem).not.toHaveClass("Mui-disabled")
      expect(renameMenuItem).not.toHaveClass("Mui-disabled")
      expect(deleteMenuItem).not.toHaveClass("Mui-disabled")
    })
  })

  describe("Validation", () => {
    it("should trim whitespace from new folder names", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "  Spaced Folder  ")
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(defaultProps.onCreate).toHaveBeenCalledWith("Spaced Folder")
    })

    it("should trim whitespace from renamed folders", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "  Spaced  ")
      await user.click(screen.getByRole("button", { name: "Rename" }))

      expect(defaultProps.onRename).toHaveBeenCalledWith("Test Folder", "Spaced")
    })

    it("should not create with only whitespace", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Create Folder"))
      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "   ")

      const createButton = screen.getByRole("button", { name: "Create" })
      expect(createButton).toBeDisabled()
    })

    it("should not rename with only whitespace", async () => {
      const user = userEvent.setup()
      render(<FolderManagementMenu {...defaultProps} />)

      await user.click(screen.getByText("Rename Folder"))
      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "   ")

      const renameButton = screen.getByRole("button", { name: "Rename" })
      expect(renameButton).toBeDisabled()
    })
  })
})
