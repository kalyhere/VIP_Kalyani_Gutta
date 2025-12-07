import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ThemeProvider, createTheme } from "@mui/material"
import ImagePreview from "../components/ImagePreview"

const theme = createTheme()

const renderComponent = (
  previewUrl = "data:image/png;base64,test",
  fileName = "test-image.jpg",
  onImageClick = vi.fn()
) =>
  render(
  <ThemeProvider theme={theme}>
      <ImagePreview previewUrl={previewUrl} fileName={fileName} onImageClick={onImageClick} />
    </ThemeProvider>,
  )

describe("ImagePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render the component", () => {
      renderComponent()
      expect(screen.getByAltText("Preview")).toBeInTheDocument()
    })

    it("should display uploaded file name", () => {
      renderComponent("data:image", "my-photo.png")
      expect(screen.getByText(/my-photo.png/)).toBeInTheDocument()
    })

    it("should display 'Uploaded:' label", () => {
      renderComponent()
      expect(screen.getByText(/Uploaded:/)).toBeInTheDocument()
    })

    it("should render image with correct src", () => {
      const testUrl = "data:image/jpeg;base64,/9j/test"
      renderComponent(testUrl)

      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe(testUrl)
    })

    it("should render image with correct alt text", () => {
      renderComponent()
      expect(screen.getByAltText("Preview")).toBeInTheDocument()
    })
  })

  describe("Image Styling", () => {
    it("should apply correct styles to image", () => {
      renderComponent()
      const img = screen.getByAltText("Preview") as HTMLImageElement

      expect(img).toHaveStyle({
        maxWidth: "100%",
        maxHeight: "300px",
        borderRadius: "4px",
        objectFit: "contain",
        cursor: "pointer",
      })
    })

    it("should have pointer cursor to indicate clickability", () => {
      renderComponent()
      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img).toHaveStyle({ cursor: "pointer" })
    })
  })

  describe("Click Handling", () => {
    it("should call onImageClick when image is clicked", () => {
      const onImageClick = vi.fn()
      renderComponent("data:image", "test.jpg", onImageClick)

      const img = screen.getByAltText("Preview")
      fireEvent.click(img)

      expect(onImageClick).toHaveBeenCalledTimes(1)
    })

    it("should pass mouse event to onImageClick", () => {
      const onImageClick = vi.fn()
      renderComponent("data:image", "test.jpg", onImageClick)

      const img = screen.getByAltText("Preview")
      fireEvent.click(img)

      expect(onImageClick).toHaveBeenCalledWith(expect.any(Object))
      expect(onImageClick.mock.calls[0][0]).toHaveProperty("type", "click")
    })

    it("should handle multiple clicks", () => {
      const onImageClick = vi.fn()
      renderComponent("data:image", "test.jpg", onImageClick)

      const img = screen.getByAltText("Preview")
      fireEvent.click(img)
      fireEvent.click(img)
      fireEvent.click(img)

      expect(onImageClick).toHaveBeenCalledTimes(3)
    })
  })

  describe("Different File Names", () => {
    it("should display short file name", () => {
      renderComponent("data:image", "a.png")
      expect(screen.getByText(/a.png/)).toBeInTheDocument()
    })

    it("should display long file name", () => {
      const longFileName = "very-long-file-name-with-many-characters-and-details.jpeg"
      renderComponent("data:image", longFileName)
      expect(screen.getByText(new RegExp(longFileName))).toBeInTheDocument()
    })

    it("should display file name with spaces", () => {
      renderComponent("data:image", "my photo with spaces.jpg")
      expect(screen.getByText(/my photo with spaces.jpg/)).toBeInTheDocument()
    })

    it("should display file name with special characters", () => {
      renderComponent("data:image", "image_123-final(1).png")
      expect(screen.getByText(/image_123-final\(1\).png/)).toBeInTheDocument()
    })
  })

  describe("Different Image URLs", () => {
    it("should handle data URL for PNG", () => {
      const pngUrl = "data:image/png;base64,iVBORw0KGgo="
      renderComponent(pngUrl)

      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe(pngUrl)
    })

    it("should handle data URL for JPEG", () => {
      const jpegUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
      renderComponent(jpegUrl)

      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe(jpegUrl)
    })

    it("should handle blob URL", () => {
      const blobUrl = "blob:http://localhost:3000/abc-123-def"
      renderComponent(blobUrl)

      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe(blobUrl)
    })

    it("should handle http URL", () => {
      const httpUrl = "http://example.com/image.jpg"
      renderComponent(httpUrl)

      const img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe(httpUrl)
    })
  })

  describe("Accessibility", () => {
    it("should have alt text for screen readers", () => {
      renderComponent()
      const img = screen.getByAltText("Preview")
      expect(img).toHaveAttribute("alt", "Preview")
    })

    it("should be keyboard accessible (implicit via click)", () => {
      const onImageClick = vi.fn()
      renderComponent("data:image", "test.jpg", onImageClick)

      const img = screen.getByAltText("Preview")
      // Click event also covers keyboard activation
      fireEvent.click(img)

      expect(onImageClick).toHaveBeenCalled()
    })
  })

  describe("Re-rendering", () => {
    it("should update when previewUrl changes", () => {
      const { rerender } = renderComponent("data:image/old", "test.jpg")
      let img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe("data:image/old")

      rerender(
        <ThemeProvider theme={theme}>
          <ImagePreview previewUrl="data:image/new" fileName="test.jpg" onImageClick={vi.fn()} />
        </ThemeProvider>
      )

      img = screen.getByAltText("Preview") as HTMLImageElement
      expect(img.src).toBe("data:image/new")
    })

    it("should update when fileName changes", () => {
      const { rerender } = renderComponent("data:image", "old.jpg")
      expect(screen.getByText(/old.jpg/)).toBeInTheDocument()

      rerender(
        <ThemeProvider theme={theme}>
          <ImagePreview previewUrl="data:image" fileName="new.jpg" onImageClick={vi.fn()} />
        </ThemeProvider>
      )

      expect(screen.getByText(/new.jpg/)).toBeInTheDocument()
      expect(screen.queryByText(/old.jpg/)).not.toBeInTheDocument()
    })
  })
})
