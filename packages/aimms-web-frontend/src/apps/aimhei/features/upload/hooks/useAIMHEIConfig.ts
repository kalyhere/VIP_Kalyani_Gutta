/**
 * useAIMHEIConfig Hook
 * Manages AIMHEI configuration form state, validation, and sanitization
 */

import { useState, useCallback, useEffect } from "react"
import dayjs, { Dayjs } from "dayjs"

export interface AIMHEIConfig {
  model: string
  report_name: string
  hcp_name: string
  hcp_year: string
  patient_id: string
  human_supervisor: string
  interview_date: string
  aispe_location: string
}

export interface ValidationErrors {
  report_name?: string
  hcp_name?: string
  hcp_year?: string
  patient_id?: string
  human_supervisor?: string
  aispe_location?: string
  interview_date?: string
  file?: string
}

export interface UseAIMHEIConfigReturn {
  // State
  config: AIMHEIConfig
  interviewDate: Dayjs | null
  validationErrors: ValidationErrors
  isValid: boolean

  // Actions
  updateConfig: (field: keyof AIMHEIConfig, value: string) => void
  setInterviewDate: (date: Dayjs | null) => void
  validateForm: (hasFile: boolean) => boolean
  resetConfig: () => void
  setConfigField: (field: keyof AIMHEIConfig, value: string) => void
  clearValidationError: (field: keyof ValidationErrors) => void
}

const DEFAULT_CONFIG: AIMHEIConfig = {
  model: "gpt-4o",
  report_name: "New Analysis",
  hcp_name: "ASTEC Staff",
  hcp_year: new Date().getFullYear().toString(),
  patient_id: "PATIENT_001",
  human_supervisor: "ASTEC Staff",
  interview_date: new Date().toISOString().split("T")[0],
  aispe_location: "ASTEC",
}

/**
 * Sanitizes text input to remove dangerous characters
 */
function sanitizeInput(input: string): string {
  if (!input) return ""

  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .substring(0, 500) // Limit length
}

/**
 * Custom hook for managing AIMHEI configuration form
 *
 * @example
 * ```tsx
 * const {
 *   config,
 *   validationErrors,
 *   updateConfig,
 *   validateForm
 * } = useAIMHEIConfig()
 *
 * <TextField
 *   value={config.report_name}
 *   onChange={(e) => updateConfig('report_name', e.target.value)}
 *   error={!!validationErrors.report_name}
 *   helperText={validationErrors.report_name}
 * />
 * ```
 */
export function useAIMHEIConfig(initialConfig?: Partial<AIMHEIConfig>): UseAIMHEIConfigReturn {
  const [config, setConfig] = useState<AIMHEIConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })

  const [interviewDate, setInterviewDate] = useState<Dayjs | null>(dayjs())

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  /**
   * Validates all form fields
   */
  const validateForm = useCallback(
    (hasFile: boolean): boolean => {
      const errors: ValidationErrors = {}
      let isValid = true

      // Validate file upload
      if (!hasFile) {
        errors.file = "Please select a transcript file"
        isValid = false
      }

      // Validate report name
      const trimmedReportName = config.report_name.trim()
      if (!trimmedReportName) {
        errors.report_name = "Report name is required"
        isValid = false
      } else if (trimmedReportName.length < 3) {
        errors.report_name = "Report name must be at least 3 characters"
        isValid = false
      }

      // Validate healthcare provider name
      const trimmedHcpName = config.hcp_name.trim()
      if (!trimmedHcpName) {
        errors.hcp_name = "Healthcare provider name is required"
        isValid = false
      } else if (trimmedHcpName.length < 2) {
        errors.hcp_name = "Healthcare provider name must be at least 2 characters"
        isValid = false
      }

      // Validate academic year
      const trimmedHcpYear = config.hcp_year.trim()
      if (!trimmedHcpYear) {
        errors.hcp_year = "Academic year is required"
        isValid = false
      } else if (!/^\d{4}$/.test(trimmedHcpYear)) {
        errors.hcp_year = "Academic year must be a valid 4-digit year"
        isValid = false
      }

      // Validate patient ID
      const trimmedPatientId = config.patient_id.trim()
      if (!trimmedPatientId) {
        errors.patient_id = "Patient ID is required"
        isValid = false
      } else if (trimmedPatientId.length < 3) {
        errors.patient_id = "Patient ID must be at least 3 characters"
        isValid = false
      }

      // Validate clinical supervisor
      const trimmedSupervisor = config.human_supervisor.trim()
      if (!trimmedSupervisor) {
        errors.human_supervisor = "Clinical supervisor is required"
        isValid = false
      } else if (trimmedSupervisor.length < 2) {
        errors.human_supervisor = "Clinical supervisor must be at least 2 characters"
        isValid = false
      }

      // Validate interview location
      const trimmedLocation = config.aispe_location.trim()
      if (!trimmedLocation) {
        errors.aispe_location = "Interview location is required"
        isValid = false
      } else if (trimmedLocation.length < 2) {
        errors.aispe_location = "Interview location must be at least 2 characters"
        isValid = false
      }

      // Validate interview date
      if (!interviewDate) {
        errors.interview_date = "Interview date is required"
        isValid = false
      } else if (interviewDate.isAfter(dayjs())) {
        errors.interview_date = "Interview date cannot be in the future"
        isValid = false
      }

      setValidationErrors(errors)
      return isValid
    },
    [config, interviewDate],
  )

  /**
   * Updates a config field with sanitization
   */
  const updateConfig = useCallback((field: keyof AIMHEIConfig, value: string) => {
    const sanitizedValue = sanitizeInput(value)
    setConfig((prev) => ({ ...prev, [field]: sanitizedValue }))

    // Clear validation error for this field if it exists
    const validationField = field as keyof ValidationErrors
    setValidationErrors((prev) => {
      if (prev[validationField]) {
        return { ...prev, [validationField]: undefined }
      }
      return prev
    })
  }, [])

  /**
   * Sets a config field directly without sanitization
   * (useful for programmatic updates like from filename)
   */
  const setConfigField = useCallback((field: keyof AIMHEIConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Clears a specific validation error
   */
  const clearValidationError = useCallback((field: keyof ValidationErrors) => {
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  /**
   * Resets configuration to default values
   */
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setInterviewDate(dayjs())
    setValidationErrors({})
  }, [])

  /**
   * Sync interview_date in config when interviewDate changes
   */
  useEffect(() => {
    if (interviewDate) {
      setConfig((prev) => ({
        ...prev,
        interview_date: interviewDate.format("YYYY-MM-DD"),
      }))
    }
  }, [interviewDate])

  /**
   * Compute if form is currently valid (has no errors)
   */
  const isValid = Object.values(validationErrors).every((error) => error === undefined)

  return {
    // State
    config,
    interviewDate,
    validationErrors,
    isValid,

    // Actions
    updateConfig,
    setInterviewDate,
    validateForm,
    resetConfig,
    setConfigField,
    clearValidationError,
  }
}
