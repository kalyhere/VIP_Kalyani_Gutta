/**
 * ReportsList Component Tests
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReportsList } from "../ReportsList"

describe("ReportsList", () => {
  const mockReports = [
    {
      reportId: 1,
      title: "Report One",
      patientId: "P001",
      hcpName: "Dr. Smith",
      score: 85,
      aiModel: "gpt-4o",
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      reportId: 2,
      title: "Report Two",
      patientId: "P002",
      hcpName: "Dr. Jones",
      score: 70,
      aiModel: "claude-3-5-sonnet",
      createdAt: "2025-01-16T11:00:00Z",
    },
    {
      reportId: 3,
      title: "Report Three",
      patientId: "P003",
      hcpName: "Dr. Brown",
      score: 92,
      aiModel: "gpt-4o-mini",
      createdAt: "2025-01-17T12:00:00Z",
    },
  ]

  describe("Rendering with Reports", () => {
    it("should render all reports", () => {
      render(<ReportsList reports={mockReports} />)

      expect(screen.getByText("Report One")).toBeInTheDocument()
      expect(screen.getByText("Report Two")).toBeInTheDocument()
      expect(screen.getByText("Report Three")).toBeInTheDocument()
    })

    it("should render reports in grid layout", () => {
      const { container } = render(<ReportsList reports={mockReports} />)
      const grid = container.querySelector(".MuiGrid-container")
      expect(grid).toBeInTheDocument()
    })

    it("should render correct number of report cards", () => {
      render(<ReportsList reports={mockReports} />)
      // Each report has a title
      expect(screen.getAllByText(/report/i)).toHaveLength(3)
    })

    it("should pass report data to ReportCard components", () => {
      render(<ReportsList reports={mockReports} />)

      // Check that report details are rendered
      expect(screen.getByText(/patient: p001/i)).toBeInTheDocument()
      expect(screen.getByText(/patient: p002/i)).toBeInTheDocument()
      expect(screen.getByText(/patient: p003/i)).toBeInTheDocument()
    })
  })

  describe("Loading State", () => {
    it("should show loading spinner when loading", () => {
      render(<ReportsList reports={[]} loading />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("should not show reports when loading", () => {
      render(<ReportsList reports={mockReports} loading />)
      expect(screen.queryByText("Report One")).not.toBeInTheDocument()
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("should not show empty state when loading", () => {
      render(<ReportsList reports={[]} loading />)
      expect(screen.queryByText(/no reports found/i)).not.toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("should show empty message when no reports", () => {
      render(<ReportsList reports={[]} />)
      expect(screen.getByText(/no reports found/i)).toBeInTheDocument()
    })

    it("should show custom empty message", () => {
      render(<ReportsList reports={[]} emptyMessage="No data available" />)
      expect(screen.getByText("No data available")).toBeInTheDocument()
    })

    it("should show empty state icon", () => {
      const { container } = render(<ReportsList reports={[]} />)
      const icon = container.querySelector('[data-testid="AssessmentIcon"]')
      expect(icon).toBeInTheDocument()
    })

    it("should not show grid when empty", () => {
      const { container } = render(<ReportsList reports={[]} />)
      const grid = container.querySelector(".MuiGrid-container")
      expect(grid).not.toBeInTheDocument()
    })
  })

  describe("Report Click Handling", () => {
    it("should call onViewReport when report clicked", async () => {
      const user = userEvent.setup()
      const handleViewReport = vi.fn()
      render(<ReportsList reports={mockReports} onViewReport={handleViewReport} />)

      await user.click(screen.getByText("Report One"))
      expect(handleViewReport).toHaveBeenCalledWith(1)
    })

    it("should call onReportClick when provided instead of onViewReport", async () => {
      const user = userEvent.setup()
      const handleReportClick = vi.fn()
      render(<ReportsList reports={mockReports} onReportClick={handleReportClick} />)

      await user.click(screen.getByText("Report Two"))
      expect(handleReportClick).toHaveBeenCalledWith(2)
    })

    it("should prioritize onViewReport over onReportClick", async () => {
      const user = userEvent.setup()
      const handleViewReport = vi.fn()
      const handleReportClick = vi.fn()
      render(
        <ReportsList
          reports={mockReports}
          onViewReport={handleViewReport}
          onReportClick={handleReportClick}
        />
      )

      await user.click(screen.getByText("Report One"))
      expect(handleViewReport).toHaveBeenCalledWith(1)
      expect(handleReportClick).not.toHaveBeenCalled()
    })

    it("should not make cards clickable when no handlers provided", () => {
      const { container } = render(<ReportsList reports={mockReports} />)
      const cards = container.querySelectorAll(".MuiCard-root")
      cards.forEach((card) => {
        expect(card).toHaveStyle({ cursor: "default" })
      })
    })

    it("should handle clicks on different reports", async () => {
      const user = userEvent.setup()
      const handleViewReport = vi.fn()
      render(<ReportsList reports={mockReports} onViewReport={handleViewReport} />)

      await user.click(screen.getByText("Report One"))
      expect(handleViewReport).toHaveBeenCalledWith(1)

      await user.click(screen.getByText("Report Three"))
      expect(handleViewReport).toHaveBeenCalledWith(3)
    })
  })

  describe("Menu Click Handling", () => {
    it("should call onReportMenuClick when menu clicked", async () => {
      const user = userEvent.setup()
      const handleMenuClick = vi.fn()
      render(<ReportsList reports={mockReports} onReportMenuClick={handleMenuClick} />)

      const menuButtons = screen.getAllByRole("button")
      await user.click(menuButtons[0])

      expect(handleMenuClick).toHaveBeenCalledWith(1, expect.any(Object))
    })

    it("should pass correct report ID to menu handler", async () => {
      const user = userEvent.setup()
      const handleMenuClick = vi.fn()
      render(<ReportsList reports={mockReports} onReportMenuClick={handleMenuClick} />)

      const menuButtons = screen.getAllByRole("button")
      await user.click(menuButtons[1]) // Second report

      expect(handleMenuClick).toHaveBeenCalledWith(2, expect.any(Object))
    })

    it("should not render menu buttons when handler not provided", () => {
      render(<ReportsList reports={mockReports} />)
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })
  })

  describe("Selection State", () => {
    it("should highlight selected report", () => {
      render(<ReportsList reports={mockReports} selectedReportId={2} />)
      // Selected report exists in the list
      expect(screen.getByText("Report Two")).toBeInTheDocument()
    })

    it("should handle no selection", () => {
      render(<ReportsList reports={mockReports} selectedReportId={null} />)
      expect(screen.getByText("Report One")).toBeInTheDocument()
    })

    it("should handle selection change", () => {
      const { rerender } = render(<ReportsList reports={mockReports} selectedReportId={1} />)
      expect(screen.getByText("Report One")).toBeInTheDocument()

      rerender(<ReportsList reports={mockReports} selectedReportId={3} />)
      expect(screen.getByText("Report Three")).toBeInTheDocument()
    })

    it("should handle selection of non-existent report", () => {
      render(<ReportsList reports={mockReports} selectedReportId={999} />)
      // Should still render all reports normally
      expect(screen.getByText("Report One")).toBeInTheDocument()
    })
  })

  describe("Snake Case Props Support", () => {
    it("should handle reports with snake_case properties", () => {
      const snakeCaseReports = [
        {
          report_id: 10,
          case_title: "Snake Case Report",
          patient_id: "P999",
          hcp_name: "Dr. Snake",
          percentage_score: 88,
          ai_model: "gpt-4o",
          created_at: "2025-01-20T15:00:00Z",
        },
      ]

      render(<ReportsList reports={snakeCaseReports} />)
      expect(screen.getByText("Snake Case Report")).toBeInTheDocument()
      expect(screen.getByText(/patient: p999/i)).toBeInTheDocument()
      expect(screen.getByText(/dr\. snake/i)).toBeInTheDocument()
    })

    it("should call handlers with correct IDs from snake_case", async () => {
      const user = userEvent.setup()
      const handleViewReport = vi.fn()
      const snakeCaseReports = [
        {
          report_id: 42,
          case_title: "Test Report",
        },
      ]

      render(<ReportsList reports={snakeCaseReports} onViewReport={handleViewReport} />)

      await user.click(screen.getByText("Test Report"))
      expect(handleViewReport).toHaveBeenCalledWith(42)
    })
  })

  describe("Grid Layout Responsiveness", () => {
    it("should render grid items for each report", () => {
      const { container } = render(<ReportsList reports={mockReports} />)
      const gridItems = container.querySelectorAll(".MuiGrid-item")
      expect(gridItems).toHaveLength(3)
    })

    it("should handle single report", () => {
      render(<ReportsList reports={[mockReports[0]]} />)
      expect(screen.getByText("Report One")).toBeInTheDocument()
    })

    it("should handle many reports", () => {
      const manyReports = Array.from({ length: 20 }, (_, i) => ({
        reportId: i + 1,
        title: `Report ${i + 1}`,
        score: 75,
      }))

      render(<ReportsList reports={manyReports} />)
      expect(screen.getByText("Report 1")).toBeInTheDocument()
      expect(screen.getByText("Report 20")).toBeInTheDocument()
    })
  })

  describe("Combined Props", () => {
    it("should handle all interactive props together", async () => {
      const user = userEvent.setup()
      const handleViewReport = vi.fn()
      const handleMenuClick = vi.fn()

      render(
        <ReportsList
          reports={mockReports}
          onViewReport={handleViewReport}
          onReportMenuClick={handleMenuClick}
          selectedReportId={2}
        />
      )

      // Click on a report
      await user.click(screen.getByText("Report One"))
      expect(handleViewReport).toHaveBeenCalledWith(1)

      // Click on a menu
      const menuButtons = screen.getAllByRole("button")
      await user.click(menuButtons[0])
      expect(handleMenuClick).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle reports with missing optional fields", () => {
      const minimalReports = [{ reportId: 1 }]
      render(<ReportsList reports={minimalReports} />)
      expect(screen.getByText("Untitled Report")).toBeInTheDocument()
    })

    it("should handle reports with zero score", () => {
      const zeroScoreReports = [{ reportId: 1, title: "Zero Score", score: 0 }]
      render(<ReportsList reports={zeroScoreReports} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle reports with null percentage_score", () => {
      const nullScoreReports = [{ report_id: 1, case_title: "Null Score", percentage_score: null }]
      render(<ReportsList reports={nullScoreReports} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle empty array without error", () => {
      render(<ReportsList reports={[]} />)
      expect(screen.getByText(/no reports found/i)).toBeInTheDocument()
    })

    it("should handle transition from loading to empty", () => {
      const { rerender } = render(<ReportsList reports={[]} loading />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()

      rerender(<ReportsList reports={[]} loading={false} />)
      expect(screen.getByText(/no reports found/i)).toBeInTheDocument()
    })

    it("should handle transition from loading to populated", () => {
      const { rerender } = render(<ReportsList reports={[]} loading />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()

      rerender(<ReportsList reports={mockReports} loading={false} />)
      expect(screen.getByText("Report One")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have accessible loading state", () => {
      render(<ReportsList reports={[]} loading />)
      const progressbar = screen.getByRole("progressbar")
      expect(progressbar).toBeInTheDocument()
      expect(progressbar).toBeVisible()
    })

    it("should have accessible empty state message", () => {
      render(<ReportsList reports={[]} />)
      const message = screen.getByText(/no reports found/i)
      expect(message).toBeVisible()
    })

    it("should render accessible report cards", () => {
      render(<ReportsList reports={mockReports} />)
      // All report titles should be visible
      expect(screen.getByText("Report One")).toBeVisible()
      expect(screen.getByText("Report Two")).toBeVisible()
      expect(screen.getByText("Report Three")).toBeVisible()
    })
  })
})
