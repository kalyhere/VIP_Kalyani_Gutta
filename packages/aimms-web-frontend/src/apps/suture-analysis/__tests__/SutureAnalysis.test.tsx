import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { ThemeProvider, createTheme } from "@mui/material"
import axios from "axios"
import SutureAnalysis from "../SutureAnalysis"
import { useSutureAnalysisStore } from "../stores/sutureAnalysisStore"
import { AnalysisResult } from "../types"

const theme = createTheme()

// Helper function to create properly typed mock analysis results
const createMockAnalysisResult = (detectionCount: number = 1): AnalysisResult => ({
  success: true,
  processed_by: "test-processor",
  image_info: {
    filename: "test.jpg",
    size: [1920, 1080],
  },
  detections: Array.from({ length: detectionCount }, (_, i) => ({
    id: i + 1,
    class_id: i % 3,
    confidence: 0.95 - i * 0.03,
    bbox: {
      x1: 100 + i * 200,
      y1: 100 + i * 200,
      x2: 200 + i * 200,
      y2: 200 + i * 200,
    },
  })),
  measurements: {
    stitch_count: detectionCount,
    stitch_lengths: Array.from({ length: detectionCount }, (_, i) => 5.2 - i * 0.2),
    stitch_angles: Array.from({ length: detectionCount }, (_, i) => 45.0 + i * 5),
    average_stitch_length: 5.2,
    average_angle: 45.0,
    pixels_per_mm: 10,
    quality_assessment: "Good",
  },
})

// Mock axios
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}))
// Use type assertion through unknown to avoid type conflicts
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> }

