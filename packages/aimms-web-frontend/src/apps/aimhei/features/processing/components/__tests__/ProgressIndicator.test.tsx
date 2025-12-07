/**
 * ProgressIndicator Component Tests
 */

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProgressIndicator } from "../ProgressIndicator"

describe("ProgressIndicator", () => {
  describe("Rendering", () => {
    it("should render progress bar with percentage", () => {
      render(<ProgressIndicator progress={50} />)
      expect(screen.getByText("50%")).toBeInTheDocument()
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("should render with default message", () => {
      render(<ProgressIndicator progress={25} />)
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })

    it("should render with custom message", () => {
      render(<ProgressIndicator progress={75} message="Analyzing transcript..." />)
      expect(screen.getByText("Analyzing transcript...")).toBeInTheDocument()
      expect(screen.queryByText(/^processing$/i)).not.toBeInTheDocument()
    })

    it("should render job ID when provided", () => {
      render(<ProgressIndicator progress={30} jobId="job-12345" />)
      expect(screen.getByText(/job id: job-12345/i)).toBeInTheDocument()
    })

    it("should not render job ID section when not provided", () => {
      render(<ProgressIndicator progress={30} />)
      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()
    })

    it("should not render job ID when null", () => {
      render(<ProgressIndicator progress={30} jobId={null} />)
      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()
    })
  })

  describe("Progress Values", () => {
    it("should display 0% progress", () => {
      render(<ProgressIndicator progress={0} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should display 100% progress", () => {
      render(<ProgressIndicator progress={100} />)
      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should round decimal progress values", () => {
      render(<ProgressIndicator progress={33.333} />)
      expect(screen.getByText("33%")).toBeInTheDocument()
    })

    it("should round progress values up at .5 and above", () => {
      render(<ProgressIndicator progress={45.5} />)
      expect(screen.getByText("46%")).toBeInTheDocument()
    })

    it("should round progress values down below .5", () => {
      render(<ProgressIndicator progress={45.4} />)
      expect(screen.getByText("45%")).toBeInTheDocument()
    })

    it("should handle very small progress values", () => {
      render(<ProgressIndicator progress={0.1} />)
      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should handle progress values near 100", () => {
      render(<ProgressIndicator progress={99.9} />)
      expect(screen.getByText("100%")).toBeInTheDocument()
    })
  })

  describe("Progress Bar", () => {
    it("should set correct aria-valuenow on progressbar", () => {
      render(<ProgressIndicator progress={60} />)
      const progressbar = screen.getByRole("progressbar")
      expect(progressbar).toHaveAttribute("aria-valuenow", "60")
    })

    it("should update progressbar value when progress changes", () => {
      const { rerender } = render(<ProgressIndicator progress={20} />)
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20")

      rerender(<ProgressIndicator progress={80} />)
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80")
    })
  })

  describe("Message Updates", () => {
    it("should update message when prop changes", () => {
      const { rerender } = render(<ProgressIndicator progress={25} message="Starting..." />)
      expect(screen.getByText("Starting...")).toBeInTheDocument()

      rerender(<ProgressIndicator progress={50} message="Half done..." />)
      expect(screen.getByText("Half done...")).toBeInTheDocument()
      expect(screen.queryByText("Starting...")).not.toBeInTheDocument()
    })

    it("should handle empty message", () => {
      render(<ProgressIndicator progress={50} message="" />)
      // Should fall back to default "Processing..."
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })

  describe("Job ID Display", () => {
    it("should update job ID when it changes", () => {
      const { rerender } = render(<ProgressIndicator progress={25} jobId="job-111" />)
      expect(screen.getByText(/job id: job-111/i)).toBeInTheDocument()

      rerender(<ProgressIndicator progress={50} jobId="job-222" />)
      expect(screen.getByText(/job id: job-222/i)).toBeInTheDocument()
      expect(screen.queryByText(/job id: job-111/i)).not.toBeInTheDocument()
    })

    it("should show job ID when it becomes available", () => {
      const { rerender } = render(<ProgressIndicator progress={25} />)
      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()

      rerender(<ProgressIndicator progress={50} jobId="job-new" />)
      expect(screen.getByText(/job id: job-new/i)).toBeInTheDocument()
    })

    it("should hide job ID when it becomes null", () => {
      const { rerender } = render(<ProgressIndicator progress={25} jobId="job-temp" />)
      expect(screen.getByText(/job id: job-temp/i)).toBeInTheDocument()

      rerender(<ProgressIndicator progress={50} jobId={null} />)
      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have accessible progressbar role", () => {
      render(<ProgressIndicator progress={50} />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("should have aria-valuenow attribute", () => {
      render(<ProgressIndicator progress={75} />)
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75")
    })

    it("should have visible text describing progress", () => {
      render(<ProgressIndicator progress={40} message="Loading data" />)
      expect(screen.getByText("Loading data")).toBeVisible()
      expect(screen.getByText("40%")).toBeVisible()
    })
  })

  describe("Visual State", () => {
    it("should render all three sections when complete props provided", () => {
      render(<ProgressIndicator progress={65} message="Processing data" jobId="job-abc" />)

      // Message
      expect(screen.getByText("Processing data")).toBeInTheDocument()
      // Percentage
      expect(screen.getByText("65%")).toBeInTheDocument()
      // Job ID
      expect(screen.getByText(/job id: job-abc/i)).toBeInTheDocument()
      // Progress bar
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    it("should render minimal state with only progress", () => {
      render(<ProgressIndicator progress={10} />)

      // Default message
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
      // Percentage
      expect(screen.getByText("10%")).toBeInTheDocument()
      // No job ID
      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()
    })
  })
})
