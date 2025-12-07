import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import useMediaQuery from "@mui/material/useMediaQuery"
import FormBuilder from "../FormBuilder"

// Import the hooks to fix the mocking
import {
  useCaseOperations,
  useTableOperations,
  useSectionOperations,
  useCellOperations,
} from "../../table-operations"
import {
  useFileOperations,
  useRenameOperations,
  useMenuOperations,
  useResetOperations,
} from "../../file-management"
import { useAIGeneration } from "../../ai-generation"
import { useTour } from "../hooks/useTour"

// Mock IntersectionObserver (will be set in beforeEach)
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Material-UI useMediaQuery
vi.mock("@mui/material/useMediaQuery", () => ({
  __esModule: true,
  default: vi.fn().mockReturnValue(false),
}))

// Mock all the hooks and components
vi.mock("../../table-operations", () => ({
  useCaseOperations: vi.fn(),
  useTableOperations: vi.fn(),
  useSectionOperations: vi.fn(),
  useCellOperations: vi.fn(),
  EditableCell: vi.fn(() => null),
  TableActions: vi.fn(() => null),
  FillMenu: vi.fn(() => null),
  AddSectionDialog: vi.fn(() => null),
  AddTableDialog: vi.fn(() => null),
  DeleteConfirmDialog: vi.fn(() => null),
}))

vi.mock("../../file-management", () => ({
  useFileOperations: vi.fn(),
  useResetOperations: vi.fn(),
  useRenameOperations: vi.fn(),
  useMenuOperations: vi.fn(() => ({
    fillMenuAnchorEl: null,
    setFillMenuAnchorEl: vi.fn(),
    activeTableId: null,
    setActiveTableId: vi.fn(),
    formActionsAnchorEl: null,
    setFormActionsAnchorEl: vi.fn(),
    menuAnchorEl: null,
    setMenuAnchorEl: vi.fn(),
    temperature: 0.5,
    setTemperature: vi.fn(),
  })),
  UploadDialog: vi.fn(() => null),
  DownloadDialog: vi.fn(() => null),
}))

vi.mock("../../ai-generation", () => ({
  useAIGeneration: vi.fn(),
  GoogleCloudModal: vi.fn(() => null),
}))

vi.mock("../hooks/useTour", () => ({
  useTour: vi.fn(),
}))

// Mock the Zustand store
vi.mock("../../../stores/mccStore", () => {
  const mockState = {
    currentCase: {
      id: "case-1",
      name: "Test Case",
      sections: [
        {
          id: "section-1",
          title: "Test Section",
          tables: [
            {
              id: "table-1",
              title: "Test Table",
              hasHeader: true,
              columns: 2,
              rows: [
                {
                  id: "row-1",
                  cells: [
                    { id: "cell-1", content: "Header 1", isHeader: true },
                    { id: "cell-2", content: "Header 2", isHeader: true },
                  ],
                },
              ],
            },
          ],
        },
      ],
      lastModified: "2023-01-01T00:00:00Z",
    },
    selectedSectionId: null,
    googleCloudModalOpen: false,
    selectedCellId: null,
    errorMessage: null,
    setAttemptedFields: vi.fn(),
    setGeneratedFields: vi.fn(),
    setLockedFields: vi.fn(),
    setSelectedSectionId: vi.fn(),
    setGoogleCloudModalOpen: vi.fn(),
    setSelectedCellId: vi.fn(),
    setErrorMessage: vi.fn(),
    setCurrentCase: vi.fn(),
  }

  return {
    useMCCStore: vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockState)
      }
      return mockState
    }),
    selectAttemptedFieldsArray: (state: any) => [],
    selectGeneratedFieldsMap: (state: any) => new Map(),
    selectLockedFieldsMap: (state: any) => new Map(),
  }
})

// Mock the utility functions
vi.mock("../../../shared/utils/validation", () => ({
  isValidVariableFormat: vi.fn(() => true),
  getVariableFormatError: vi.fn(() => null),
}))

