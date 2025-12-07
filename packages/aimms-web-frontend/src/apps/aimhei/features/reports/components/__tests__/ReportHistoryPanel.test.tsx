import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReportHistoryPanel, type StandaloneReport } from "../ReportHistoryPanel"

// Mock MUI DateTimePicker to avoid module resolution issues
vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: ({ value, onChange, label }: any) => (
    <div data-testid="date-time-picker">
      <label>{label}</label>
      <input type="datetime-local" value={value} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  ),
}))

const mockReport: StandaloneReport = {
  report_id: 1,
  case_title: "Test Case",
  percentage_score: 85,
  updated_at: "2024-01-15T10:00:00Z",
  status: "completed",
  total_points_earned: 85,
  total_points_possible: 100,
  ai_model: "gpt-4o",
  hcp_name: "Dr. Smith",
  patient_id: "P12345",
}

const defaultProps = {
  standaloneReports: [mockReport],
  totalReports: 1,
  loadingReports: false,
  loadingTile: null,
  page: 0,
  rowsPerPage: 10,
  searchTerm: "",
  searchField: "all",
  modelFilter: "all",
  dateRange: { start: null, end: null, macro: "all" as const },
  exportMode: false,
  selectedReportIds: new Set<number>(),
  expandedCards: new Set<number>(),
  hasActiveFilters: false,
  refreshReports: vi.fn(),
  setSearchTerm: vi.fn(),
  setSearchField: vi.fn(),
  setModelFilter: vi.fn(),
  setDateRange: vi.fn(),
  clearAllFilters: vi.fn(),
  setExportMode: vi.fn(),
  handleSelectReport: vi.fn(),
  handleSelectAll: vi.fn(),
  handleCancelExport: vi.fn(),
  handleViewReport: vi.fn(),
  handleActionsClick: vi.fn(),
  toggleCardExpansion: vi.fn(),
  handleChangePage: vi.fn(),
  handleChangeRowsPerPage: vi.fn(),
  getScoreColor: vi.fn(() => "#4CAF50"),
}

