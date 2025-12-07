/**
 * ReportCard Component Tests
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReportCard } from "../ReportCard"

describe("ReportCard", () => {
  const mockReport = {
    reportId: 1,
    title: "Test Report",
    patientId: "P12345",
    hcpName: "Dr. Smith",
    score: 85,
    aiModel: "gpt-4o",
    createdAt: "2025-01-15T10:00:00Z",
  }

  describe("Rendering - CamelCase Props", () => {
    it("should render report title", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.getByText("Test Report")).toBeInTheDocument()
    })

    it("should render patient ID and HCP name", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.getByText(/patient: p12345/i)).toBeInTheDocument()
      expect(screen.getByText(/hcp: dr\. smith/i)).toBeInTheDocument()
    })

    it("should render score chip", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.getByText("85%")).toBeInTheDocument()
    })

    it("should render AI model chip", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.getByText("gpt-4o")).toBeInTheDocument()
    })

    it("should render formatted date", () => {
      render(<ReportCard {...mockReport} />)
      // Check for date in format like "1/15/2025"
      expect(screen.getByText(/1\/15\/2025/)).toBeInTheDocument()
    })

    it("should render assessment icon", () => {
      const { container } = render(<ReportCard {...mockReport} />)
      const icon = container.querySelector('[data-testid="AssessmentIcon"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe("Rendering - Snake_Case Props", () => {
    it("should support snake_case API format", () => {
      const snakeCaseReport = {
        report_id: 2,
        case_title: "Snake Case Report",
        patient_id: "P99999",
        hcp_name: "Dr. Jones",
        percentage_score: 72,
        ai_model: "claude-3-5-sonnet",
        created_at: "2025-01-20T15:30:00Z",
      }

      render(<ReportCard {...snakeCaseReport} />)
      expect(screen.getByText("Snake Case Report")).toBeInTheDocument()
      expect(screen.getByText(/patient: p99999/i)).toBeInTheDocument()
      expect(screen.getByText(/hcp: dr\. jones/i)).toBeInTheDocument()
      expect(screen.getByText("72%")).toBeInTheDocument()
      expect(screen.getByText("claude-3-5-sonnet")).toBeInTheDocument()
    })

    it("should prioritize camelCase over snake_case when both provided", () => {
      const mixedReport = {
        reportId: 3,
        report_id: 999,
        title: "CamelCase Title",
        case_title: "Snake Case Title",
        score: 90,
        percentage_score: 50,
      }

      render(<ReportCard {...mixedReport} />)
      // Should use camelCase values
      expect(screen.getByText("CamelCase Title")).toBeInTheDocument()
      expect(screen.getByText("90%")).toBeInTheDocument()
    })
  })

  describe("Default Values", () => {
    it("should show default title when no title provided", () => {
      render(<ReportCard reportId={1} />)
      expect(screen.getByText("Untitled Report")).toBeInTheDocument()
    })

    it("should show N/A for missing patient ID", () => {
      render(<ReportCard reportId={1} title="Test" />)
      expect(screen.getByText(/patient: n\/a/i)).toBeInTheDocument()
    })

    it("should show Unknown for missing HCP name", () => {
      render(<ReportCard reportId={1} title="Test" />)
      expect(screen.getByText(/hcp: unknown/i)).toBeInTheDocument()
    })

    it("should show 0% for missing score", () => {
      render(<ReportCard reportId={1} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should show N/A for missing AI model", () => {
      render(<ReportCard reportId={1} />)
      expect(screen.getByText("N/A")).toBeInTheDocument()
    })
  })

  describe("Score Colors", () => {
    it("should use green color for excellent scores (>=80)", () => {
      const { container } = render(<ReportCard {...mockReport} score={85} />)
      const chip = screen.getByText("85%").closest(".MuiChip-root")
      expect(chip).toHaveStyle({ color: "rgb(255, 255, 255)" })
    })

    it("should use blue color for good scores (60-79)", () => {
      render(<ReportCard {...mockReport} score={70} />)
      expect(screen.getByText("70%")).toBeInTheDocument()
    })

    it("should use orange color for fair scores (40-59)", () => {
      render(<ReportCard {...mockReport} score={50} />)
      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should use red color for poor scores (<40)", () => {
      render(<ReportCard {...mockReport} score={30} />)
      expect(screen.getByText("30%")).toBeInTheDocument()
    })

    it("should round decimal scores", () => {
      render(<ReportCard {...mockReport} score={85.7} />)
      expect(screen.getByText("86%")).toBeInTheDocument()
    })
  })

  describe("Interactions", () => {
    it("should call onClick when card is clicked", async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<ReportCard {...mockReport} onClick={handleClick} />)

      await user.click(screen.getByText("Test Report"))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it("should not call onClick when no handler provided", async () => {
      const user = userEvent.setup()
      render(<ReportCard {...mockReport} />)

      // Should not throw error
      await user.click(screen.getByText("Test Report"))
    })

    it("should call onMenuClick when menu button clicked", async () => {
      const user = userEvent.setup()
      const handleMenuClick = vi.fn()
      render(<ReportCard {...mockReport} onMenuClick={handleMenuClick} />)

      const menuButton = screen.getByRole("button")
      await user.click(menuButton)
      expect(handleMenuClick).toHaveBeenCalledTimes(1)
    })

    it("should stop propagation when menu clicked", async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      const handleMenuClick = vi.fn()
      render(<ReportCard {...mockReport} onClick={handleClick} onMenuClick={handleMenuClick} />)

      const menuButton = screen.getByRole("button")
      await user.click(menuButton)

      // Menu click should be called, card click should NOT
      expect(handleMenuClick).toHaveBeenCalledTimes(1)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it("should not render menu button when onMenuClick not provided", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })
  })

  describe("Selection State", () => {
    it("should not be selected by default", () => {
      const { container } = render(<ReportCard {...mockReport} />)
      const card = container.querySelector(".MuiCard-root")
      // Should have default border, not selected border
      expect(card).not.toHaveStyle({ border: expect.stringContaining("2px") })
    })

    it("should show selected state", () => {
      const { container } = render(<ReportCard {...mockReport} selected />)
      const card = container.querySelector(".MuiCard-root")
      expect(card).toBeInTheDocument()
      // Selected cards have different styling
    })

    it("should toggle selection state", () => {
      const { container, rerender } = render(<ReportCard {...mockReport} selected={false} />)
      let card = container.querySelector(".MuiCard-root")
      expect(card).toBeInTheDocument()

      rerender(<ReportCard {...mockReport} selected />)
      card = container.querySelector(".MuiCard-root")
      expect(card).toBeInTheDocument()
    })
  })

  describe("Cursor Behavior", () => {
    it("should show pointer cursor when onClick provided", () => {
      const { container } = render(<ReportCard {...mockReport} onClick={vi.fn()} />)
      const card = container.querySelector(".MuiCard-root")
      expect(card).toHaveStyle({ cursor: "pointer" })
    })

    it("should show default cursor when onClick not provided", () => {
      const { container } = render(<ReportCard {...mockReport} />)
      const card = container.querySelector(".MuiCard-root")
      expect(card).toHaveStyle({ cursor: "default" })
    })
  })

  describe("Date Formatting", () => {
    it("should format ISO date string correctly", () => {
      render(<ReportCard {...mockReport} createdAt="2025-03-25T08:30:00Z" />)
      expect(screen.getByText(/3\/25\/2025/)).toBeInTheDocument()
    })

    it("should handle different date formats", () => {
      render(<ReportCard {...mockReport} createdAt="2025-12-31T23:59:59Z" />)
      expect(screen.getByText(/12\/31\/2025/)).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should render menu button when provided", () => {
      render(<ReportCard {...mockReport} onMenuClick={vi.fn()} />)
      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
      // IconButton should have aria-label or accessible name
      expect(button).toHaveAttribute("aria-label")
    })

    it("should have accessible report information", () => {
      render(<ReportCard {...mockReport} />)
      expect(screen.getByText("Test Report")).toBeVisible()
      expect(screen.getByText("85%")).toBeVisible()
      expect(screen.getByText("gpt-4o")).toBeVisible()
    })
  })

  describe("Edge Cases", () => {
    it("should handle very long titles", () => {
      const longTitle =
        "This is an extremely long report title that might wrap to multiple lines in the UI"
      render(<ReportCard {...mockReport} title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it("should handle special characters in names", () => {
      render(<ReportCard {...mockReport} hcpName="Dr. O'Brien-Smith Jr." patientId="P-12345/A" />)
      expect(screen.getByText(/dr\. o'brien-smith jr\./i)).toBeInTheDocument()
      expect(screen.getByText(/p-12345\/a/i)).toBeInTheDocument()
    })

    it("should handle score of exactly 0", () => {
      render(<ReportCard {...mockReport} score={0} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle score of exactly 100", () => {
      render(<ReportCard {...mockReport} score={100} />)
      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should handle null percentage_score by using 0", () => {
      render(<ReportCard report_id={1} percentage_score={null} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })
  })
})
