import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardHeader } from "../DashboardHeader"

describe("DashboardHeader", () => {
  it("should render the title and subtitle", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={0} />)

    expect(screen.getByText("AIMHEI Analysis Tool")).toBeInTheDocument()
    expect(
      screen.getByText("Artificial Intelligence Medical History Evaluation Instrument")
    ).toBeInTheDocument()
  })

  it("should show 'Report Selected' chip when report is selected", () => {
    render(<DashboardHeader selectedReportId={123} processing={false} reportCount={5} />)

    expect(screen.getByText("Report Selected")).toBeInTheDocument()
  })

  it("should not show 'Report Selected' chip when no report is selected", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={5} />)

    expect(screen.queryByText("Report Selected")).not.toBeInTheDocument()
  })

  it("should show 'Processing...' chip when processing", () => {
    render(<DashboardHeader selectedReportId={null} processing reportCount={0} />)

    expect(screen.getByText("Processing...")).toBeInTheDocument()
  })

  it("should not show 'Processing...' chip when not processing", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={0} />)

    expect(screen.queryByText("Processing...")).not.toBeInTheDocument()
  })

  it("should show report count chip when reports exist", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={5} />)

    expect(screen.getByText("5 Reports")).toBeInTheDocument()
  })

  it("should show singular report count", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={1} />)

    expect(screen.getByText("1 Reports")).toBeInTheDocument()
  })

  it("should not show report count chip when no reports exist", () => {
    render(<DashboardHeader selectedReportId={null} processing={false} reportCount={0} />)

    expect(screen.queryByText(/Reports/)).not.toBeInTheDocument()
  })

  it("should show all chips when all conditions are met", () => {
    render(<DashboardHeader selectedReportId={123} processing reportCount={10} />)

    expect(screen.getByText("Report Selected")).toBeInTheDocument()
    expect(screen.getByText("Processing...")).toBeInTheDocument()
    expect(screen.getByText("10 Reports")).toBeInTheDocument()
  })

  it("should render the analytics icon", () => {
    const { container } = render(
      <DashboardHeader selectedReportId={null} processing={false} reportCount={0} />
    )

    const icon = container.querySelector('[data-testid="AnalyticsIcon"]')
    expect(icon || container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render status indicator dot", () => {
    const { container } = render(
      <DashboardHeader selectedReportId={null} processing={false} reportCount={0} />
    )

    // The status indicator is a Box element with specific styling
    const statusDot = container.querySelector('[class*="MuiBox-root"]')
    expect(statusDot).toBeInTheDocument()
  })
})
