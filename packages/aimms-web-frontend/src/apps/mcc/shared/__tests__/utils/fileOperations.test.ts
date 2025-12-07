import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getDefaultDownloadFileName,
  downloadCases,
  downloadFormat,
  uploadFile,
} from "../../utils/fileOperations"

describe("fileOperations", () => {
  const mockDate = new Date("2023-01-15T12:00:00Z")
  const mockDateString = "2023-01-15"

  // Mock for URL.createObjectURL and URL.revokeObjectURL
  const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url")
  const mockRevokeObjectURL = vi.fn()

  // Mock for document methods
  const mockAppendChild = vi.fn()
  const mockRemoveChild = vi.fn()
  const mockClick = vi.fn()
  const mockCreateElement = vi.fn().mockReturnValue({
    href: "",
    download: "",
    click: mockClick,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Date
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)

    // Mock URL methods
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL

    // Mock document methods
    document.createElement = mockCreateElement
    document.body.appendChild = mockAppendChild
    document.body.removeChild = mockRemoveChild
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getDefaultDownloadFileName", () => {
    it("returns correct filename for cases", () => {
      const result = getDefaultDownloadFileName("cases")
      expect(result).toBe(`medical-cases-${mockDateString}`)
    })

    it("returns correct filename for format", () => {
      const result = getDefaultDownloadFileName("format")
      expect(result).toBe(`medical-case-format-${mockDateString}`)
    })
  })

  describe("downloadCases", () => {
    it("creates and downloads a JSON file with cases data", () => {
      const mockCases = [
        {
          id: "case-1",
          name: "Test Case 1",
          sections: [],
          lastModified: "2023-01-01T00:00:00Z",
        },
      ]

      downloadCases(mockCases, "test-cases")

      // Check if Blob was created with correct data
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)

      // Check if anchor element was created and configured correctly
      expect(mockCreateElement).toHaveBeenCalledWith("a")
      const anchorElement = mockCreateElement.mock.results[0].value
      expect(anchorElement.href).toBe("blob:mock-url")
      expect(anchorElement.download).toBe("test-cases.json")

      // Check if anchor was appended, clicked, and removed
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()

      // Check if URL was revoked
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
    })
  })

  describe("downloadFormat", () => {
    it("creates and downloads a JSON file with format data", () => {
      const mockCase = {
        id: "case-1",
        name: "Test Case 1",
        sections: [{ id: "section-1", title: "Section 1", tables: [] }],
        lastModified: "2023-01-01T00:00:00Z",
      }

      downloadFormat(mockCase, "test-format")

      // Check if Blob was created with correct data
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)

      // Check if anchor element was created and configured correctly
      expect(mockCreateElement).toHaveBeenCalledWith("a")
      const anchorElement = mockCreateElement.mock.results[0].value
      expect(anchorElement.href).toBe("blob:mock-url")
      expect(anchorElement.download).toBe("test-format.json")

      // Check if anchor was appended, clicked, and removed
      expect(mockAppendChild).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRemoveChild).toHaveBeenCalled()

      // Check if URL was revoked
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
    })

    it("handles null case gracefully", () => {
      downloadFormat(null, "test-format")

      // Check if Blob was created with empty sections
      expect(mockCreateObjectURL).toHaveBeenCalled()
      const blobCall = mockCreateObjectURL.mock.calls[0][0]
      expect(blobCall).toBeInstanceOf(Blob)

      // Verify the blob contains empty sections
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = JSON.parse(e.target?.result as string)
        expect(content.sections).toEqual([])
        expect(content.name).toBe("")
      }
      reader.readAsText(blobCall)
    })
  })

  describe("uploadFile", () => {
    it("resolves with cases data when uploading a cases file", async () => {
      const mockFileContent = JSON.stringify({
        version: "1.0",
        timestamp: "2023-01-01T00:00:00Z",
        cases: [
          {
            id: "case-1",
            name: "Test Case 1",
            sections: [],
            lastModified: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const mockFile = new File([mockFileContent], "test-cases.json", { type: "application/json" })

      // Mock FileReader
      const mockReadAsText = vi.fn()
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: mockReadAsText,
      }

      vi.spyOn(global, "FileReader").mockImplementation(() => mockFileReader as any)

      const uploadPromise = uploadFile(mockFile)

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: mockFileContent } })

      const result = await uploadPromise
      expect(result).toEqual({
        cases: [
          {
            id: "case-1",
            name: "Test Case 1",
            sections: [],
            lastModified: "2023-01-01T00:00:00Z",
          },
        ],
      })
    })

    it("resolves with a new case when uploading a format file", async () => {
      const mockFileContent = JSON.stringify({
        version: "1.0",
        timestamp: "2023-01-01T00:00:00Z",
        name: "Test Format",
        sections: [{ id: "section-1", title: "Section 1", tables: [] }],
      })

      const mockFile = new File([mockFileContent], "test-format.json", { type: "application/json" })

      // Mock FileReader
      const mockReadAsText = vi.fn()
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: mockReadAsText,
      }

      vi.spyOn(global, "FileReader").mockImplementation(() => mockFileReader as any)

      const uploadPromise = uploadFile(mockFile)

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: mockFileContent } })

      const result = await uploadPromise
      expect(result.cases.length).toBe(1)
      expect(result.cases[0].name).toBe("Test Format")
      expect(result.cases[0].sections).toEqual([
        { id: "section-1", title: "Section 1", tables: [] },
      ])
    })

    it("rejects with an error when file format is invalid", async () => {
      const mockFileContent = JSON.stringify({ invalidData: true })
      const mockFile = new File([mockFileContent], "invalid.json", { type: "application/json" })

      // Mock FileReader
      const mockReadAsText = vi.fn()
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: mockReadAsText,
      }

      vi.spyOn(global, "FileReader").mockImplementation(() => mockFileReader as any)

      const uploadPromise = uploadFile(mockFile)

      // Simulate FileReader onload with invalid data
      mockFileReader.onload({ target: { result: mockFileContent } })

      await expect(uploadPromise).rejects.toThrow("Invalid file format")
    })

    it("rejects with an error when FileReader encounters an error", async () => {
      const mockFile = new File([""], "test.json", { type: "application/json" })

      // Mock FileReader
      const mockReadAsText = vi.fn()
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: mockReadAsText,
      }

      vi.spyOn(global, "FileReader").mockImplementation(() => mockFileReader as any)

      const uploadPromise = uploadFile(mockFile)

      // Simulate FileReader error
      mockFileReader.onerror()

      await expect(uploadPromise).rejects.toThrow("Error reading file")
    })
  })
})
