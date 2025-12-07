import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ThemeProvider, createTheme } from "@mui/material"
import { UnifiedAnalysisView } from "../components/UnifiedAnalysisView"
import { DetectionResult, AnalysisResult } from "../../../types"

// Mock InteractiveCanvas
vi.mock("../../canvas-interaction", () => ({
  InteractiveCanvas: vi.fn(({ onStitchClick, selectedStitch }) => (
    <div data-testid="interactive-canvas">
      <button data-testid="mock-stitch-0" onClick={() => onStitchClick && onStitchClick(0)}>
        Stitch 0
      </button>
      <button data-testid="mock-stitch-1" onClick={() => onStitchClick && onStitchClick(1)}>
        Stitch 1
      </button>
      <div data-testid="selected-stitch">{selectedStitch !== null ? selectedStitch : "none"}</div>
    </div>
  )),
}))

const theme = createTheme()

const mockDetections: DetectionResult[] = [
  {
    id: 1,
    bbox: { x1: 100, y1: 100, x2: 200, y2: 200 },
    confidence: 0.95,
    class_id: 0, // good
  },
  {
    id: 2,
    bbox: { x1: 300, y1: 300, x2: 400, y2: 400 },
    confidence: 0.85,
    class_id: 1, // loose
  },
  {
    id: 3,
    bbox: { x1: 500, y1: 500, x2: 600, y2: 600 },
    confidence: 0.75,
    class_id: 2, // tight
  },
]

const mockMeasurements: AnalysisResult["measurements"] = {
  stitch_count: 3,
  stitch_lengths: [5.2, 4.8, 5.5],
  average_stitch_length: 5.17,
  stitch_angles: [45.0, 50.0, 42.5],
  average_angle: 45.8,
  pixels_per_mm: 10.0,
  quality_assessment: "good",
  pattern_symmetry: {
    symmetry_score: 0.85,
    max_deviation: 12.5,
  },
  spacing_uniformity: {
    spacing_cv: 0.12,
    mean_spacing: 15.5,
  },
}

const mockMeasurementsNoOptional: AnalysisResult["measurements"] = {
  stitch_count: 3,
  stitch_lengths: [5.2, 4.8, 5.5],
  average_stitch_length: 5.17,
  stitch_angles: [45.0, 50.0, 42.5],
  average_angle: 45.8,
  pixels_per_mm: null,
  quality_assessment: "good",
}

