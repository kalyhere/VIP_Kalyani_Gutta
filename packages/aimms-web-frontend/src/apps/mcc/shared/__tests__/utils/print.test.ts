import { describe, it, expect, vi, beforeEach } from "vitest"
import { printCase } from "../../utils/print"

describe("print", () => {
  // Mock window.open
  const mockWrite = vi.fn()
  const mockClose = vi.fn()
  const mockPrint = vi.fn()
  const mockWindow = {
    document: {
      write: mockWrite,
      close: mockClose,
    },
    print: mockPrint,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.window.open = vi.fn(() => mockWindow)
  })

  describe("printCase", () => {
    it("opens a new window and prints the case with basic content", () => {
      const mockCase = {
        id: "case-1",
        name: "Test Case",
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            tables: [
              {
                id: "table-1",
                title: "Table 1",
                hasHeader: true,
                columns: 2,
                rows: [
                  {
                    id: "row-1",
                    cells: [
                      { id: "cell-1", content: "Header 1", isHeader: true },
                      { id: "cell-2", content: "Header 2", isHeader: true },
                    ],
                  },
                  {
                    id: "row-2",
                    cells: [
                      { id: "cell-3", content: "Data 1", isHeader: false },
                      { id: "cell-4", content: "Data 2", isHeader: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        lastModified: "2023-01-01T00:00:00Z",
      }

      printCase(mockCase)

      // Check if document.write was called with HTML content
      expect(mockWrite).toHaveBeenCalled()
      const htmlContent = mockWrite.mock.calls[0][0]

      // Verify the HTML content contains the case name
      expect(htmlContent).toContain("Test Case")

      // Verify the HTML content contains the section title
      expect(htmlContent).toContain("Section 1")

      // Verify the HTML content contains the table title
      expect(htmlContent).toContain("Table 1")

      // Verify the HTML content contains the table data
      expect(htmlContent).toContain("Header 1")
      expect(htmlContent).toContain("Header 2")
      expect(htmlContent).toContain("Data 1")
      expect(htmlContent).toContain("Data 2")

      // Check if document.close and window.print were called
      expect(mockClose).toHaveBeenCalled()
      expect(mockPrint).toHaveBeenCalled()
    })

    it("handles a cell with a single image", () => {
      const mockCase = {
        id: "case-1",
        name: "Test Case",
        lastModified: "2023-01-01T00:00:00Z",
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            tables: [
              {
                id: "table-1",
                title: "Table 1",
                hasHeader: true,
                columns: 2,
                rows: [
                  {
                    id: "row-1",
                    cells: [
                      {
                        id: "cell-1",
                        content: "",
                        isHeader: false,
                        imageUrls: ["data:image/png;base64,abc123#width=100&height=100"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }

      printCase(mockCase)

      const htmlContent = mockWrite.mock.calls[0][0]

      // Verify image is included without dimensions
      expect(htmlContent).toContain("data:image/png;base64,abc123")
      expect(htmlContent).not.toContain("#width=100&height=100")

      // Verify image grid container is present
      expect(htmlContent).toContain('<div class="image-grid">')

      // Verify image styling
      expect(htmlContent).toContain(
        'style="max-width: 100%; max-height: 200px; object-fit: contain;"'
      )
    })

    it("handles a cell with multiple images", () => {
      const mockCase = {
        id: "case-1",
        name: "Test Case",
        lastModified: "2023-01-01T00:00:00Z",
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            tables: [
              {
                id: "table-1",
                title: "Table 1",
                hasHeader: true,
                columns: 2,
                rows: [
                  {
                    id: "row-1",
                    cells: [
                      {
                        id: "cell-1",
                        content: "",
                        isHeader: false,
                        imageUrls: [
                          "data:image/png;base64,image1#width=100&height=100",
                          "data:image/png;base64,image2#width=200&height=200",
                          "data:image/png;base64,image3#width=300&height=300",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }

      printCase(mockCase)

      const htmlContent = mockWrite.mock.calls[0][0]

      // Verify all images are included without dimensions
      expect(htmlContent).toContain("data:image/png;base64,image1")
      expect(htmlContent).toContain("data:image/png;base64,image2")
      expect(htmlContent).toContain("data:image/png;base64,image3")

      // Verify no dimension parameters are included
      expect(htmlContent).not.toContain("#width=")
      expect(htmlContent).not.toContain("#height=")

      // Count the number of images
      const imageCount = (htmlContent.match(/<img/g) || []).length
      expect(imageCount).toBe(3)

      // Verify image grid styling
      expect(htmlContent).toContain("display: flex")
      expect(htmlContent).toContain("flex-wrap: wrap")
      expect(htmlContent).toContain("gap: 8px")
    })

    it("handles a mix of text and image cells", () => {
      const mockCase = {
        id: "case-1",
        name: "Test Case",
        lastModified: "2023-01-01T00:00:00Z",
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            tables: [
              {
                id: "table-1",
                title: "Table 1",
                hasHeader: true,
                columns: 2,
                rows: [
                  {
                    id: "row-1",
                    cells: [
                      {
                        id: "cell-1",
                        content: "Text content",
                        isHeader: false,
                      },
                      {
                        id: "cell-2",
                        content: "",
                        isHeader: false,
                        imageUrls: ["data:image/png;base64,abc123#width=100&height=100"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }

      printCase(mockCase)

      const htmlContent = mockWrite.mock.calls[0][0]

      // Verify text content is preserved
      expect(htmlContent).toContain("Text content")

      // Verify image is included
      expect(htmlContent).toContain("data:image/png;base64,abc123")

      // Verify image grid is only present in the image cell
      const imageGridCount = (htmlContent.match(/class="image-grid"/g) || []).length
      expect(imageGridCount).toBe(1)
    })

    it("handles null case gracefully", () => {
      printCase(null)

      // Verify default title is used
      const htmlContent = mockWrite.mock.calls[0][0]
      expect(htmlContent).toContain("Medical Case")

      // Verify no sections or tables are rendered
      expect(htmlContent).not.toContain('<div class="section-title">')
      expect(htmlContent).not.toContain('<div class="table-title">')
    })
  })
})
