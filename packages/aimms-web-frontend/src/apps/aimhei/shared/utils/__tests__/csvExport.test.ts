import { describe, it, expect, vi, beforeEach } from "vitest"
import { adminApiClient } from "@services/adminApiClient"
import { exportReportsToCSV } from "../csvExport"

vi.mock("@services/adminApiClient")

describe("csvExport", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock DOM APIs
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url")
    global.URL.revokeObjectURL = vi.fn()
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  describe("exportReportsToCSV", () => {
    it("should return error when no reports are selected", async () => {
      const result = await exportReportsToCSV(new Set())

      expect(result.success).toBe(false)
      expect(result.message).toBe("Please select at least one report to export")
      expect(result.severity).toBe("error")
    })

    it("should successfully export single report", async () => {
      const mockBlob = new Blob(["test data"], { type: "text/csv" })
      vi.mocked(adminApiClient.exportReportsCSV).mockResolvedValue(mockBlob)

      const result = await exportReportsToCSV(new Set([1]))

      expect(result.success).toBe(true)
      expect(result.message).toBe("Successfully exported 1 report")
      expect(result.severity).toBe("success")
      expect(adminApiClient.exportReportsCSV).toHaveBeenCalledWith([1])
    })

    it("should successfully export multiple reports", async () => {
      const mockBlob = new Blob(["test data"], { type: "text/csv" })
      vi.mocked(adminApiClient.exportReportsCSV).mockResolvedValue(mockBlob)

      const result = await exportReportsToCSV(new Set([1, 2, 3]))

      expect(result.success).toBe(true)
      expect(result.message).toBe("Successfully exported 3 reports")
      expect(result.severity).toBe("success")
      expect(adminApiClient.exportReportsCSV).toHaveBeenCalledWith([1, 2, 3])
    })

    it("should create download link with correct filename", async () => {
      const mockBlob = new Blob(["test data"], { type: "text/csv" })
      vi.mocked(adminApiClient.exportReportsCSV).mockResolvedValue(mockBlob)

      const createElementSpy = vi.spyOn(document, "createElement")
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
      } as unknown as HTMLAnchorElement

      createElementSpy.mockReturnValue(mockAnchor)

      await exportReportsToCSV(new Set([1, 2]))

      expect(mockAnchor.download).toBe("aimhei_reports_2_selected.xlsx")
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor)
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")

      createElementSpy.mockRestore()
    })

    it("should handle export failure", async () => {
      const error = new Error("Export failed")
      vi.mocked(adminApiClient.exportReportsCSV).mockRejectedValue(error)

      const result = await exportReportsToCSV(new Set([1]))

      expect(result.success).toBe(false)
      expect(result.message).toBe("Export failed")
      expect(result.severity).toBe("error")
    })

    it("should handle export failure without error message", async () => {
      vi.mocked(adminApiClient.exportReportsCSV).mockRejectedValue({})

      const result = await exportReportsToCSV(new Set([1]))

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to export reports")
      expect(result.severity).toBe("error")
    })
  })
})
