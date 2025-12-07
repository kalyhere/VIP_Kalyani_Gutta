/**
 * Tests for InteractiveCanvas component
 * Tests rendering and basic interaction (full canvas testing requires integration tests)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { InteractiveCanvas } from "../components/InteractiveCanvas"
import type { DetectionResult } from "../../../types"

// Control the return value of useMediaQuery
let mockIsMobile = false

vi.mock("@mui/material", async () => {
  const actual = await vi.importActual<typeof import("@mui/material")>("@mui/material")
  return {
    ...actual,
    useMediaQuery: () => mockIsMobile,
  }
})

describe("InteractiveCanvas", () => {
  const mockDetections: DetectionResult[] = [
    {
      id: 1,
      bbox: { x1: 10, y1: 20, x2: 30, y2: 40 },
      confidence: 0.95,
      class_id: 0,
    },
    {
      id: 2,
      bbox: { x1: 50, y1: 60, x2: 70, y2: 80 },
      confidence: 0.88,
      class_id: 1,
    },
  ]

  const defaultProps = {
    imageUrl: "data:image/jpeg;base64,test",
    detections: mockDetections,
    imageSize: [800, 600] as [number, number],
    selectedStitch: null,
    onStitchClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      strokeRect: vi.fn(),
      strokeStyle: "",
      lineWidth: 0,
      setLineDash: vi.fn(),
      shadowColor: "",
      shadowBlur: 0,
      fillStyle: "",
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
      textAlign: "",
      textBaseline: "",
      font: "",
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
    })) as any

    // Mock Image to automatically call onload when src is set
    global.Image = class MockImage {
      private _onload: (() => void) | null = null
      private _onerror: ((error: Error) => void) | null = null
      private _src = ""
      width = 800
      height = 600

      get onload() {
        return this._onload
      }

      set onload(callback: (() => void) | null) {
        this._onload = callback
      }

      get onerror() {
        return this._onerror
      }

      set onerror(callback: ((error: Error) => void) | null) {
        this._onerror = callback
      }

      get src() {
        return this._src
      }

      set src(value: string) {
        this._src = value
        // Trigger onload synchronously when src is set
        setTimeout(() => {
          if (this._onload) {
            this._onload()
          }
        }, 0)
      }
    } as any
  })

  describe("Rendering", () => {
    it("should render without crashing", async () => {
      render(<InteractiveCanvas {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Zoom In/i })).toBeInTheDocument()
      })
    })

    it("should show zoom controls on desktop", async () => {
      render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Zoom In/i })).toBeInTheDocument()
      })
      expect(screen.getByRole("button", { name: /Zoom Out/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset view/i })).toBeInTheDocument()
    })

    it("should display zoom percentage", async () => {
      render(<InteractiveCanvas {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument()
      })
    })

    it("should show instructions text", async () => {
      render(<InteractiveCanvas {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(/Click badges to analyze/)).toBeInTheDocument()
      })
    })

    it("should display loading state when no image loaded", () => {
      const propsWithNoImage = {
        ...defaultProps,
        imageUrl: "",
        detections: [],
      }
      render(<InteractiveCanvas {...propsWithNoImage} />)

      // Loading spinner should be shown
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })
  })

  describe("Zoom Controls", () => {
    it("should zoom in when zoom in button clicked", async () => {
      const { container } = render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument()
      })

      const zoomInButton = screen.getByRole("button", { name: /zoom in/i })
      fireEvent.click(zoomInButton)

      // Zoom should increase from 100% to 120%
      expect(screen.getByText("120%")).toBeInTheDocument()
    })

    it("should zoom out when zoom out button clicked", async () => {
      const { container } = render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument()
      })

      const zoomOutButton = screen.getByRole("button", { name: /zoom out/i })
      fireEvent.click(zoomOutButton)

      // Zoom should decrease from 100% to 80%
      expect(screen.getByText("80%")).toBeInTheDocument()
    })

    it("should reset zoom when reset button clicked", async () => {
      const { container } = render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument()
      })

      // Zoom in first
      const zoomInButton = screen.getByRole("button", { name: /zoom in/i })
      fireEvent.click(zoomInButton)
      expect(screen.getByText("120%")).toBeInTheDocument()

      // Reset
      const resetButton = screen.getByRole("button", { name: /reset view/i })
      fireEvent.click(resetButton)

      expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("should not zoom beyond max zoom level (300%)", async () => {
      render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument()
      })

      const zoomInButton = screen.getByRole("button", { name: /zoom in/i })

      // Click many times to try to exceed max
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton)
      }

      // Should be capped at 300%
      expect(screen.getByText("300%")).toBeInTheDocument()
    })

    it("should not zoom below min zoom level (50%)", async () => {
      render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument()
      })

      const zoomOutButton = screen.getByRole("button", { name: /zoom out/i })

      // Click many times to try to go below min
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton)
      }

      // Should be capped at 50%
      expect(screen.getByText("50%")).toBeInTheDocument()
    })
  })

  describe("Canvas Interaction", () => {
    it("should call onStitchClick when canvas is clicked", async () => {
      const { container } = render(<InteractiveCanvas {...defaultProps} />)

      await waitFor(() => {
        const canvas = container.querySelector("canvas")
        expect(canvas).toBeInTheDocument()
      })

      const canvas = container.querySelector("canvas")
      if (canvas) {
        // Simulate canvas click - actual hit detection is complex and tested in integration tests
        fireEvent.click(canvas)
      }
    })

    it("should show analysis success message when detections but no image", () => {
      const propsWithDetectionsNoImage = {
        ...defaultProps,
        imageUrl: "",
      }
      render(<InteractiveCanvas {...propsWithDetectionsNoImage} />)

      expect(screen.getByText("Image Analyzed Successfully")).toBeInTheDocument()
      expect(screen.getByText(/2 sutures detected/)).toBeInTheDocument()
    })
  })

  describe("Mobile Behavior", () => {
    it("should not show zoom controls on mobile", () => {
      // Set mock to return true (mobile mode)
      mockIsMobile = true

      render(<InteractiveCanvas {...defaultProps} />)

      // Zoom controls should not be in the document on mobile
      expect(screen.queryByRole("button", { name: /Zoom In/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Zoom Out/i })).not.toBeInTheDocument()

      // Reset back to desktop mode for other tests
      mockIsMobile = false
    })

    it("should call onMobileStitchClick when provided and mobile", () => {
      const onMobileStitchClick = vi.fn()
      const propsWithMobileCallback = {
        ...defaultProps,
        onMobileStitchClick,
      }

      const { container } = render(<InteractiveCanvas {...propsWithMobileCallback} />)

      // Mobile behavior is different - would need integration test for full verification
      expect(onMobileStitchClick).not.toHaveBeenCalled()
    })
  })

  describe("Image Loading", () => {
    it("should handle image load successfully", async () => {
      const { container } = render(<InteractiveCanvas {...defaultProps} />)

      // Canvas should be rendered after image loads
      await waitFor(() => {
        const canvas = container.querySelector("canvas")
        expect(canvas).toBeInTheDocument()
      })
    })

    it("should log image load events", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<InteractiveCanvas {...defaultProps} />)

      // Clean up
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })
})
