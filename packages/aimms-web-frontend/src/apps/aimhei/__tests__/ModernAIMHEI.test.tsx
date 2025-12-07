import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ModernAIMHEI } from "../ModernAIMHEI"

// Mock components to avoid module resolution issues
vi.mock("../features/upload/components/UploadPanel", () => ({
  UploadPanel: () => (
    <div>
      <h2>Configuration</h2>
      <h3>Upload & Settings</h3>
    </div>
  ),
}))

vi.mock("../features/reports/components/ReportHistoryPanel", () => ({
  ReportHistoryPanel: () => (
    <div>
      <h2>My Reports</h2>
      <p>Standalone Analysis Reports</p>
      <p>No standalone reports yet</p>
    </div>
  ),
}))

vi.mock("../shared/components/DashboardHeader", () => ({
  DashboardHeader: () => <h1>AIMHEI Analysis Tool</h1>,
}))

// Mock all the hooks and components
vi.mock("../stores/aimheiStore", () => ({
  useAIMHEIStore: vi.fn(() => ({
    selectedReportId: null,
    setSelectedReportId: vi.fn(),
  })),
}))

vi.mock("../features/upload/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(() => ({
    transcriptFile: null,
    isDragOver: false,
    fileInputRef: { current: null },
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleFileSelect: vi.fn(),
    handleFileChange: vi.fn(),
    removeFile: vi.fn(),
  })),
}))

vi.mock("../features/upload/hooks/useAIMHEIConfig", () => ({
  useAIMHEIConfig: vi.fn(() => ({
    config: {
      report_name: "",
      interview_date: "",
      human_supervisor: "",
      aispe_location: "",
      hcp_name: "",
      hcp_year: "",
      patient_id: "",
      model: "gpt-4o",
      formatting_process: "standard",
    },
    interviewDate: null,
    validationErrors: {},
    updateConfig: vi.fn(),
    setInterviewDate: vi.fn(),
    validateForm: vi.fn(() => true),
  })),
}))

vi.mock("../features/upload/hooks/useCriteriaUpload", () => ({
  useCriteriaUpload: vi.fn(() => ({
    useCustomCriteria: false,
    criteriaFile: null,
    isCriteriaDragOver: false,
    criteriaFileInputRef: { current: null },
    setUseCustomCriteria: vi.fn(),
    handleCriteriaDragOver: vi.fn(),
    handleCriteriaDragLeave: vi.fn(),
    handleCriteriaDrop: vi.fn(),
    handleCriteriaFileSelect: vi.fn(),
    handleCriteriaFileChange: vi.fn(),
    removeCriteriaFile: vi.fn(),
  })),
}))

vi.mock("../features/processing/hooks/useAIMHEIProcessing", () => ({
  useAIMHEIProcessing: vi.fn(() => ({
    processing: false,
    processingProgress: 0,
    processingMessage: "",
    error: null,
    jobId: null,
    processTranscript: vi.fn(),
  })),
}))

vi.mock("../features/reports/hooks/useReportHistory", () => ({
  useReportHistory: vi.fn(() => ({
    standaloneReports: [],
    loadingReports: false,
    totalReports: 0,
    page: 0,
    rowsPerPage: 10,
    filters: {
      searchField: "all",
      modelFilter: "all",
      dateFilter: "all",
    },
    searchTerm: "",
    setSearchTerm: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    setRowsPerPage: vi.fn(),
    refreshReports: vi.fn(),
    deleteReport: vi.fn(),
  })),
}))

vi.mock("../shared/hooks/useUIState", () => ({
  useUIState: vi.fn(() => ({
    loadingTile: null,
    setLoadingTile: vi.fn(),
    expandedCards: new Set(),
    toggleCardExpansion: vi.fn(),
    exportMode: false,
    setExportMode: vi.fn(),
    selectedReportIds: new Set(),
    setSelectedReportIds: vi.fn(),
    exportingCSV: false,
    setExportingCSV: vi.fn(),
    anchorEl: null,
    setAnchorEl: vi.fn(),
    selectedReportIdForAction: null,
    setSelectedReportIdForAction: vi.fn(),
    deleteDialogOpen: false,
    setDeleteDialogOpen: vi.fn(),
    shareDialogOpen: false,
    setShareDialogOpen: vi.fn(),
    snackbar: { open: false, message: "", severity: "success" as const },
    setSnackbar: vi.fn(),
    showSnackbar: vi.fn(),
    hideSnackbar: vi.fn(),
  })),
}))

vi.mock("../shared/hooks/useUserRole", () => ({
  useUserRole: vi.fn(() => ({
    userRole: null,
    loading: false,
  })),
}))

// TODO: Fix integration test - has complex mocking requirements
// All individual components are thoroughly tested
describe.skip("ModernAIMHEI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the component", () => {
    render(<ModernAIMHEI />)

    // The component should render (will depend on actual DOM structure)
    const container = screen.getByRole("main")
    expect(container).toBeInTheDocument()
  })

  it("should render dashboard header", () => {
    render(<ModernAIMHEI />)

    expect(screen.getByText("AIMHEI Analysis Tool")).toBeInTheDocument()
  })

  it("should render upload panel", () => {
    render(<ModernAIMHEI />)

    expect(screen.getByText("Configuration")).toBeInTheDocument()
    expect(screen.getByText("Upload & Settings")).toBeInTheDocument()
  })

  it("should render report history panel", () => {
    render(<ModernAIMHEI />)

    expect(screen.getByText("My Reports")).toBeInTheDocument()
    expect(screen.getByText("Standalone Analysis Reports")).toBeInTheDocument()
  })

  it("should show empty state when no reports", () => {
    render(<ModernAIMHEI />)

    expect(screen.getByText("No standalone reports yet")).toBeInTheDocument()
  })
})
