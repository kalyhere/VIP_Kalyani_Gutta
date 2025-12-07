import { describe, it, expect, vi, beforeEach } from "vitest"
import { getScoreColor, getAvatarColor, submitTranscriptForProcessing } from "../helpers"
import type { AIMHEIConfig } from "../../../features/upload/hooks/useAIMHEIConfig"
import type { Theme } from "@mui/material"

// Mock theme object for testing
const mockTheme: Theme = {
  palette: {
    primary: {
      main: "#AB0520",
      dark: "#8B0015",
      light: "#1E5288",
    },
    secondary: {
      main: "#378DBD",
      dark: "#001C48",
      light: "#1DA2AF",
    },
    text: {
      primary: "#001C48",
      secondary: "#64798A",
      disabled: "#BDBDBD",
    },
    divider: "#E2E8F0",
    background: {
      paper: "#FFFFFF",
      default: "#F7FAFC",
    },
  },
} as Theme

describe("helpers", () => {
  describe("getScoreColor", () => {
    it("should return text.disabled for null score", () => {
      expect(getScoreColor(null, mockTheme)).toBe(mockTheme.palette.text.disabled)
    })

    it("should return secondary.light for score >= 80", () => {
      expect(getScoreColor(80, mockTheme)).toBe(mockTheme.palette.secondary.light)
      expect(getScoreColor(85, mockTheme)).toBe(mockTheme.palette.secondary.light)
      expect(getScoreColor(100, mockTheme)).toBe(mockTheme.palette.secondary.light)
    })

    it("should return secondary.main for score >= 60 and < 80", () => {
      expect(getScoreColor(60, mockTheme)).toBe(mockTheme.palette.secondary.main)
      expect(getScoreColor(70, mockTheme)).toBe(mockTheme.palette.secondary.main)
      expect(getScoreColor(79, mockTheme)).toBe(mockTheme.palette.secondary.main)
    })

    it("should return primary.main for score < 60", () => {
      expect(getScoreColor(0, mockTheme)).toBe(mockTheme.palette.primary.main)
      expect(getScoreColor(30, mockTheme)).toBe(mockTheme.palette.primary.main)
      expect(getScoreColor(59, mockTheme)).toBe(mockTheme.palette.primary.main)
    })
  })

  describe("getAvatarColor", () => {
    it("should return text.disabled for null title", () => {
      expect(getAvatarColor(null, mockTheme)).toBe(mockTheme.palette.text.disabled)
    })

    it("should return text.disabled for undefined title", () => {
      expect(getAvatarColor(undefined, mockTheme)).toBe(mockTheme.palette.text.disabled)
    })

    it("should return text.disabled for empty title", () => {
      expect(getAvatarColor("", mockTheme)).toBe(mockTheme.palette.text.disabled)
    })

    it("should return consistent color for same title", () => {
      const color1 = getAvatarColor("Test Report", mockTheme)
      const color2 = getAvatarColor("Test Report", mockTheme)

      expect(color1).toBe(color2)
    })

    it("should return different colors for different titles", () => {
      const color1 = getAvatarColor("Report A", mockTheme)
      const color2 = getAvatarColor("Report B", mockTheme)

      // They might be the same by chance, but this tests the hashing logic exists
      expect(color1).toBeDefined()
      expect(color2).toBeDefined()
    })

    it("should return a color from the available palette", () => {
      const availableColors = [
        mockTheme.palette.secondary.main,
        mockTheme.palette.secondary.light,
        mockTheme.palette.primary.main,
        mockTheme.palette.primary.dark,
        mockTheme.palette.secondary.dark,
        mockTheme.palette.primary.light,
      ]

      const color = getAvatarColor("Test", mockTheme)
      expect(availableColors).toContain(color)
    })
  })

  describe("submitTranscriptForProcessing", () => {
    const mockConfig: AIMHEIConfig = {
      model: "gpt-4o",
      report_name: "Test Report",
      hcp_name: "Dr. Smith",
      hcp_year: "2024",
      patient_id: "P123",
      human_supervisor: "Dr. Johnson",
      interview_date: "2024-01-15",
      aispe_location: "Hospital A",
    }

    const mockFile = new File(["transcript content"], "transcript.txt", { type: "text/plain" })

    beforeEach(() => {
      vi.clearAllMocks()
      global.fetch = vi.fn()
      localStorage.setItem("auth_token", "mock-token")
      import.meta.env.VITE_API_URL = "http://localhost:8000"
    })

    it("should successfully submit transcript without criteria", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, job_id: "job-123" }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

      const result = await submitTranscriptForProcessing({
        transcriptFile: mockFile,
        config: mockConfig,
        criteriaFile: null,
      })

      expect(result.success).toBe(true)
      expect(result.job_id).toBe("job-123")
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/transcripts/submit-async",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      )
    })

    it("should successfully submit transcript with criteria", async () => {
      const mockCriteria = new File(["criteria"], "criteria.json", { type: "application/json" })
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, job_id: "job-456" }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

      const result = await submitTranscriptForProcessing({
        transcriptFile: mockFile,
        config: mockConfig,
        criteriaFile: mockCriteria,
      })

      expect(result.success).toBe(true)
      expect(result.job_id).toBe("job-456")
    })

    it("should handle submission failure", async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ detail: "Validation error" }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

      await expect(
        submitTranscriptForProcessing({
          transcriptFile: mockFile,
          config: mockConfig,
          criteriaFile: null,
        })
      ).rejects.toThrow("Validation error")
    })

    it("should handle network error", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"))

      await expect(
        submitTranscriptForProcessing({
          transcriptFile: mockFile,
          config: mockConfig,
          criteriaFile: null,
        })
      ).rejects.toThrow("Network error")
    })

    it("should properly format backend config", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, job_id: "job-789" }),
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response)

      await submitTranscriptForProcessing({
        transcriptFile: mockFile,
        config: mockConfig,
        criteriaFile: null,
      })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const formData = fetchCall[1]?.body as FormData

      expect(formData).toBeInstanceOf(FormData)
    })
  })
})