vi.mock("../../../shared/utils/tableUtils", () => ({
  hasUnfilledVariables: vi.fn(() => true),
  hasGeneratedContent: vi.fn(() => false),
  isTableDataValid: vi.fn(() => true),
}))

vi.mock("../../../shared/utils/print", () => ({
  printCase: vi.fn(),
}))

describe("FormBuilder", () => {
  // Create mock implementations for the hooks
  const mockCaseOperations = {
    cases: [],
    setCases: vi.fn(),
    currentCase: {
      id: "case-1",
      name: "Test Case",
      sections: [
        {
          id: "section-1",
          title: "Test Section",
          tables: [
            {
              id: "table-1",
              title: "Test Table",
              hasHeader: true,
              columns: 2,
              rows: [
                {
                  id: "row-1",
                  cells: [
                    { id: "cell-1", content: "Header 1", isHeader: true },
                    { id: "cell-2", content: "Header 2", isHeader: true },
                  ],
                },
                {
                  id: "row-2",
                  cells: [
                    { id: "cell-3", content: "Data 1", isHeader: false },
                    { id: "cell-4", content: "{variable}", isHeader: false },
                  ],
                },
              ],
            },
          ],
        },
      ],
      lastModified: "2023-01-01T00:00:00Z",
    },
    setCurrentCase: vi.fn(),
    isCreatingCase: false,
    setIsCreatingCase: vi.fn(),
    newCaseName: "",
    setNewCaseName: vi.fn(),
    deleteConfirmationOpen: false,
    setDeleteConfirmationOpen: vi.fn(),
    clearAllConfirmationOpen: false,
    setClearAllConfirmationOpen: vi.fn(),
    handleCreateCase: vi.fn(),
    handleBackToDashboard: vi.fn(),
    handleDeleteCase: vi.fn(),
    confirmDelete: vi.fn(),
    handleClearAll: vi.fn(),
    confirmClearAll: vi.fn(),
    setCaseToDelete: vi.fn(),
    caseToDelete: null,
  }

  const mockTableOperations = {
    newTableData: { title: "", columns: 2, rows: 2, hasHeader: true },
    setNewTableData: vi.fn(),
    handleAddTable: vi.fn(),
    handleDeleteTable: vi.fn(),
    handleAddRow: vi.fn(),
    handleDeleteRow: vi.fn(),
    handleAddColumn: vi.fn(),
    handleDeleteColumn: vi.fn(),
    handleInsertRow: vi.fn(),
    handleInsertColumn: vi.fn(),
    setTableToDelete: vi.fn(),
    deleteTableConfirmationOpen: false,
    setDeleteTableConfirmationOpen: vi.fn(),
    confirmDeleteTable: vi.fn(),
    tableToDelete: null,
    isAddingTableDialog: false,
    setIsAddingTableDialog: vi.fn(),
    isTableDataValid: true,
  }

  const mockSectionOperations = {
    newSectionTitle: "",
    setNewSectionTitle: vi.fn(),
    isAddingSectionDialog: false,
    setIsAddingSectionDialog: vi.fn(),
    handleAddSection: vi.fn(),
    handleDeleteSection: vi.fn(),
    sectionToDelete: null,
    setSectionToDelete: vi.fn(),
    deleteSectionConfirmationOpen: false,
    setDeleteSectionConfirmationOpen: vi.fn(),
    confirmDeleteSection: vi.fn(),
    handleSectionTitleChange: vi.fn(),
  }

  const mockFileOperations = {
    handleDownloadCases: vi.fn(),
    handleDownloadFormat: vi.fn(),
    handleUploadFile: vi.fn(),
    isDownloadDialogOpen: false,
    setIsDownloadDialogOpen: vi.fn(),
    isUploadDialogOpen: false,
    setIsUploadDialogOpen: vi.fn(),
    downloadFileName: "",
    setDownloadFileName: vi.fn(),
    downloadType: "format",
    setDownloadType: vi.fn(),
    uploadedCasesCount: 0,
    existingCasesCount: 0,
    handleMergeCases: vi.fn(),
    handleReplaceCases: vi.fn(),
    uploadedContent: null,
    setUploadedContent: vi.fn(),
    fileInputRef: { current: null },
    handleStartDownload: vi.fn(),
    handleFileSelect: vi.fn(),
    handleUploadClick: vi.fn(),
  }

  const mockResetOperations = {
    handleResetAll: vi.fn(),
    handleFormResetAll: vi.fn(),
  }

  const mockRenameOperations = {
    handleCaseNameChange: vi.fn(),
  }

  const mockCellOperations = {
    handleCellChange: vi.fn(),
    attemptedFields: new Set(),
  }

  const mockMenuOperations = {
    mainMenuAnchorEl: null,
    setMainMenuAnchorEl: vi.fn(),
    handleMainMenuOpen: vi.fn(),
    handleMainMenuClose: vi.fn(),
    fillMenuAnchorEl: null,
    setFillMenuAnchorEl: vi.fn(),
    handleFillMenuOpen: vi.fn(),
    handleFillMenuClose: vi.fn(),
    formActionsMenuAnchorEl: null,
    setFormActionsMenuAnchorEl: vi.fn(),
    handleFormActionsMenuOpen: vi.fn(),
    handleFormActionsMenuClose: vi.fn(),
    activeTableId: null,
    setActiveTableId: vi.fn(),
    formActionsAnchorEl: null,
    setFormActionsAnchorEl: vi.fn(),
    menuAnchorEl: null,
    setMenuAnchorEl: vi.fn(),
    temperature: 0.5,
    setTemperature: vi.fn(),
  }

  const mockAIGeneration = {
    isGenerating: false,
    setIsGenerating: vi.fn(),
    generateContent: vi.fn(),
    handleFillEmpty: vi.fn(),
    handleRegenerateAll: vi.fn(),
    handleResetToVariables: vi.fn(),
  }

  const mockTour = {
    isTourActive: false,
    setIsTourActive: vi.fn(),
    tourSteps: [],
    handleTourStart: vi.fn(),
    handleTourCallback: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up IntersectionObserver mock
    global.IntersectionObserver = mockIntersectionObserver as any

    // Set up mock implementations for each test
    ;(useCaseOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCaseOperations)
    ;(useTableOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockTableOperations
    )
    ;(useSectionOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockSectionOperations
    )
    ;(useFileOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockFileOperations)
    ;(useRenameOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockRenameOperations
    )
    ;(useCellOperations as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockCellOperations)
    ;(useMenuOperations as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockMenuOperations)
    ;(useAIGeneration as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockAIGeneration)
    ;(useTour as unknown as ReturnType<typeof vi.fn>)
      .mockReturnValue(mockTour)
    ;(useResetOperations as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockResetOperations
    )
  })

  it("renders the form builder with a case", () => {
    render(<FormBuilder />)

    // Check for case name
    expect(screen.getByText("Test Case")).toBeInTheDocument()

    // Check for section title
    expect(screen.getByText("Test Section")).toBeInTheDocument()

    // Check for table title
    expect(screen.getByText("Test Table")).toBeInTheDocument()
  })

  it("renders the main toolbar with buttons", () => {
    render(<FormBuilder />)

    // Check for main toolbar buttons
    expect(screen.getByTestId("ArrowBackIcon")).toBeInTheDocument()
    expect(screen.getByTestId("PrintIcon")).toBeInTheDocument()
    expect(screen.getByTestId("MoreVertIcon")).toBeInTheDocument()
  })

  it("renders the add section button", () => {
    render(<FormBuilder />)

    const addSectionButton = screen.getByText("Add Section")
    expect(addSectionButton).toBeInTheDocument()
  })

  it("renders the component successfully", () => {
    // Just verify the component renders without crashing
    const { container } = render(<FormBuilder />)

    // Component should render with a card container
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument()
  })

  it("renders the form in mobile view", () => {
    // Mock useMediaQuery to return true for mobile
    ;(useMediaQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true)

    render(<FormBuilder />)

    // Check for mobile-specific elements or styles
    // This would depend on your implementation
  })
})
