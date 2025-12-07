/**
 * Unit tests for useAIMHEIConfig hook
 */

import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import dayjs from "dayjs"
import { useAIMHEIConfig } from "../useAIMHEIConfig"

describe("useAIMHEIConfig", () => {
  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      expect(result.current.config.model).toBe("gpt-4o")
      expect(result.current.config.report_name).toBe("New Analysis")
      expect(result.current.config.hcp_name).toBe("ASTEC Staff")
      expect(result.current.interviewDate).toBeDefined()
      expect(result.current.validationErrors).toEqual({})
      expect(result.current.isValid).toBe(true)
    })

    it("should initialize with custom config", () => {
      const { result } = renderHook(() =>
        useAIMHEIConfig({
        report_name: "Custom Report",
        patient_id: "CUSTOM-001",
      })
      )

      expect(result.current.config.report_name).toBe("Custom Report")
      expect(result.current.config.patient_id).toBe("CUSTOM-001")
      expect(result.current.config.hcp_name).toBe("ASTEC Staff") // Default preserved
    })

    it("should initialize with current date", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      expect(result.current.interviewDate).not.toBeNull()
      expect(result.current.interviewDate?.isValid()).toBe(true)
    })
  })

  // ============================================================================
  // CONFIG UPDATES
  // ============================================================================

  describe("Config Updates", () => {
    it("should update report_name", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "New Report Name")
      })

      expect(result.current.config.report_name).toBe("New Report Name")
    })

    it("should update multiple fields", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("hcp_name", "Dr. Smith")
        result.current.updateConfig("patient_id", "PAT-123")
      })

      expect(result.current.config.hcp_name).toBe("Dr. Smith")
      expect(result.current.config.patient_id).toBe("PAT-123")
    })

    it("should sanitize HTML tags from input", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "<script>alert('xss')</script>Test")
      })

      expect(result.current.config.report_name).not.toContain("<script>")
      expect(result.current.config.report_name).toBe("alert('xss')Test")
    })

    it("should remove angle brackets", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("hcp_name", "Name <Test>")
      })

      expect(result.current.config.hcp_name).toBe("Name ")
    })

    it("should limit input length to 500 characters", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      const longString = "a".repeat(600)

      act(() => {
        result.current.updateConfig("report_name", longString)
      })

      expect(result.current.config.report_name.length).toBe(500)
    })
  })

  // ============================================================================
  // INTERVIEW DATE
  // ============================================================================

  describe("Interview Date", () => {
    it("should update interview date", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      const newDate = dayjs("2025-01-15")

      act(() => {
        result.current.setInterviewDate(newDate)
      })

      expect(result.current.interviewDate?.format("YYYY-MM-DD")).toBe("2025-01-15")
    })

    it("should sync interview_date in config when date changes", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      const newDate = dayjs("2025-02-20")

      act(() => {
        result.current.setInterviewDate(newDate)
      })

      expect(result.current.config.interview_date).toBe("2025-02-20")
    })

    it("should handle null interview date", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.setInterviewDate(null)
      })

      expect(result.current.interviewDate).toBeNull()
    })
  })

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe("Form Validation", () => {
    it("should validate successfully with file and valid data", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      let isValid: boolean = false

      act(() => {
        isValid = result.current.validateForm(true) // hasFile = true
      })

      expect(isValid).toBe(true)
      expect(result.current.validationErrors).toEqual({})
    })

    it("should fail validation without file", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      let isValid: boolean = false

      act(() => {
        isValid = result.current.validateForm(false) // hasFile = false
      })

      expect(isValid).toBe(false)
      expect(result.current.validationErrors.file).toBe("Please select a transcript file")
    })

    it("should validate report_name is required", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "")
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.report_name).toBe("Report name is required")
    })

    it("should validate report_name minimum length", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "Ab")
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.report_name).toBe(
        "Report name must be at least 3 characters"
      )
    })

    it("should validate hcp_year format", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("hcp_year", "25")
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.hcp_year).toBe(
        "Academic year must be a valid 4-digit year"
      )
    })

    it("should validate hcp_year is 4 digits", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("hcp_year", "2025")
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.hcp_year).toBeUndefined()
    })

    it("should validate patient_id minimum length", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("patient_id", "P1")
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.patient_id).toBe(
        "Patient ID must be at least 3 characters"
      )
    })

    it("should validate interview date not in future", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      const futureDate = dayjs().add(7, "day")

      act(() => {
        result.current.setInterviewDate(futureDate)
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.interview_date).toBe(
        "Interview date cannot be in the future"
      )
    })

    it("should validate all required fields", () => {
      const { result } = renderHook(() =>
        useAIMHEIConfig({
        report_name: "",
        hcp_name: "",
        patient_id: "",
        human_supervisor: "",
        aispe_location: "",
      })
      )

      act(() => {
        result.current.validateForm(false)
      })

      expect(result.current.validationErrors.file).toBeDefined()
      expect(result.current.validationErrors.report_name).toBeDefined()
      expect(result.current.validationErrors.hcp_name).toBeDefined()
      expect(result.current.validationErrors.patient_id).toBeDefined()
      expect(result.current.validationErrors.human_supervisor).toBeDefined()
      expect(result.current.validationErrors.aispe_location).toBeDefined()
    })
  })

  // ============================================================================
  // VALIDATION ERROR CLEARING
  // ============================================================================

  describe("Validation Error Clearing", () => {
    it("should clear validation error when field is updated", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "")
      })

      act(() => {
        result.current.validateForm(true)
      })

      expect(result.current.validationErrors.report_name).toBeDefined()

      act(() => {
        result.current.updateConfig("report_name", "Valid Report Name")
      })

      expect(result.current.validationErrors.report_name).toBeUndefined()
    })

    it("should manually clear validation error", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.validateForm(false)
      })

      expect(result.current.validationErrors.file).toBeDefined()

      act(() => {
        result.current.clearValidationError("file")
      })

      expect(result.current.validationErrors.file).toBeUndefined()
    })
  })

  // ============================================================================
  // CONFIG FIELD DIRECT SET
  // ============================================================================

  describe("Direct Config Field Setting", () => {
    it("should set config field without sanitization", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.setConfigField("report_name", "Programmatic Name")
      })

      expect(result.current.config.report_name).toBe("Programmatic Name")
    })
  })

  // ============================================================================
  // RESET
  // ============================================================================

  describe("Reset Configuration", () => {
    it("should reset to default configuration", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.updateConfig("report_name", "Changed Name")
        result.current.updateConfig("patient_id", "NEW-ID")
        result.current.resetConfig()
      })

      expect(result.current.config.report_name).toBe("New Analysis")
      expect(result.current.config.patient_id).toBe("PATIENT_001")
    })

    it("should clear validation errors on reset", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.validateForm(false)
        result.current.resetConfig()
      })

      expect(result.current.validationErrors).toEqual({})
    })
  })

  // ============================================================================
  // IS VALID COMPUTED PROPERTY
  // ============================================================================

  describe("isValid Computed Property", () => {
    it("should be true when no validation errors", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      expect(result.current.isValid).toBe(true)
    })

    it("should be false when validation errors exist", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.validateForm(false)
      })

      expect(result.current.isValid).toBe(false)
    })

    it("should update when errors are cleared", () => {
      const { result } = renderHook(() => useAIMHEIConfig())

      act(() => {
        result.current.validateForm(false)
      })

      expect(result.current.isValid).toBe(false)

      act(() => {
        result.current.clearValidationError("file")
        // Clear other errors
        Object.keys(result.current.validationErrors).forEach((key) => {
          result.current.clearValidationError(key as keyof typeof result.current.validationErrors)
        })
      })

      expect(result.current.isValid).toBe(true)
    })
  })
})
