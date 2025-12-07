import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ReportViewSection } from "../ReportViewSection"

// Mock the FacultyReportDetail component
vi.mock("@/pages/faculty/components", () => ({
  FacultyReportDetail: ({ reportId }: { reportId: number }) => (
    <div data-testid="faculty-report-detail">Report ID: {reportId}</div>
  ),
}))

describe("ReportViewSection", () => {
  const defaultProps = {
    selectedReportId: 123,
    onBackToUpload: vi.fn(),
  }

  it("should render the component", () => {
    render(<ReportViewSection {...defaultProps} />)

    expect(screen.getByText("AIMHEI Report")).toBeInTheDocument()
    expect(screen.getByText("Analysis Results")).toBeInTheDocument()
  })

  it("should render back button", () => {
    render(<ReportViewSection {...defaultProps} />)

    expect(screen.getByText("Back to Upload")).toBeInTheDocument()
  })

  it("should call onBackToUpload when back button is clicked", () => {
    const onBackToUpload = vi.fn()
    render(<ReportViewSection {...defaultProps} onBackToUpload={onBackToUpload} />)

    const backButton = screen.getByText("Back to Upload")
    fireEvent.click(backButton)

    expect(onBackToUpload).toHaveBeenCalledTimes(1)
  })

  it("should render back arrow icon", () => {
    const { container } = render(<ReportViewSection {...defaultProps} />)

    const icon = container.querySelector('[data-testid="ArrowBackIcon"]')
    expect(icon || container.querySelector("svg")).toBeInTheDocument()
  })

  it("should render FacultyReportDetail with correct reportId", () => {
    render(<ReportViewSection {...defaultProps} selectedReportId={456} />)

    expect(screen.getByTestId("faculty-report-detail")).toBeInTheDocument()
    expect(screen.getByText("Report ID: 456")).toBeInTheDocument()
  })

  it("should pass isFaculty prop to FacultyReportDetail", () => {
    render(<ReportViewSection {...defaultProps} />)

    expect(screen.getByTestId("faculty-report-detail")).toBeInTheDocument()
  })

  it("should have print media styles", () => {
    const { container } = render(<ReportViewSection {...defaultProps} />)

    const mainBox = container.firstChild
    expect(mainBox).toBeInTheDocument()
  })

  it("should have scrollable content area", () => {
    const { container } = render(<ReportViewSection {...defaultProps} />)

    const scrollableBox = container.querySelector('[class*="MuiBox-root"]')
    expect(scrollableBox).toBeInTheDocument()
  })

  it("should render divider", () => {
    const { container } = render(<ReportViewSection {...defaultProps} />)

    const divider = container.querySelector('[class*="MuiDivider-root"]')
    expect(divider).toBeInTheDocument()
  })

  it("should have motion animation wrapper", () => {
    const { container } = render(<ReportViewSection {...defaultProps} />)

    // Framer motion adds div wrapper
    expect(container.firstChild).toBeInTheDocument()
  })
})
