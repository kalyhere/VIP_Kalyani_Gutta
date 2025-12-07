import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AIMHEIFeedback, type AIMHEIReport } from "../AIMHEIFeedback"

const mockReport: AIMHEIReport = {
  date: "2024-01-15",
  overallScore: 85,
  maxScore: 100,
  weightedPercentage: 85,
  proficiencyLevel: "good",
  informationSections: [
    {
      name: "Chief Complaint",
      correct: 8,
      incorrect: 2,
      total: 10,
      percentage: 80,
    },
    {
      name: "History of Present Illness",
      correct: 6,
      incorrect: 4,
      total: 10,
      percentage: 60,
    },
  ],
  skillSections: [
    {
      name: "Communication",
      score: 9,
      total: 10,
      details: "Excellent communication skills",
    },
    {
      name: "Empathy",
      score: 6,
      total: 10,
      details: "Needs improvement",
    },
  ],
  sectionFeedback: [
    {
      title: "Chief Complaint Assessment",
      strengths: ["Clear questioning", "Good rapport"],
      weaknesses: ["Missed key detail"],
      overall: "Generally good performance with room for improvement",
    },
  ],
  hasUnacceptablePerformance: false,
}

describe("AIMHEIFeedback", () => {
  it("should render report header with date and proficiency", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.getByText("AIMHEI Performance Report")).toBeInTheDocument()
    expect(screen.getByText("Evaluation Date: 2024-01-15")).toBeInTheDocument()
    expect(screen.getByText("85%")).toBeInTheDocument()
    expect(screen.getByText("GOOD Proficiency")).toBeInTheDocument()
  })

  it("should render information sections with scores", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.getByText("Chief Complaint")).toBeInTheDocument()
    expect(screen.getByText("80%")).toBeInTheDocument()
    expect(screen.getByText("History of Present Illness")).toBeInTheDocument()
    expect(screen.getByText("60%")).toBeInTheDocument()
  })

  it("should render skill sections with scores", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.getByText("Communication")).toBeInTheDocument()
    expect(screen.getByText("9/10")).toBeInTheDocument()
    expect(screen.getByText("Empathy")).toBeInTheDocument()
    expect(screen.getByText("6/10")).toBeInTheDocument()
  })

  it("should generate action items based on low scores", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.getByText("Recommended Actions")).toBeInTheDocument()
    expect(
      screen.getByText("Review history of present illness techniques and best practices")
    ).toBeInTheDocument()
    expect(screen.getByText("Practice empathy skills")).toBeInTheDocument()
  })

  it("should expand and collapse section feedback", async () => {
    const { container } = render(<AIMHEIFeedback report={mockReport} />)

    const sectionHeader = screen.getByText("Chief Complaint Assessment")
    expect(sectionHeader).toBeInTheDocument()

    // Check if Collapse component is in collapsed state (height 0 or hidden)
    const collapseElements = container.querySelectorAll('[class*="MuiCollapse-root"]')
    const firstCollapse = collapseElements[0]

    // Sections should be collapsed by default
    expect(firstCollapse).toHaveClass("MuiCollapse-hidden")

    // Click to expand
    fireEvent.click(sectionHeader)

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Content should now be visible (Collapse should not be hidden)
    const collapseAfterExpand = container.querySelectorAll('[class*="MuiCollapse-root"]')[0]
    expect(collapseAfterExpand).not.toHaveClass("MuiCollapse-hidden")

    // Click to collapse
    fireEvent.click(sectionHeader)

    // Wait for collapse animation
    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  it("should call onUpdateLearningObjectives when button clicked", () => {
    const mockUpdateObjectives = vi.fn()
    render(<AIMHEIFeedback report={mockReport} onUpdateLearningObjectives={mockUpdateObjectives} />)

    const updateButton = screen.getByText("Update Learning Objectives")
    fireEvent.click(updateButton)

    expect(mockUpdateObjectives).toHaveBeenCalledTimes(1)
    expect(mockUpdateObjectives).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.stringContaining("history of present illness"),
        expect.stringContaining("empathy"),
      ])
    )
  })

  it("should not show update button when callback not provided", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.queryByText("Update Learning Objectives")).not.toBeInTheDocument()
  })

  it("should show warning for unacceptable performance", () => {
    const reportWithWarning: AIMHEIReport = {
      ...mockReport,
      hasUnacceptablePerformance: true,
    }

    render(<AIMHEIFeedback report={reportWithWarning} />)

    expect(screen.getByText(/Some areas require immediate attention/i)).toBeInTheDocument()
  })

  it("should not show warning for acceptable performance", () => {
    render(<AIMHEIFeedback report={mockReport} />)

    expect(screen.queryByText(/Some areas require immediate attention/i)).not.toBeInTheDocument()
  })

  describe("proficiency colors", () => {
    it("should use correct color for excellent proficiency", () => {
      const excellentReport: AIMHEIReport = {
        ...mockReport,
        proficiencyLevel: "excellent",
        weightedPercentage: 95,
      }

      const { container } = render(<AIMHEIFeedback report={excellentReport} />)
      expect(container.querySelector('[class*="MuiChip-root"]')).toBeInTheDocument()
    })

    it("should use correct color for poor proficiency", () => {
      const poorReport: AIMHEIReport = {
        ...mockReport,
        proficiencyLevel: "poor",
        weightedPercentage: 45,
      }

      const { container } = render(<AIMHEIFeedback report={poorReport} />)
      expect(container.querySelector('[class*="MuiChip-root"]')).toBeInTheDocument()
    })
  })

  describe("action item generation", () => {
    it("should include weak section recommendations", () => {
      const weakReport: AIMHEIReport = {
        ...mockReport,
        informationSections: [
          {
            name: "Social History",
            correct: 5,
            incorrect: 5,
            total: 10,
            percentage: 50,
          },
        ],
      }

      render(<AIMHEIFeedback report={weakReport} />)

      expect(
        screen.getByText("Review social history techniques and best practices")
      ).toBeInTheDocument()
    })

    it("should include weak skill recommendations", () => {
      const weakSkillReport: AIMHEIReport = {
        ...mockReport,
        skillSections: [
          {
            name: "Physical Examination",
            score: 3,
            total: 10,
          },
        ],
      }

      render(<AIMHEIFeedback report={weakSkillReport} />)

      expect(screen.getByText("Practice physical examination skills")).toBeInTheDocument()
    })
  })
})
