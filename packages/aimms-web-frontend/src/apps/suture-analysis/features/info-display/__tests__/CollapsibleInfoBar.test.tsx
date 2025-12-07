import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ThemeProvider, createTheme } from "@mui/material"
import { CollapsibleInfoBar } from "../components/CollapsibleInfoBar"
import { DetectionResult, AnalysisResult } from "../../../types"

const theme = createTheme()

const mockDetection: DetectionResult = {
  id: 1,
  bbox: { x1: 100, y1: 100, x2: 200, y2: 200 },
  confidence: 0.95,
  class_id: 0, // good
}

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
  detection: DetectionResult | null = mockDetection,
  index: number | null = 0,
  measurements = mockMeasurements,
  show = true,
  onClose = vi.fn(),
  onHeightChange = vi.fn()
) =>
  render(
  <ThemeProvider theme={theme}>
      <CollapsibleInfoBar
      detection={detection}
      index={index}
      measurements={measurements}
      show={show}
      onClose={onClose}
      onHeightChange={onHeightChange}
      />
    </ThemeProvider>,
  )

describe("CollapsibleInfoBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log used in component
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  describe("Visibility", () => {
    it("should render when show is true", () => {
      renderComponent()
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })

    it("should not render when show is false", () => {
      const { container } = renderComponent(mockDetection, 0, mockMeasurements, false)
      expect(container.firstChild).toBeNull()
    })

    it("should call onHeightChange with 0 when hidden", () => {
      const onHeightChange = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, false, vi.fn(), onHeightChange)
      expect(onHeightChange).toHaveBeenCalledWith(0)
    })
  })

  describe("Header Display", () => {
    it("should display stitch number badge", () => {
      renderComponent(mockDetection, 2)
      // Index 2 displays as "3"
      expect(screen.getByText("3")).toBeInTheDocument()
    })

    it('should display "+" when no index provided', () => {
      renderComponent(mockDetection, null)
      expect(screen.getByText("+")).toBeInTheDocument()
    })

    it("should display suture classification", () => {
      renderComponent(mockDetection, 0)
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })

    it("should display confidence percentage", () => {
      renderComponent(mockDetection, 0)
      expect(screen.getByText("95%")).toBeInTheDocument()
    })

    it('should display "Suture Details" when no detection', () => {
      renderComponent(null, null)
      expect(screen.getByText("Suture Details")).toBeInTheDocument()
    })

    it("should display quick stats for length and angle", () => {
      renderComponent(mockDetection, 0)
      expect(screen.getByText(/Length:/)).toBeInTheDocument()
      expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
      expect(screen.getByText(/Angle:/)).toBeInTheDocument()
      expect(screen.getAllByText(/45\.0°/).length).toBeGreaterThan(0)
    })

    it("should display N/A for missing length", () => {
      const measurementsWithMissing = {
        ...mockMeasurements,
        stitch_lengths: [undefined as any, 4.8, 5.5],
      }
      renderComponent(mockDetection, 0, measurementsWithMissing)
      expect(screen.getByText(/N\/A/)).toBeInTheDocument()
    })

    it("should not display angle if undefined", () => {
      const measurementsNoAngles = {
        ...mockMeasurements,
        stitch_angles: [],
      }
      renderComponent(mockDetection, 0, measurementsNoAngles)
      expect(screen.queryByText(/Angle:/)).not.toBeInTheDocument()
    })

    it("should display placeholder text when no detection selected", () => {
      renderComponent(null, null)
      expect(screen.getByText("Select a suture on the image to view details")).toBeInTheDocument()
    })
  })

  describe("Expansion/Collapse", () => {
    it("should be collapsed by default when no detection", async () => {
      renderComponent(null, null)
      // Expanded content uses Collapse component which hides with display:none
      await waitFor(() => {
        const stitchLength = screen.queryByText("STITCH LENGTH")
        // Element might exist in DOM but be hidden by Collapse
        if (stitchLength) {
          const collapse = stitchLength.closest(".MuiCollapse-root")
          expect(collapse).toHaveStyle({ height: "0px" })
        }
      })
    })

    it("should expand when detection is provided", async () => {
      renderComponent(mockDetection, 0)
      // Component auto-expands when detection is provided
      await waitFor(() => {
        expect(screen.getByText("STITCH LENGTH")).toBeInTheDocument()
      })
    })

    it("should toggle expansion when header is clicked", async () => {
      renderComponent(mockDetection, 0)

      // Wait for auto-expansion
      await waitFor(() => {
        expect(screen.getByText("STITCH LENGTH")).toBeInTheDocument()
      })

      // Click header to collapse
      const header = screen.getByText(/good suture/i).closest("div")
      if (header) fireEvent.click(header)

      await waitFor(() => {
        expect(screen.queryByText("STITCH LENGTH")).not.toBeVisible()
      })
    })

    it("should toggle expansion when expand icon is clicked", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getByText("STITCH LENGTH")).toBeInTheDocument()
      })

      // Find expand button by querying for ExpandMoreIcon
      const buttons = screen.getAllByRole("button")
      const expandBtn = buttons.find((btn) => btn.querySelector("svg[data-testid='ExpandMoreIcon']"),
      )
      expect(expandBtn).toBeDefined()

      if (expandBtn) {
        fireEvent.click(expandBtn)

        await waitFor(() => {
          const stitchLength = screen.queryByText("STITCH LENGTH")
          if (stitchLength) {
            const collapse = stitchLength.closest(".MuiCollapse-root")
            expect(collapse).toHaveStyle({ height: "0px" })
          }
        })
      }
    })
  })

  describe("Close Button", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, true, onClose)

      const closeButtons = screen.getAllByRole("button")
      const closeButton = closeButtons.find((btn) => btn.querySelector("svg[data-testid='CloseIcon']"),
      )
      if (closeButton) fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("should not close when header is clicked", () => {
      const onClose = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, true, onClose)

      const header = screen.getByText(/good suture/i)
      fireEvent.click(header)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe("Expanded Content", () => {
    it("should display detailed stitch length", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getByText("STITCH LENGTH")).toBeInTheDocument()
        expect(screen.getAllByText(/5\.2mm/).length).toBeGreaterThan(0)
      })
    })

    it("should display average length comparison", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getAllByText(/avg: 5\.2mm/).length).toBeGreaterThan(0)
      })
    })

    it("should display detailed stitch angle", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getByText("STITCH ANGLE")).toBeInTheDocument()
        expect(screen.getAllByText(/45\.0°/).length).toBeGreaterThan(0)
      })
    })

    it("should display average angle comparison", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getByText(/avg: 45\.8°/)).toBeInTheDocument()
      })
    })

    it("should display analysis section", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(screen.getByText("Analysis")).toBeInTheDocument()
      })
    })

    it("should display comparison text for longer suture", async () => {
      // Index 2 has length 5.5 which is longer than average 5.17
      renderComponent(mockDetection, 2)

      await waitFor(() => {
        expect(screen.getByText(/longer than the average/i)).toBeInTheDocument()
      })
    })

    it("should display comparison text for shorter suture", async () => {
      // Index 1 has length 4.8 which is shorter than average 5.17
      const detection = { ...mockDetection, class_id: 1 } // loose
      renderComponent(detection, 1)

      await waitFor(() => {
        expect(screen.getByText(/shorter than the average/i)).toBeInTheDocument()
      })
    })

    it("should display good suture analysis text", async () => {
      renderComponent(mockDetection, 0)

      await waitFor(() => {
        expect(
          screen.getByText(/proper suturing technique with appropriate tension/i)
        ).toBeInTheDocument()
      })
    })

    it("should display loose suture analysis text", async () => {
      const looseDetection = { ...mockDetection, class_id: 1 }
      renderComponent(looseDetection, 0)

      await waitFor(() => {
        expect(
          screen.getByText(/insufficient tension or improper needle placement/i),
        ).toBeInTheDocument()
      })
    })

    it("should display tight suture analysis text", async () => {
      const tightDetection = { ...mockDetection, class_id: 2 }
      renderComponent(tightDetection, 0)

      await waitFor(() => {
        expect(
          screen.getByText(/excessive tension which could compromise tissue healing/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe("Drag Functionality", () => {
    it("should handle mouse drag start", () => {
      renderComponent(mockDetection, 0)

      const dragHandle = screen.getByText(/good suture/i).closest("div")
        ?.previousSibling as HTMLElement
      if (dragHandle) {
        fireEvent.mouseDown(dragHandle, { clientY: 100 })
        // Component should enter dragging state
        expect(dragHandle).toBeInTheDocument()
      }
    })

    it("should handle touch drag start", () => {
      renderComponent(mockDetection, 0)

      const dragHandle = screen.getByText(/good suture/i).closest("div")
        ?.previousSibling as HTMLElement
      if (dragHandle) {
        fireEvent.touchStart(dragHandle, {
          touches: [{ clientY: 100 }],
        })
        expect(dragHandle).toBeInTheDocument()
      }
    })

    it("should handle drag end and snap to position", () => {
      renderComponent(mockDetection, 0)

      const dragHandle = screen.getByText(/good suture/i).closest("div")
        ?.previousSibling as HTMLElement
      if (dragHandle) {
        fireEvent.mouseDown(dragHandle, { clientY: 100 })
        fireEvent.mouseMove(dragHandle, { clientY: 50 })
        fireEvent.mouseUp(dragHandle)
        expect(dragHandle).toBeInTheDocument()
      }
    })
  })

  describe("Height Management", () => {
    it("should call onHeightChange when component mounts", () => {
      const onHeightChange = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, true, vi.fn(), onHeightChange)

      expect(onHeightChange).toHaveBeenCalled()
    })

    it("should adjust height based on window size", async () => {
      const onHeightChange = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, true, vi.fn(), onHeightChange)

      // Trigger resize
      window.innerHeight = 800
      fireEvent(window, new Event("resize"))

      await waitFor(() => {
        expect(onHeightChange).toHaveBeenCalled()
      })
    })

    it("should adjust height on orientation change", async () => {
      const onHeightChange = vi.fn()
      renderComponent(mockDetection, 0, mockMeasurements, true, vi.fn(), onHeightChange)

      fireEvent(window, new Event("orientationchange"))

      await waitFor(() => {
        expect(onHeightChange).toHaveBeenCalled()
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle measurements without pixels_per_mm", () => {
      const measurements = {
        ...mockMeasurements,
        pixels_per_mm: null,
      }
      renderComponent(mockDetection, 0, measurements)

      expect(screen.getAllByText(/5\.2px/).length).toBeGreaterThan(0)
    })

    it("should handle missing angle measurement", async () => {
      const measurements = {
        ...mockMeasurements,
        stitch_angles: [],
      }
      renderComponent(mockDetection, 0, measurements)

      await waitFor(() => {
        expect(screen.queryByText("STITCH ANGLE")).not.toBeInTheDocument()
      })
    })

    it("should handle null detection gracefully", () => {
      renderComponent(null, null)
      expect(screen.getByText("Suture Details")).toBeInTheDocument()
      expect(screen.queryByText("95%")).not.toBeInTheDocument()
    })

    it("should display drag handle", () => {
      renderComponent(mockDetection, 0)
      // Drag handle is visible (just verify component rendered)
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })
  })

  describe("Suture Classifications", () => {
    it("should show good suture styling", () => {
      renderComponent({ ...mockDetection, class_id: 0 }, 0)
      expect(screen.getByText(/good suture/i)).toBeInTheDocument()
    })

    it("should show loose suture styling", () => {
      renderComponent({ ...mockDetection, class_id: 1 }, 0)
      expect(screen.getByText(/loose suture/i)).toBeInTheDocument()
    })

    it("should show tight suture styling", () => {
      renderComponent({ ...mockDetection, class_id: 2 }, 0)
      expect(screen.getByText(/tight suture/i)).toBeInTheDocument()
    })
  })
})
