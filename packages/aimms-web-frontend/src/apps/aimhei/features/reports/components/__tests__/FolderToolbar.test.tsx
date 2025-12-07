/**
 * FolderToolbar Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FolderToolbar } from "../FolderToolbar"
import { useAIMHEIStore } from "../../../../stores/aimheiStore"

// Mock Zustand store
vi.mock("../../../../stores/aimheiStore", () => ({
  useAIMHEIStore: vi.fn(),
}))

describe("FolderToolbar", () => {
  const defaultProps = {
    onSelectFolder: vi.fn(),
    onCreateFolder: vi.fn(),
    onRenameFolder: vi.fn(),
    onDeleteFolder: vi.fn(),
    onSearchChange: vi.fn(),
    onSearchFieldChange: vi.fn(),
    onModelFilterChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    onRefresh: vi.fn(),
    onToggleOrganizeMode: vi.fn(),
    onExitOrganizeMode: vi.fn(),
    onMoveToFolder: vi.fn(),
    onExport: vi.fn(),
  }

  const defaultStoreState = {
    availableFolders: ["Folder A", "Folder B", "Folder C"],
    selectedFolder: null,
    folderCounts: {
      "Folder A": 5,
      "Folder B": 3,
      "Folder C": 8,
    },
    unorganizedCount: 12,
    actualTotalReports: 28,
    reportsFilters: {
      searchTerm: "",
      searchField: "case_title",
      modelFilter: "",
      dateRange: null,
    },
    bulkOperationMode: false,
    bulkSelectedReportIds: new Set<number>(),
    exportMode: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock implementation
    ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
      selector(defaultStoreState)
    )
  })

  describe("Rendering", () => {
    it("should render folder autocomplete", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByPlaceholderText("Folder")).toBeInTheDocument()
    })

    it("should render folder management button", () => {
      render(<FolderToolbar {...defaultProps} />)
      const button = screen.getByTitle("Manage folders")
      expect(button).toBeInTheDocument()
    })

    it("should render organize button when not in organize mode", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: /organize/i })).toBeInTheDocument()
    })

    it("should render export button when onExport provided", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument()
    })

    it("should not render export button when onExport not provided", () => {
      const { onExport, ...propsWithoutExport } = defaultProps
      render(<FolderToolbar {...propsWithoutExport} />)
      expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument()
    })
  })

  describe("Folder Selection", () => {
    it("should show All Reports when selectedFolder is null", () => {
      render(<FolderToolbar {...defaultProps} />)
      const input = screen.getByPlaceholderText("Folder")
      expect(input).toHaveValue("All Reports")
    })

    it("should show Unorganized when selectedFolder is empty string", () => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({ ...defaultStoreState, selectedFolder: "" })
      )
      render(<FolderToolbar {...defaultProps} />)
      const input = screen.getByPlaceholderText("Folder")
      expect(input).toHaveValue("Unorganized")
    })

    it("should show selected folder name", () => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({ ...defaultStoreState, selectedFolder: "Folder A" })
      )
      render(<FolderToolbar {...defaultProps} />)
      const input = screen.getByPlaceholderText("Folder")
      expect(input).toHaveValue("Folder A")
    })

    it("should call onSelectFolder when folder changed", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const folderB = screen.getByText("Folder B")
      await user.click(folderB)

      expect(defaultProps.onSelectFolder).toHaveBeenCalledWith("Folder B")
    })

    it("should call onSelectFolder with null for All Reports", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({ ...defaultStoreState, selectedFolder: "Folder A" })
      )
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const allReports = screen.getByText("All Reports")
      await user.click(allReports)

      expect(defaultProps.onSelectFolder).toHaveBeenCalledWith(null)
    })

    it("should call onSelectFolder with empty string for Unorganized", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const unorganized = screen.getByText("Unorganized")
      await user.click(unorganized)

      expect(defaultProps.onSelectFolder).toHaveBeenCalledWith("")
    })
  })

  describe("Folder Counts", () => {
    it("should display total reports count for All Reports", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const allReportsOption = screen.getByText("All Reports").closest("li")!
      expect(within(allReportsOption).getByText("28")).toBeInTheDocument()
    })

    it("should display unorganized count", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const unorganizedOption = screen.getByText("Unorganized").closest("li")!
      expect(within(unorganizedOption).getByText("12")).toBeInTheDocument()
    })

    it("should display folder counts", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const folderAOption = screen.getByText("Folder A").closest("li")!
      expect(within(folderAOption).getByText("5")).toBeInTheDocument()

      const folderBOption = screen.getByText("Folder B").closest("li")!
      expect(within(folderBOption).getByText("3")).toBeInTheDocument()

      const folderCOption = screen.getByText("Folder C").closest("li")!
      expect(within(folderCOption).getByText("8")).toBeInTheDocument()
    })

    it("should show 0 for folders with no count", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          availableFolders: ["Empty Folder"],
          folderCounts: {},
        })
      )
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const emptyFolderOption = screen.getByText("Empty Folder").closest("li")!
      expect(within(emptyFolderOption).getByText("0")).toBeInTheDocument()
    })
  })

  describe("Folder Management Menu", () => {
    it("should open menu when settings button clicked", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByTitle("Manage folders"))
      expect(screen.getByText("Create Folder")).toBeInTheDocument()
    })

    it("should call onCreateFolder when folder created", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByTitle("Manage folders"))
      await user.click(screen.getByText("Create Folder"))

      const input = screen.getByLabelText("Folder Name")
      await user.type(input, "New Folder")
      await user.click(screen.getByRole("button", { name: "Create" }))

      expect(defaultProps.onCreateFolder).toHaveBeenCalledWith("New Folder")
    })

    it("should call onRenameFolder when folder renamed", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({ ...defaultStoreState, selectedFolder: "Folder A" })
      )
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByTitle("Manage folders"))
      await user.click(screen.getByText("Rename Folder"))

      const input = screen.getByLabelText("New Folder Name")
      await user.clear(input)
      await user.type(input, "Renamed Folder")
      await user.click(screen.getByRole("button", { name: "Rename" }))

      expect(defaultProps.onRenameFolder).toHaveBeenCalledWith("Folder A", "Renamed Folder")
    })

    it("should call onDeleteFolder when folder deleted", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({ ...defaultStoreState, selectedFolder: "Folder A" })
      )
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByTitle("Manage folders"))
      await user.click(screen.getByText("Delete Folder"))

      expect(defaultProps.onDeleteFolder).toHaveBeenCalledWith("Folder A")
    })
  })

  describe("Organize Mode", () => {
    beforeEach(() => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          bulkOperationMode: true,
          bulkSelectedReportIds: new Set([1, 2, 3]),
        })
      )
    })

    it("should show organize mode controls", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByText("Select reports below to organize")).toBeInTheDocument()
    })

    it("should show selected count", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByText("(3 selected)")).toBeInTheDocument()
    })

    it("should render move to folder autocomplete", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByPlaceholderText("Move to...")).toBeInTheDocument()
    })

    it("should render move button", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument()
    })

    it("should render cancel button", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("should disable move button when no folder selected", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Move" })).toBeDisabled()
    })

    it("should enable move button when folder selected", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const moveToInput = screen.getByPlaceholderText("Move to...")
      await user.click(moveToInput)
      await user.click(screen.getByText("Folder A"))

      expect(screen.getByRole("button", { name: "Move" })).not.toBeDisabled()
    })

    it("should call onMoveToFolder when move clicked", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const moveToInput = screen.getByPlaceholderText("Move to...")
      await user.click(moveToInput)
      await user.click(screen.getByText("Folder B"))
      await user.click(screen.getByRole("button", { name: "Move" }))

      expect(defaultProps.onMoveToFolder).toHaveBeenCalledWith("Folder B")
    })

    it("should clear folder after moving", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const moveToInput = screen.getByPlaceholderText("Move to...")
      await user.click(moveToInput)
      await user.click(screen.getByText("Folder B"))
      await user.click(screen.getByRole("button", { name: "Move" }))

      expect(moveToInput).toHaveValue("")
    })

    it("should call onExitOrganizeMode when cancel clicked", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByRole("button", { name: "Cancel" }))
      expect(defaultProps.onExitOrganizeMode).toHaveBeenCalled()
    })

    it("should not show organize button in organize mode", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.queryByRole("button", { name: /organize/i })).not.toBeInTheDocument()
    })

    it("should not show export button in organize mode", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument()
    })

    it("should include Unorganized in move options", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      const moveToInput = screen.getByPlaceholderText("Move to...")
      await user.click(moveToInput)

      expect(screen.getByText("Unorganized")).toBeInTheDocument()
    })

    it("should disable move when no reports selected", () => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          bulkOperationMode: true,
          bulkSelectedReportIds: new Set(),
        })
      )
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Move" })).toBeDisabled()
    })
  })

  describe("Export Mode", () => {
    beforeEach(() => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          exportMode: true,
          bulkSelectedReportIds: new Set([5, 6]),
        })
      )
    })

    it("should show export mode text", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByText("Select reports below to export")).toBeInTheDocument()
    })

    it("should show export mode selected count", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByText("(2 selected)")).toBeInTheDocument()
    })

    it("should not show organize controls in export mode", () => {
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.queryByPlaceholderText("Move to...")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Move" })).not.toBeInTheDocument()
    })
  })

  describe("Toggle Modes", () => {
    it("should call onToggleOrganizeMode when organize clicked", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByRole("button", { name: /organize/i }))
      expect(defaultProps.onToggleOrganizeMode).toHaveBeenCalled()
    })

    it("should call onExport when export clicked", async () => {
      const user = userEvent.setup()
      render(<FolderToolbar {...defaultProps} />)

      await user.click(screen.getByRole("button", { name: /export/i }))
      expect(defaultProps.onExport).toHaveBeenCalled()
    })
  })

  describe("Empty State", () => {
    it("should handle no available folders", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          availableFolders: [],
        })
      )
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      // Should still show All Reports and Unorganized
      expect(screen.getByText("All Reports")).toBeInTheDocument()
      expect(screen.getByText("Unorganized")).toBeInTheDocument()
    })

    it("should show 0 count when no reports", async () => {
      const user = userEvent.setup()
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          actualTotalReports: 0,
          unorganizedCount: 0,
          folderCounts: {},
        })
      )
      render(<FolderToolbar {...defaultProps} />)

      const autocomplete = screen.getByPlaceholderText("Folder")
      await user.click(autocomplete)

      const allReportsOption = screen.getByText("All Reports").closest("li")!
      expect(within(allReportsOption).getByText("0")).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle selectedFolder not in availableFolders", () => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          selectedFolder: "Non-existent Folder",
        })
      )
      render(<FolderToolbar {...defaultProps} />)
      // Should fall back to first option (All Reports)
      const input = screen.getByPlaceholderText("Folder")
      expect(input).toHaveValue("All Reports")
    })

    it("should show (0 selected) when no reports selected in organize mode", () => {
      ;(useAIMHEIStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) =>
        selector({
          ...defaultStoreState,
          bulkOperationMode: true,
          bulkSelectedReportIds: new Set(),
        })
      )
      render(<FolderToolbar {...defaultProps} />)
      expect(screen.getByText("(0 selected)")).toBeInTheDocument()
    })
  })
})