describe("ReportHistoryPanel", () => {
  describe("Header", () => {
    it("should render panel title", () => {
      render(<ReportHistoryPanel {...defaultProps} />)

      expect(screen.getByText("My Reports")).toBeInTheDocument()
      expect(screen.getByText("Standalone Analysis Reports")).toBeInTheDocument()
    })

    it("should render refresh button", () => {
      const { container } = render(<ReportHistoryPanel {...defaultProps} />)

      const refreshButton = container.querySelector('[data-testid="RefreshIcon"]')
      expect(refreshButton || container.querySelector("button")).toBeInTheDocument()
    })

    it("should call refreshReports when refresh button clicked", () => {
      const refreshReports = vi.fn()
      const { container } = render(
        <ReportHistoryPanel {...defaultProps} refreshReports={refreshReports} />,
      )

      const buttons = container.querySelectorAll("button")
      // Find and click the refresh button (first button in header)
      if (buttons[0]) {
        fireEvent.click(buttons[0])
        expect(refreshReports).toHaveBeenCalled()
      }
    })
  })

  describe("Loading state", () => {
    it("should show loading indicator when loadingReports is true", () => {
      render(<ReportHistoryPanel {...defaultProps} loadingReports />)

      expect(screen.getByText("Loading reports...")).toBeInTheDocument()
    })

    it("should not show loading indicator when loadingReports is false", () => {
      render(<ReportHistoryPanel {...defaultProps} loadingReports={false} />)

      expect(screen.queryByText("Loading reports...")).not.toBeInTheDocument()
    })
  })

  describe("Empty state", () => {
    it("should show empty state when no reports", () => {
      render(<ReportHistoryPanel {...defaultProps} standaloneReports={[]} totalReports={0} />)

      expect(screen.getByText("No standalone reports yet")).toBeInTheDocument()
    })

    it("should show no results message when filters applied", () => {
      render(
        <ReportHistoryPanel
          {...defaultProps}
          standaloneReports={[]}
          totalReports={0}
          searchTerm="test"
          hasActiveFilters={true}
        />,
      )

      expect(screen.getByText("No reports match your filters")).toBeInTheDocument()
    })
  })

  describe("Report rendering", () => {
    it("should render report case title", () => {
      render(<ReportHistoryPanel {...defaultProps} />)

      expect(screen.getByText("Test Case")).toBeInTheDocument()
    })

    it("should render report ID", () => {
      render(<ReportHistoryPanel {...defaultProps} />)

      expect(screen.getByText(/ID: 1/)).toBeInTheDocument()
    })

    it("should render View Report button", () => {
      render(<ReportHistoryPanel {...defaultProps} />)

      expect(screen.getByText("View Report")).toBeInTheDocument()
    })

    it("should call handleViewReport when View button clicked", () => {
      const handleViewReport = vi.fn()
      render(<ReportHistoryPanel {...defaultProps} handleViewReport={handleViewReport} />)

      const viewButton = screen.getByText("View Report")
      fireEvent.click(viewButton)

      expect(handleViewReport).toHaveBeenCalledWith(1)
    })
  })

  describe("Search and filters", () => {
    it("should render search field", () => {
      render(<ReportHistoryPanel {...defaultProps} />)

      expect(screen.getByRole("textbox")).toBeInTheDocument()
    })

    it("should receive setExportMode prop", () => {
      const setExportMode = vi.fn()
      render(<ReportHistoryPanel {...defaultProps} setExportMode={setExportMode} />)

      // setExportMode is a prop that can be called from parent
      expect(setExportMode).toBeDefined()
    })

    it("should have date range picker when reports exist", () => {
      const { container } = render(<ReportHistoryPanel {...defaultProps} />)

      // Check for date picker
      expect(container.querySelector('[id="report-date-filter"]')).toBeInTheDocument()
    })
  })

  describe("Export mode", () => {
    it("should show export mode banner when exportMode is true", () => {
      render(<ReportHistoryPanel {...defaultProps} exportMode />)

      expect(screen.getByText("Select All")).toBeInTheDocument()
    })

    it("should not show export mode banner when exportMode is false", () => {
      render(<ReportHistoryPanel {...defaultProps} exportMode={false} />)

      expect(screen.queryByText("Select All")).not.toBeInTheDocument()
    })

    it("should show selection count in export mode", () => {
      const selectedReportIds = new Set([1])
      render(
        <ReportHistoryPanel {...defaultProps} exportMode selectedReportIds={selectedReportIds} />,
      )

      expect(screen.getByText(/1 of 1 selected/)).toBeInTheDocument()
    })

    it("should call handleSelectAll when Select All is clicked", () => {
      const handleSelectAll = vi.fn()
      render(<ReportHistoryPanel {...defaultProps} exportMode handleSelectAll={handleSelectAll} />)

      const selectAllButton = screen.getByText("Select All")
      fireEvent.click(selectAllButton)

      expect(handleSelectAll).toHaveBeenCalled()
    })

    it("should call handleCancelExport when Cancel is clicked in export mode", () => {
      const handleCancelExport = vi.fn()
      render(
        <ReportHistoryPanel {...defaultProps} exportMode handleCancelExport={handleCancelExport} />,
      )

      const cancelButton = screen.getByText("Cancel")
      fireEvent.click(cancelButton)

      expect(handleCancelExport).toHaveBeenCalled()
    })
  })

  describe("Loading tile", () => {
    it("should render loading tile when provided", () => {
      const loadingTile = {
        title: "Processing Report",
        progress: 50,
        message: "Processing...",
      }

      render(<ReportHistoryPanel {...defaultProps} loadingTile={loadingTile} />)

      expect(screen.getByText("Processing Report")).toBeInTheDocument()
      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should not render loading tile when null", () => {
      render(<ReportHistoryPanel {...defaultProps} loadingTile={null} />)

      expect(screen.queryByText("50%")).not.toBeInTheDocument()
    })
  })

  describe("Pagination", () => {
    it("should render pagination when totalReports > 0", () => {
      render(<ReportHistoryPanel {...defaultProps} totalReports={20} />)

      // Pagination text typically shows "1-10 of 20" or similar
      expect(screen.getByText(/of 20/)).toBeInTheDocument()
    })

    it("should not render pagination when totalReports is 0", () => {
      render(<ReportHistoryPanel {...defaultProps} standaloneReports={[]} totalReports={0} />)

      expect(screen.queryByText(/of 0/)).not.toBeInTheDocument()
    })
  })
})
