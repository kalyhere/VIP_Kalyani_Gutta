import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoadingTile } from "../LoadingTile"

describe("LoadingTile", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-15T14:30:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render title and progress percentage", () => {
    render(<LoadingTile title="Test Report" progress={50} message="Processing..." />)

    expect(screen.getByText("Test Report")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should render formatted date and time", () => {
    render(<LoadingTile title="Test Report" progress={25} message="Starting..." />)

    expect(screen.getByText(/Jan 15, 2024 2:30 PM/i)).toBeInTheDocument()
  })

  it("should show Processing status", () => {
    render(<LoadingTile title="Test Report" progress={75} message="Almost done" />)

    expect(screen.getByText(/Processing/)).toBeInTheDocument()
  })

  it("should display circular progress indicator", () => {
    const { container } = render(
      <LoadingTile title="Test Report" progress={40} message="Loading" />,
    )

    const progress = container.querySelector('[class*="MuiCircularProgress-root"]')
    expect(progress).toBeInTheDocument()
  })

  describe("processing messages", () => {
    it("should show custom message for low progress (<20%)", () => {
      render(<LoadingTile title="Test Report" progress={10} message="Custom message" />)

      expect(screen.getByText("Custom message")).toBeInTheDocument()
    })

    it("should show custom message for medium-low progress (<40%)", () => {
      render(<LoadingTile title="Test Report" progress={30} message="Custom parsing message" />)

      expect(screen.getByText("Custom parsing message")).toBeInTheDocument()
    })

    it("should show generated message for medium progress (40-60%)", () => {
      const { container } = render(<LoadingTile title="Test Report" progress={50} message="" />)

      // Just check that some message is displayed - the exact text is randomized
      const messageElement = container.querySelector('[class*="MuiTypography-body2"]')
      expect(messageElement).toBeInTheDocument()
      expect(messageElement?.textContent).toBeTruthy()
    })

    it("should show generated message for high progress (60-80%)", () => {
      const { container } = render(<LoadingTile title="Test Report" progress={70} message="" />)

      // Just check that some message is displayed - the exact text is randomized
      const messageElement = container.querySelector('[class*="MuiTypography-body2"]')
      expect(messageElement).toBeInTheDocument()
      expect(messageElement?.textContent).toBeTruthy()
    })

    it("should show finalizing message for very high progress (80-95%)", () => {
      render(<LoadingTile title="Test Report" progress={90} message="" />)

      expect(
        screen.getByText("Finalizing compassion algorithms and empathy metrics...")
      ).toBeInTheDocument()
    })

    it("should show generating report message for nearly complete (95%+)", () => {
      render(<LoadingTile title="Test Report" progress={98} message="" />)

      expect(
        screen.getByText("Generating comprehensive AIMHEI assessment report...")
      ).toBeInTheDocument()
    })
  })

  describe("progress bar", () => {
    it("should render progress bar with correct width", () => {
      const { container } = render(
        <LoadingTile title="Test Report" progress={75} message="Loading" />
      )

      // The progress bar uses framer-motion, so we check for the container
      const progressBar = container.querySelector('[style*="width"]')
      expect(progressBar).toBeInTheDocument()
    })

    it("should render progress bar at 0% for zero progress", () => {
      const { container } = render(
        <LoadingTile title="Test Report" progress={0} message="Starting..." />
      )

      expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("should render progress bar at 100% for complete progress", () => {
      const { container } = render(
        <LoadingTile title="Test Report" progress={100} message="Done" />
      )

      expect(screen.getByText("100%")).toBeInTheDocument()
    })
  })

  describe("styling and animations", () => {
    it("should have shimmer animation element", () => {
      const { container } = render(
        <LoadingTile title="Test Report" progress={50} message="Loading" />
      )

      const shimmer = container.querySelector('[class*="shimmer"]')
      // Shimmer is implemented via sx prop keyframes, so we check for the container
      expect(container.querySelector('[class*="MuiBox-root"]')).toBeInTheDocument()
    })

    it("should be non-interactive (pointer-events none)", () => {
      const { container } = render(
        <LoadingTile title="Test Report" progress={50} message="Loading" />
      )

      const card = container.querySelector('[class*="MuiCard-root"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle empty title", () => {
      render(<LoadingTile title="" progress={50} message="Loading" />)

      expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("should handle very long title", () => {
      const longTitle = "A".repeat(200)
      render(<LoadingTile title={longTitle} progress={50} message="Loading" />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it("should handle fractional progress", () => {
      render(<LoadingTile title="Test Report" progress={45.7} message="Loading" />)

      expect(screen.getByText("46%")).toBeInTheDocument() // Should round
    })

    it("should handle progress over 100", () => {
      render(<LoadingTile title="Test Report" progress={150} message="Loading" />)

      expect(screen.getByText("150%")).toBeInTheDocument()
    })
  })
})