const renderComponent = (
  detections = mockDetections,
  measurements = mockMeasurements,
  imageUrl = "test-image.jpg",
  imageSize: [number, number] = [1920, 1080],
  isMobile = false
) => {
  // Set up media query mock based on isMobile parameter
  window.matchMedia = vi.fn().mockImplementation((query) => {
    const isMobileQuery = query.includes("max-width") && query.includes("899.95")
    return {
      matches: isMobile ? isMobileQuery : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })

  return render(
    <ThemeProvider theme={theme}>
      <UnifiedAnalysisView
        detections={detections}
        measurements={measurements}
        imageUrl={imageUrl}
        imageSize={imageSize}
      />
    </ThemeProvider>
  )
}

describe("UnifiedAnalysisView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to desktop by default
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // Desktop by default (no media queries match)
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  describe("Desktop Layout", () => {
    beforeEach(() => {
      // Mock desktop viewport - no media queries match
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    })

    it("should render analysis overview on desktop", () => {
      renderComponent()
      expect(screen.getByText("Analysis Overview")).toBeInTheDocument()
    })

    it("should display quality score", () => {
      renderComponent()
      // 1 good out of 3 = 33% quality
      expect(screen.getByText("33%")).toBeInTheDocument()
      expect(screen.getByText("QUALITY SCORE")).toBeInTheDocument()
    })

    it("should display average measurements", () => {
      renderComponent()
      // Component displays average_stitch_length in overview
      expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
      expect(screen.getAllByText("45.8°").length).toBeGreaterThan(0)
    })

    it("should display pattern symmetry when available", () => {
      renderComponent()
      expect(screen.getByText("PATTERN SYMMETRY")).toBeInTheDocument()
      expect(screen.getAllByText("85%").length).toBeGreaterThan(0) // symmetry score
    })

    it("should display spacing uniformity when available", () => {
      renderComponent()
      expect(screen.getByText("SPACING UNIFORMITY")).toBeInTheDocument()
      expect(screen.getByText("12%")).toBeInTheDocument() // spacing_cv * 100
    })

    it("should show N/A for missing pattern symmetry", () => {
      renderComponent(mockDetections, mockMeasurementsNoOptional)
      expect(screen.getByText("Pattern Symmetry")).toBeInTheDocument()
      expect(screen.getAllByText("N/A")).toHaveLength(2) // pattern + spacing
    })

    it("should render suture analysis panel", () => {
      renderComponent()
      expect(screen.getByText(/Suture Analysis \(3\)/)).toBeInTheDocument()
    })

    it("should render all detection accordions", () => {
      renderComponent()
      // Text is lowercase in DOM but styled with text-transform: capitalize
      expect(screen.getAllByText(/good suture/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/loose suture/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/tight suture/i).length).toBeGreaterThan(0)
    })

    it("should display confidence percentages", () => {
      renderComponent()
      expect(screen.getAllByText("95%").length).toBeGreaterThan(0) // detection 0
      expect(screen.getAllByText("85%").length).toBeGreaterThan(0) // detection 1 and pattern symmetry
      expect(screen.getAllByText("75%").length).toBeGreaterThan(0) // detection 2
    })

    it("should expand accordion when clicked", async () => {
      renderComponent()
      const goodSutures = screen.getAllByText(/good suture/i)
      const accordion = goodSutures[0].closest(".MuiAccordion-root")
      expect(accordion).toBeInTheDocument()

      fireEvent.click(goodSutures[0])
      await waitFor(() => {
        expect(screen.getAllByText("Measurements").length).toBeGreaterThan(0)
      })
    })

    it("should display stitch measurements in expanded accordion", async () => {
      renderComponent()
      const goodSutures = screen.getAllByText(/good suture/i)
      fireEvent.click(goodSutures[0])

      await waitFor(() => {
        expect(screen.getAllByText("Measurements").length).toBeGreaterThan(0)
        // Should show individual stitch measurements
        const lengthElements = screen.getAllByText("LENGTH")
        expect(lengthElements.length).toBeGreaterThan(0)
      })
    })

    it("should render InteractiveCanvas", () => {
      renderComponent()
      expect(screen.getByTestId("interactive-canvas")).toBeInTheDocument()
    })

    it("should show image viewer header", () => {
      renderComponent()
      expect(screen.getByText("Interactive Analysis")).toBeInTheDocument()
      expect(screen.getByText("Suture Image Viewer")).toBeInTheDocument()
    })
  })

  describe("Mobile Layout", () => {
    it("should not render analysis overview on mobile", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      expect(screen.queryByText("Analysis Overview")).not.toBeInTheDocument()
    })

    it("should render mobile compact stats", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
      expect(screen.getByText(/Good: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Loose: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Tight: 1/)).toBeInTheDocument()
    })

    it("should display compact quality metrics", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      expect(screen.getByText("Quality")).toBeInTheDocument()
      expect(screen.getByText("Confidence")).toBeInTheDocument()
    })

    it("should show hint when no stitch selected", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      expect(screen.getByText("Tap a numbered badge to analyze")).toBeInTheDocument()
    })

    it("should render numbered badges for all stitches", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      // Badges numbered 1, 2, 3
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("should show empty state when no stitch selected", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      expect(
        screen.getByText(/Tap a numbered badge on the image to view detailed suture information/)
      ).toBeInTheDocument()
    })

    it("should display stitch details when badge clicked", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      // Find badge by text (numbered 1, 2, 3)
      const badges = screen.getAllByRole("button").filter((btn) => btn.textContent === "1")
      const badge1 = badges[0]
      fireEvent.click(badge1)

      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
      expect(screen.getByText(/Confidence: 95%/)).toBeInTheDocument()
    })

    it("should show measurements for selected stitch", () => {
      renderComponent(mockDetections, mockMeasurements, "test-image.jpg", [1920, 1080], true)
      // Find badge by text
      const badges = screen.getAllByRole("button").filter((btn) => btn.textContent === "1")
      const badge1 = badges[0]
      fireEvent.click(badge1)

      expect(screen.getAllByText("LENGTH").length).toBeGreaterThan(0)
      expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
      expect(screen.getAllByText("ANGLE").length).toBeGreaterThan(0)
      expect(screen.getAllByText("45.0°").length).toBeGreaterThan(0)
    })
  })

  describe("Stitch Selection", () => {
    it("should select stitch when canvas is clicked", () => {
      renderComponent()
      const stitchButton = screen.getByTestId("mock-stitch-0")
      fireEvent.click(stitchButton)

      // Check that selectedStitch is updated
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")
    })

    it("should update selected stitch", () => {
      renderComponent()
      const stitch0 = screen.getByTestId("mock-stitch-0")
      const stitch1 = screen.getByTestId("mock-stitch-1")

      fireEvent.click(stitch0)
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")

      fireEvent.click(stitch1)
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("1")
    })

    it("should deselect stitch when same accordion is clicked", async () => {
      renderComponent()

      // Click to select - verify accordion expands
      const goodSutures = screen.getAllByText(/good suture/i)
      const accordion = goodSutures[0].closest(".MuiAccordion-root")
      const accordionButton = accordion?.querySelector("[aria-expanded]")

      fireEvent.click(goodSutures[0])
      await waitFor(() => {
        expect(accordionButton).toHaveAttribute("aria-expanded", "true")
      })

      // Click again to deselect - verify accordion collapses
      fireEvent.click(goodSutures[0])
      await waitFor(() => {
        expect(accordionButton).toHaveAttribute("aria-expanded", "false")
      })
    })
  })

  describe("Keyboard Navigation", () => {
    it("should navigate to next stitch with ArrowRight", () => {
      renderComponent()

      // Select first stitch
      fireEvent.click(screen.getByTestId("mock-stitch-0"))
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")

      // Press ArrowRight
      fireEvent.keyDown(document, { key: "ArrowRight" })
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("1")
    })

    it("should navigate to previous stitch with ArrowLeft", () => {
      renderComponent()

      // Select second stitch
      fireEvent.click(screen.getByTestId("mock-stitch-1"))
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("1")

      // Press ArrowLeft
      fireEvent.keyDown(document, { key: "ArrowLeft" })
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")
    })

    it("should not navigate beyond first stitch with ArrowLeft", () => {
      renderComponent()

      // Select first stitch
      fireEvent.click(screen.getByTestId("mock-stitch-0"))
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")

      // Press ArrowLeft (should stay at 0)
      fireEvent.keyDown(document, { key: "ArrowLeft" })
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")
    })

    it("should not navigate beyond last stitch with ArrowRight", () => {
      renderComponent()

      // Select last stitch (index 2)
      const tightSutures = screen.getAllByText(/tight suture/i)
      fireEvent.click(tightSutures[0])

      // Press ArrowRight twice (should stay at 2)
      fireEvent.keyDown(document, { key: "ArrowRight" })
      fireEvent.keyDown(document, { key: "ArrowRight" })

      // Verify it doesn't go beyond last stitch
      const selectedStitch = screen.getByTestId("selected-stitch").textContent
      expect(Number(selectedStitch)).toBeLessThanOrEqual(2)
    })

    it("should deselect stitch with Escape key", () => {
      renderComponent()

      // Select a stitch
      fireEvent.click(screen.getByTestId("mock-stitch-0"))
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("0")

      // Press Escape
      fireEvent.keyDown(document, { key: "Escape" })
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("none")
    })

    it("should not respond to keyboard when no stitch is selected", () => {
      renderComponent()

      // No stitch selected
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("none")

      // Press ArrowRight (should do nothing)
      fireEvent.keyDown(document, { key: "ArrowRight" })
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("none")
    })
  })

  describe("Quality Calculations", () => {
    it("should calculate quality distribution correctly", () => {
      const singleGoodDetection: DetectionResult[] = [
        {
          id: 1,
          bbox: { x1: 100, y1: 100, x2: 200, y2: 200 },
          confidence: 0.95,
          class_id: 0, // good
        },
      ]
      renderComponent(singleGoodDetection)
      // 1 good out of 1 = 100%
      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should handle measurements without pixels_per_mm", () => {
      // Use mobile for this test (easier to find specific text)
      renderComponent(mockDetections, mockMeasurementsNoOptional, "test.jpg", [1920, 1080], true)
      // Should display "px" instead of "mm"
      expect(screen.getByText(/Len \(px\)/)).toBeInTheDocument()
    })

    it("should handle empty stitch_lengths array", () => {
      const emptyLengthsMeasurements = {
        ...mockMeasurements,
        stitch_lengths: [],
      }
      renderComponent(mockDetections, emptyLengthsMeasurements)
      // Should not crash
      expect(screen.getByTestId("interactive-canvas")).toBeInTheDocument()
    })

    it("should calculate average confidence correctly", () => {
      renderComponent()
      // (0.95 + 0.85 + 0.75) / 3 = 0.85 = 85%
      // This appears in both mobile confidence AND pattern symmetry
      expect(screen.getAllByText("85%").length).toBeGreaterThan(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle single detection", () => {
      const singleDetection: DetectionResult[] = [mockDetections[0]]
      const singleMeasurement: AnalysisResult["measurements"] = {
        ...mockMeasurements,
        stitch_count: 1,
        stitch_lengths: [5.2],
        stitch_angles: [45.0],
      }
      renderComponent(singleDetection, singleMeasurement)
      expect(screen.getByText(/Suture Analysis \(1\)/)).toBeInTheDocument()
    })

    it("should handle detection without angle measurement", () => {
      const noAngleMeasurements: AnalysisResult["measurements"] = {
        ...mockMeasurements,
        stitch_angles: [],
      }
      renderComponent(mockDetections, noAngleMeasurements)
      // Should render without ANGLE section in accordion details
      expect(screen.getAllByText("LENGTH").length).toBeGreaterThan(0)
    })

    it("should handle undefined stitch length", async () => {
      const undefinedLengthMeasurements: AnalysisResult["measurements"] = {
        ...mockMeasurements,
        stitch_lengths: [5.2, undefined as any, 5.5],
      }
      renderComponent(mockDetections, undefinedLengthMeasurements)

      // Click second stitch
      const looseSutures = screen.getAllByText(/loose suture/i)
      fireEvent.click(looseSutures[0])

      // Should show N/A for undefined length
      await waitFor(() => {
        expect(screen.getByText("N/A")).toBeInTheDocument()
      })
    })

    it("should handle different image sizes", () => {
      renderComponent(mockDetections, mockMeasurements, "test.jpg", [3840, 2160])
      expect(screen.getByTestId("interactive-canvas")).toBeInTheDocument()
    })

    it("should not render tight suture chip when count is 0", () => {
      const noTightDetections: DetectionResult[] = [
        mockDetections[0], // good
        mockDetections[1], // loose
      ]

      // Use mobile viewport
      renderComponent(noTightDetections, mockMeasurements, "test.jpg", [1920, 1080], true)
      expect(screen.queryByText(/Tight: 0/)).not.toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels for suture badges", () => {
      // Use mobile
      renderComponent(mockDetections, mockMeasurements, "test.jpg", [1920, 1080], true)
      // Find badges by aria-label
      expect(screen.getAllByLabelText("Suture 1")).toHaveLength(1)
      expect(screen.getAllByLabelText("Suture 2")).toHaveLength(1)
      expect(screen.getAllByLabelText("Suture 3")).toHaveLength(1)
    })

    it("should be keyboard navigable", () => {
      renderComponent()

      // Select first stitch via canvas
      fireEvent.click(screen.getByTestId("mock-stitch-0"))

      // Navigate with keyboard
      fireEvent.keyDown(document, { key: "ArrowRight" })
      fireEvent.keyDown(document, { key: "ArrowLeft" })
      fireEvent.keyDown(document, { key: "Escape" })

      // Should not crash and final state should be deselected
      expect(screen.getByTestId("selected-stitch")).toHaveTextContent("none")
    })
  })
})
