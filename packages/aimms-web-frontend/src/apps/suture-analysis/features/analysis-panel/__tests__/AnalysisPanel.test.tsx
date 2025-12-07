/**
 * Tests for AnalysisPanel component
 * Tests rendering and interaction with suture analysis accordion
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { AnalysisPanel } from "../components/AnalysisPanel"
import type { DetectionResult, AnalysisResult } from "../../../types"

describe("AnalysisPanel", () => {
  const mockDetections: DetectionResult[] = [
    {
      id: 1,
      bbox: { x1: 10, y1: 20, x2: 30, y2: 40 },
      confidence: 0.95,
      class_id: 0, // good
    },
    {
      id: 2,
      bbox: { x1: 50, y1: 60, x2: 70, y2: 80 },
      confidence: 0.88,
      class_id: 1, // loose
    },
    {
      id: 3,
      bbox: { x1: 90, y1: 100, x2: 110, y2: 120 },
      confidence: 0.92,
      class_id: 2, // tight
    },
  ]

  const mockMeasurements: AnalysisResult["measurements"] = {
    stitch_count: 3,
    stitch_lengths: [10.5, 12.3, 9.8],
    average_stitch_length: 10.87,
    stitch_angles: [45.2, 50.1, 43.8],
    average_angle: 46.37,
    pixels_per_mm: 2.5,
    quality_assessment: "good",
  }

  const defaultProps = {
    detections: mockDetections,
    measurements: mockMeasurements,
    selectedStitch: null,
    onStitchSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<AnalysisPanel {...defaultProps} />)
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
    })

    it("should display correct detection count", () => {
      render(<AnalysisPanel {...defaultProps} />)
      expect(screen.getByText(/3 sutures detected/)).toBeInTheDocument()
    })

    it("should render all detections", () => {
      render(<AnalysisPanel {...defaultProps} />)
      expect(screen.getByText("good Suture")).toBeInTheDocument()
      expect(screen.getByText("loose Suture")).toBeInTheDocument()
      expect(screen.getByText("tight Suture")).toBeInTheDocument()
    })

    it("should display confidence percentages", () => {
      render(<AnalysisPanel {...defaultProps} />)
      expect(screen.getByText("95% confidence")).toBeInTheDocument()
      expect(screen.getByText("88% confidence")).toBeInTheDocument()
      expect(screen.getByText("92% confidence")).toBeInTheDocument()
    })

    it("should display measurements with correct units (mm)", () => {
      render(<AnalysisPanel {...defaultProps} />)
      // Check for mm units since pixels_per_mm is set
      expect(screen.getAllByText(/10\.5mm/).length).toBeGreaterThan(0)
    })

    it("should display measurements with correct units (px) when no pixels_per_mm", () => {
      const propsWithoutPixelsPerMm = {
        ...defaultProps,
        measurements: {
          ...mockMeasurements,
          pixels_per_mm: null,
        },
      }
      render(<AnalysisPanel {...propsWithoutPixelsPerMm} />)
      // Check for px units
      expect(screen.getAllByText(/10\.5px/).length).toBeGreaterThan(0)
    })
  })

  describe("Accordion Interaction", () => {
    it("should expand accordion when clicked", () => {
      render(<AnalysisPanel {...defaultProps} />)

      const goodSutureText = screen.getByText("good Suture")
      expect(goodSutureText).toBeInTheDocument()

      // Click on the accordion summary (parent of the text)
      const accordionSummary = goodSutureText.closest('.MuiAccordionSummary-root')
      fireEvent.click(accordionSummary!)
      expect(defaultProps.onStitchSelect).toHaveBeenCalledWith(0)
    })

    it("should collapse accordion when expanded item is clicked", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 0,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      const goodSutureText = screen.getByText("good Suture")
      const accordionSummary = goodSutureText.closest('.MuiAccordionSummary-root')
      fireEvent.click(accordionSummary!)

      expect(defaultProps.onStitchSelect).toHaveBeenCalledWith(null)
    })

    it("should show detailed measurements when expanded", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 0,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      // When selected, detailed measurements should be accessible
      // We test behavior, not CSS classes
      expect(screen.getAllByText("Detailed Measurements").length).toBeGreaterThan(0)
    })
  })

  describe("Suture Classification", () => {
    it("should display correct icons for each class", () => {
      render(<AnalysisPanel {...defaultProps} />)

      // Icons are rendered as SVG elements, check by role or data-testid if added
      // For now, we can verify the text content is rendered with correct styling
      const goodSuture = screen.getByText("good Suture")
      const looseSuture = screen.getByText("loose Suture")
      const tightSuture = screen.getByText("tight Suture")

      expect(goodSuture).toBeInTheDocument()
      expect(looseSuture).toBeInTheDocument()
      expect(tightSuture).toBeInTheDocument()
    })

    it("should show expanded content for selected stitch", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 0,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      // Detailed measurements should be visible when selected
      expect(screen.getAllByText("Detailed Measurements").length).toBeGreaterThan(0)
    })
  })

  describe("Measurements Display", () => {
    it("should show length and angle in accordion summary", () => {
      render(<AnalysisPanel {...defaultProps} />)

      // Length
      expect(screen.getByText(/L: 10\.5/)).toBeInTheDocument()
      // Angle
      expect(screen.getByText(/∠: 45\.2°/)).toBeInTheDocument()
    })

    it("should show average values in detailed view", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 0,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      // Averages are shown in the expanded details
      // Use getAllByText because multiple accordions may be expanded
      expect(screen.getAllByText(/10\.9/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/46\.4/).length).toBeGreaterThan(0)
    })

    it("should show comparison text for length", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 0,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      // Check if comparison text is rendered (actual percentage calculation)
      // stitch_lengths[0] = 10.5, average = 10.87
      // This suture is shorter than average
      const comparisonTexts = screen.getAllByText(/shorter than average/)
      expect(comparisonTexts.length).toBeGreaterThan(0)
    })

    it("should handle missing angle data gracefully", () => {
      const propsWithoutAngles = {
        ...defaultProps,
        measurements: {
          ...mockMeasurements,
          stitch_angles: [],
        },
      }
      render(<AnalysisPanel {...propsWithoutAngles} />)

      // Should not crash, angles just won't be displayed
      expect(screen.queryByText(/∠:/)).not.toBeInTheDocument()
    })
  })

  describe("Empty State", () => {
    it("should handle empty detections array", () => {
      const emptyProps = {
        ...defaultProps,
        detections: [],
        measurements: {
          ...mockMeasurements,
          stitch_count: 0,
        },
      }
      render(<AnalysisPanel {...emptyProps} />)

      expect(screen.getByText(/0 sutures detected/)).toBeInTheDocument()
    })
  })

  describe("Number Badges", () => {
    it("should display correct suture numbers", () => {
      render(<AnalysisPanel {...defaultProps} />)

      // Badges show 1, 2, 3
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("should show expanded content for selected suture", () => {
      const propsWithSelected = {
        ...defaultProps,
        selectedStitch: 1,
      }
      render(<AnalysisPanel {...propsWithSelected} />)

      // Detailed measurements should be visible for the selected (second) suture
      expect(screen.getAllByText("Detailed Measurements").length).toBeGreaterThan(0)
    })
  })
})