// Mock UnifiedAnalysisView
vi.mock("../features/unified-view", () => ({
  UnifiedAnalysisView: vi.fn(({ detections, measurements, imageUrl, imageSize }) => (
    <div data-testid="unified-analysis-view">
      <div data-testid="detections-count">{detections.length}</div>
      <div data-testid="image-url">{imageUrl}</div>
      <div data-testid="image-width">{imageSize[0]}</div>
      <div data-testid="image-height">{imageSize[1]}</div>
    </div>
  )),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as ((e: any) => void) | null,
  onerror: null as ((e: any) => void) | null,
  result: "data:image/png;base64,test",
}

global.FileReader = vi.fn(() => mockFileReader) as any

const renderComponent = (isMobile = false) => {
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
      <SutureAnalysis />
    </ThemeProvider>
  )
}

describe("SutureAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem("auth_token", "test-token")
    useSutureAnalysisStore.getState().resetAnalysis()
    import.meta.env.VITE_SUTURE_BACKEND_URL = "http://localhost:8000"
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe("Desktop Rendering", () => {
    it("should render desktop header with title", () => {
      renderComponent(false)
      expect(screen.getByText("Suture Quality Assessment")).toBeInTheDocument()
      expect(screen.getByText(/AI-Powered Analysis/i)).toBeInTheDocument()
    })

    it("should render desktop upload interface", () => {
      renderComponent(false)
      expect(screen.getByText("Analyze Suture Quality")).toBeInTheDocument()
      expect(screen.getByText("Take a photo or upload an image to get started")).toBeInTheDocument()
    })

    it("should show Take Photo and Upload File buttons", () => {
      renderComponent(false)
      expect(screen.getByRole("button", { name: /Take Photo/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Upload File/i })).toBeInTheDocument()
    })

    it("should display supported formats message", () => {
      renderComponent(false)
      expect(
        screen.getByText(/Supports iPhone\/Android photos, JPG, PNG, HEIC/)
      ).toBeInTheDocument()
    })
  })

  describe("Mobile Rendering", () => {
    it("should render mobile header with title", () => {
      renderComponent(true)
      expect(screen.getByText("Suture Analysis")).toBeInTheDocument()
    })

    it("should show simplified mobile interface", () => {
      renderComponent(true)
      expect(screen.getByText("Analyze Suture Quality")).toBeInTheDocument()
    })

    it("should not show desktop-only header text on mobile", () => {
      renderComponent(true)
      expect(screen.queryByText("AI-Powered Analysis")).not.toBeInTheDocument()
    })
  })

  describe("File Upload Buttons", () => {
    it("should trigger camera input when Take Photo clicked", () => {
      renderComponent()
      const takePhotoButton = screen.getByRole("button", { name: /Take Photo/i })

      // Mock the camera input
      const cameraInput = document.querySelector('input[capture="environment"]') as HTMLInputElement
      const clickSpy = vi.spyOn(cameraInput, "click")

      fireEvent.click(takePhotoButton)
      expect(clickSpy).toHaveBeenCalled()
    })

    it("should trigger file input when Upload File clicked", () => {
      renderComponent()

      // Find the file input (not the dropzone input, and not camera input)
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(
        (input) => !input.hasAttribute("capture") && !input.hasAttribute("multiple")
      ) as HTMLInputElement

      const clickSpy = vi.spyOn(fileInput, "click")

      const uploadButton = screen.getByRole("button", { name: /Upload File/i })
      fireEvent.click(uploadButton)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe("File Analysis", () => {
    it("should start analysis when file is selected", async () => {
      renderComponent()

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(
        (input) => !input.hasAttribute("capture")
      ) as HTMLInputElement

      // Mock FileReader
      mockFileReader.readAsDataURL = vi.fn(function (this: typeof mockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: "data:image/jpeg;base64,test" } } as any)
          }
        }, 0)
      })

      // Mock axios response
      mockedAxios.post.mockResolvedValue({
        data: {
          detections: [{ class_id: 0, confidence: 0.95, bbox: [100, 100, 200, 200] }],
          measurements: {
            stitch_lengths: [5.2],
            stitch_angles: [45.0],
            average_stitch_length: 5.2,
            average_angle: 45.0,
            pixels_per_mm: 10,
          },
          image_info: {
            size: [1920, 1080],
            format: "JPEG",
          },
          jpeg_image: "data:image/jpeg;base64,converted",
        },
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockFileReader.readAsDataURL).toHaveBeenCalled()
      })
    })

    it("should show analyzing message during analysis", async () => {
      renderComponent()

      // Directly trigger the analyzing state
      useSutureAnalysisStore.getState().startAnalysis()

      await waitFor(() => {
        expect(screen.getByText("Analyzing sutures...")).toBeInTheDocument()
      })
    })

    it("should show error when auth token missing", async () => {
      localStorageMock.removeItem("auth_token")
      renderComponent()

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(
        (input) => !input.hasAttribute("capture") && !input.hasAttribute("multiple")
      ) as HTMLInputElement

      mockFileReader.readAsDataURL = vi.fn(function (this: typeof mockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: "data:image/jpeg;base64,test" } } as any)
          }
        }, 0)
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(
          screen.getByText("Authentication token not found. Please log in again."),
        ).toBeInTheDocument()
      })
    })

    it("should show error when API call fails", async () => {
      renderComponent()

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" })
      const fileInputs = document.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(
        (input) => !input.hasAttribute("capture") && !input.hasAttribute("multiple")
      ) as HTMLInputElement

      mockFileReader.readAsDataURL = vi.fn(function (this: typeof mockFileReader) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: "data:image/jpeg;base64,test" } } as any)
          }
        }, 0)
      })

      mockedAxios.post.mockRejectedValue({
        response: {
          data: {
            detail: "Invalid image format",
          },
        },
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText("Invalid image format")).toBeInTheDocument()
      })
    })
  })

  describe("Analysis Results Display", () => {
    it("should display UnifiedAnalysisView when analysis completes", async () => {
      renderComponent()

      const mockAnalysisResult = createMockAnalysisResult(1)

      act(() => {
        useSutureAnalysisStore
          .getState()
          .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")
      })

      await waitFor(() => {
        expect(screen.getByTestId("unified-analysis-view")).toBeInTheDocument()
      })
    })

    it("should show correct detection count in results", async () => {
      renderComponent()

      const mockAnalysisResult = createMockAnalysisResult(3)

      act(() => {
        useSutureAnalysisStore
          .getState()
          .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")
      })

      await waitFor(() => {
        expect(screen.getByTestId("detections-count")).toHaveTextContent("3")
      })
    })

    it("should show New Analysis button when results displayed (desktop)", async () => {
      renderComponent(false)

      const mockAnalysisResult = createMockAnalysisResult(1)

      act(() => {
        useSutureAnalysisStore
          .getState()
          .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")
      })

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /New Analysis/i })).toBeInTheDocument()
      })
    })

    it("should show refresh button when results displayed (mobile)", async () => {
      renderComponent(true)

      const mockAnalysisResult = createMockAnalysisResult(1)

      act(() => {
        useSutureAnalysisStore
          .getState()
          .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")
      })

      await waitFor(() => {
        const refreshButtons = screen.getAllByRole("button")
        const hasRefreshButton = refreshButtons.some((btn) =>
          btn.querySelector('[data-testid="RefreshIcon"]')
        )
        expect(hasRefreshButton).toBe(true)
      })
    })
  })

  describe("Reset Analysis", () => {
    it("should reset analysis when New Analysis clicked", async () => {
      vi.useFakeTimers()

      const mockAnalysisResult = createMockAnalysisResult(1)

      useSutureAnalysisStore
        .getState()
        .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")

      renderComponent(false)

      expect(screen.getByRole("button", { name: /New Analysis/i })).toBeInTheDocument()

      const newAnalysisButton = screen.getByRole("button", { name: /New Analysis/i })
      fireEvent.click(newAnalysisButton)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByTestId("unified-analysis-view")).not.toBeInTheDocument()

      vi.useRealTimers()
    })

    it("should show upload interface after reset", async () => {
      vi.useFakeTimers()

      const mockAnalysisResult = createMockAnalysisResult(1)

      useSutureAnalysisStore
        .getState()
        .completeAnalysis(mockAnalysisResult, "data:image/jpeg;base64,test")

      renderComponent(false)

      expect(screen.getByRole("button", { name: /New Analysis/i })).toBeInTheDocument()

      const newAnalysisButton = screen.getByRole("button", { name: /New Analysis/i })
      fireEvent.click(newAnalysisButton)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.getByText("Analyze Suture Quality")).toBeInTheDocument()

      vi.useRealTimers()
    })
  })

  describe("Drag and Drop", () => {
    it("should have dropzone with proper attributes", () => {
      renderComponent()

      // Verify the component renders with dropzone capability
      expect(screen.getByText("Analyze Suture Quality")).toBeInTheDocument()

      // Verify dropzone input exists
      const dropzoneInputs = document.querySelectorAll('input[type="file"][multiple]')
      expect(dropzoneInputs.length).toBeGreaterThan(0)
    })

    it("should show upload interface for drag and drop", () => {
      renderComponent()

      // Verify interface shows drag/drop messaging
      expect(screen.getByText("Take a photo or upload an image to get started")).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("should display error alert when error occurs", async () => {
      // Set error before rendering so component picks it up
      useSutureAnalysisStore.getState().failAnalysis("Test error message")

      renderComponent()

      expect(screen.getByText("Analysis Error")).toBeInTheDocument()
      expect(screen.getByText("Test error message")).toBeInTheDocument()
    })

    it("should close error alert when close button clicked", async () => {
      // Set error before rendering
      useSutureAnalysisStore.getState().failAnalysis("Test error message")

      renderComponent()

      expect(screen.getByText("Test error message")).toBeInTheDocument()

      // MUI Alert close button has aria-label="Close"
      const closeButton = screen.getByLabelText("Close")
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText("Test error message")).not.toBeInTheDocument()
      })
    })

    it("should show generic error when no detail provided", () => {
      // Set error before rendering
      useSutureAnalysisStore.getState().failAnalysis("Analysis failed. Please try again.")

      renderComponent()

      expect(screen.getByText("Analysis failed. Please try again.")).toBeInTheDocument()
    })
  })

  describe("Camera Input", () => {
    it("should have camera input with capture attribute", () => {
      renderComponent()

      const cameraInput = document.querySelector('input[capture="environment"]') as HTMLInputElement
      expect(cameraInput).toBeInTheDocument()
      expect(cameraInput.getAttribute("capture")).toBe("environment")
      expect(cameraInput.getAttribute("accept")).toBe("image/*")
    })
  })

  describe("Disabled States", () => {
    it("should disable buttons during analysis", () => {
      // Start analysis before rendering
      useSutureAnalysisStore.getState().startAnalysis()

      renderComponent()

      const takePhotoButton = screen.getByRole("button", { name: /Take Photo/i })
      const uploadButton = screen.getByRole("button", { name: /Upload File/i })

      expect(takePhotoButton).toBeDisabled()
      expect(uploadButton).toBeDisabled()
    })
  })
})
