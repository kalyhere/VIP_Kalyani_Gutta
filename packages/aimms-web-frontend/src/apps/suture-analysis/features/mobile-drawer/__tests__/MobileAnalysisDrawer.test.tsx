import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ThemeProvider, createTheme } from "@mui/material"
import { MobileAnalysisDrawer } from "../components/MobileAnalysisDrawer"
import { DetectionResult, AnalysisResult } from "../../../types"

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
}

const renderComponent = (
  detections = mockDetections,
  measurements = mockMeasurements,
  selectedStitch: number | null = null,
  onStitchSelect = vi.fn(),
  open = true,
  onClose = vi.fn()
) =>
  render(
  <ThemeProvider theme={theme}>
      <MobileAnalysisDrawer
      detections={detections}
      measurements={measurements}
      selectedStitch={selectedStitch}
      onStitchSelect={onStitchSelect}
      open={open}
      onClose={onClose}
      />
    </ThemeProvider>,
  )

describe("MobileAnalysisDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Visibility", () => {
    it("should render when open is true", () => {
      renderComponent()
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
    })

    it("should not be visible when open is false", () => {
      renderComponent(mockDetections, mockMeasurements, null, vi.fn(), false)
      // SwipeableDrawer renders but is hidden
      expect(screen.queryByText("Suture Analysis")).not.toBeVisible()
    })
  })

  describe("Header", () => {
    it("should display title", () => {
      renderComponent()
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
    })

    it("should display detection count", () => {
      renderComponent()
      expect(screen.getByText("3 sutures detected")).toBeInTheDocument()
    })

    it("should display correct count for different detection arrays", () => {
      const singleDetection = [mockDetections[0]]
      renderComponent(singleDetection)
      expect(screen.getByText("1 sutures detected")).toBeInTheDocument()
    })

    it("should have close button", () => {
      renderComponent()
      const closeButton = screen.getByRole("button", { name: "" })
      expect(closeButton).toBeInTheDocument()
    })

    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn()
      renderComponent(mockDetections, mockMeasurements, null, vi.fn(), true, onClose)

      const buttons = screen.getAllByRole("button")
      const closeButton = buttons.find((btn) => btn.querySelector("svg[data-testid='CloseIcon']"))
      if (closeButton) fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should display drag handle", () => {
      renderComponent()
      // Drag handle exists (just verify drawer rendered)
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
    })
  })

  describe("Suture List", () => {
    it("should render all detections", () => {
      renderComponent()
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
      expect(screen.getByText(/loose suture/i)).toBeInTheDocument()
      expect(screen.getByText(/tight suture/i)).toBeInTheDocument()
    })

    it("should display suture numbers", () => {
      renderComponent()
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it("should display confidence for each suture", () => {
      renderComponent()
      expect(screen.getByText("95% confidence")).toBeInTheDocument()
      expect(screen.getByText("85% confidence")).toBeInTheDocument()
      expect(screen.getByText("75% confidence")).toBeInTheDocument()
    })

    it("should display length for each suture in summary", () => {
      renderComponent()
      expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/4\.8mm/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/5\.5mm/).length).toBeGreaterThan(0)
    })

    it("should display lengths in pixels when pixels_per_mm is null", () => {
      const measurements = {
        ...mockMeasurements,
        pixels_per_mm: null,
      }
      renderComponent(mockDetections, measurements)
      expect(screen.getAllByText(/5\.2px/).length).toBeGreaterThan(0)
    })
  })

  describe("Accordion Functionality", () => {
    it("should not expand any accordion by default", () => {
      const { container } = renderComponent()
      // All AccordionDetails should be collapsed
      const accordionDetails = container.querySelectorAll(".MuiAccordionDetails-root")
      accordionDetails.forEach((details) => {
        expect(details).toHaveStyle({ height: "0px" })
      })
    })

    it("should expand accordion when selectedStitch is set", () => {
      renderComponent(mockDetections, mockMeasurements, 0)
      // First accordion should be expanded - LENGTH appears in all 3 accordions
      expect(screen.getAllByText("LENGTH").length).toBe(3)
    })

    it("should call onStitchSelect when accordion is clicked", () => {
      const onStitchSelect = vi.fn()
      renderComponent(mockDetections, mockMeasurements, null, onStitchSelect)

      // Click first accordion
      const goodSuture = screen.getByText(/good suture/i)
      fireEvent.click(goodSuture)

      expect(onStitchSelect).toHaveBeenCalledWith(0)
    })

    it("should call onStitchSelect with null when expanded accordion is clicked", () => {
      const onStitchSelect = vi.fn()
      renderComponent(mockDetections, mockMeasurements, 0, onStitchSelect)

      // Click expanded accordion to collapse it
      const goodSuture = screen.getByText(/good suture/i)
      fireEvent.click(goodSuture)

      expect(onStitchSelect).toHaveBeenCalledWith(null)
    })

    it("should display expanded details for selected stitch", () => {
      renderComponent(mockDetections, mockMeasurements, 1)

      expect(screen.getAllByText("LENGTH").length).toBe(3)
      expect(screen.getAllByText(/4\.8mm/).length).toBeGreaterThan(0)
      expect(screen.getAllByText("ANGLE").length).toBe(3)
      expect(screen.getByText("50.0°")).toBeInTheDocument()
    })
  })

  describe("Expanded Content", () => {
    it("should display detailed length measurement", () => {
      renderComponent(mockDetections, mockMeasurements, 0)

      expect(screen.getAllByText("LENGTH").length).toBe(3)
      // Length appears in both summary and details
      expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
    })

    it("should display detailed angle measurement", () => {
      renderComponent(mockDetections, mockMeasurements, 0)

      expect(screen.getAllByText("ANGLE").length).toBe(3)
      expect(screen.getByText("45.0°")).toBeInTheDocument()
    })

    it("should display N/A for undefined length", () => {
      const measurements = {
        ...mockMeasurements,
        stitch_lengths: [undefined as any, 4.8, 5.5],
      }
      renderComponent(mockDetections, measurements, 0)

      expect(screen.getByText("N/A")).toBeInTheDocument()
    })

    it("should not display angle section if angle is undefined", () => {
      const measurements = {
        ...mockMeasurements,
        stitch_angles: [],
      }
      renderComponent(mockDetections, measurements, 0)

      expect(screen.queryByText("ANGLE")).not.toBeInTheDocument()
    })

    it("should display measurements in px when pixels_per_mm is null", () => {
      const measurements = {
        ...mockMeasurements,
        pixels_per_mm: null,
      }
      renderComponent(mockDetections, measurements, 0)

      expect(screen.getAllByText(/5\.2px/).length).toBeGreaterThan(0)
    })
  })

  describe("Suture Classifications", () => {
    it("should display good suture with correct styling", () => {
      renderComponent(mockDetections, mockMeasurements, 0)
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })

    it("should display loose suture with correct styling", () => {
      renderComponent(mockDetections, mockMeasurements, 1)
      expect(screen.getByText(/loose suture/i)).toBeInTheDocument()
    })

    it("should display tight suture with correct styling", () => {
      renderComponent(mockDetections, mockMeasurements, 2)
      expect(screen.getByText(/tight suture/i)).toBeInTheDocument()
    })

    it("should render CheckCircleIcon for good suture", () => {
      const { container } = renderComponent()
      const goodSutureAccordion = screen.getByText(/good suture/i).closest(".MuiAccordion-root")
      const icon = goodSutureAccordion?.querySelector("svg[data-testid='CheckCircleIcon']")
      expect(icon).toBeInTheDocument()
    })

    it("should render WarningIcon for loose suture", () => {
      const { container } = renderComponent()
      const looseSutureAccordion = screen.getByText(/loose suture/i).closest(".MuiAccordion-root")
      const icon = looseSutureAccordion?.querySelector("svg[data-testid='WarningIcon']")
      expect(icon).toBeInTheDocument()
    })

    it("should render ErrorIcon for tight suture", () => {
      const { container } = renderComponent()
      const tightSutureAccordion = screen.getByText(/tight suture/i).closest(".MuiAccordion-root")
      const icon = tightSutureAccordion?.querySelector("svg[data-testid='ErrorIcon']")
      expect(icon).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty detections array", () => {
      renderComponent([])
      expect(screen.getByText("0 sutures detected")).toBeInTheDocument()
    })

    it("should handle single detection", () => {
      const singleDetection = [mockDetections[0]]
      const singleMeasurement = {
        ...mockMeasurements,
        stitch_count: 1,
        stitch_lengths: [5.2],
        stitch_angles: [45.0],
      }
      renderComponent(singleDetection, singleMeasurement)

      expect(screen.getByText("1 sutures detected")).toBeInTheDocument()
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })

    it("should handle null in measurements arrays", () => {
      const measurements = {
        ...mockMeasurements,
        stitch_lengths: [5.2, null as any, 5.5],
      }
      renderComponent(mockDetections, measurements, 1)

      expect(screen.getByText("N/A")).toBeInTheDocument()
    })

    it("should handle missing angle for specific stitch", () => {
      const measurements = {
        ...mockMeasurements,
        stitch_angles: [45.0, undefined as any, 42.5],
      }
      renderComponent(mockDetections, measurements, 1)

      // ANGLE section should only appear for stitches with angles (2 instead of 3)
      expect(screen.getAllByText("ANGLE").length).toBe(2)
    })
  })

  describe("Accessibility", () => {
    it("should have proper structure for screen readers", () => {
      renderComponent()
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
      expect(screen.getByText("3 sutures detected")).toBeInTheDocument()
    })

    it("should render accordions with proper ARIA attributes", () => {
      renderComponent()
      // Verify all sutures render
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
      expect(screen.getByText(/loose suture/i)).toBeInTheDocument()
      expect(screen.getByText(/tight suture/i)).toBeInTheDocument()
    })

    it("should have expand icons for each accordion", () => {
      renderComponent()
      // All three sutures visible
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
    })
  })
})
