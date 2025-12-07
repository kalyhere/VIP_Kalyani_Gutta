/**
 * useCriteriaUpload Hook
 * Manages custom criteria file upload with validation
 */

import { useState, useRef } from "react"

export interface UseCriteriaUploadOptions {
  onValidationError?: (message: string) => void
  onValidationSuccess?: (fileName: string) => void
}

export interface UseCriteriaUploadReturn {
  useCustomCriteria: boolean
  criteriaFile: File | null
  isCriteriaDragOver: boolean
  criteriaFileInputRef: React.RefObject<HTMLInputElement>

  setUseCustomCriteria: (use: boolean) => void
  handleCriteriaDragOver: (e: React.DragEvent) => void
  handleCriteriaDragLeave: (e: React.DragEvent) => void
  handleCriteriaDrop: (e: React.DragEvent) => Promise<void>
  handleCriteriaFileSelect: () => void
  handleCriteriaFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  removeCriteriaFile: () => void
}

export const useCriteriaUpload = (
  options: UseCriteriaUploadOptions = {}
): UseCriteriaUploadReturn => {
  const { onValidationError, onValidationSuccess } = options

  const [useCustomCriteria, setUseCustomCriteria] = useState(false)
  const [criteriaFile, setCriteriaFile] = useState<File | null>(null)
  const [isCriteriaDragOver, setIsCriteriaDragOver] = useState(false)
  const criteriaFileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSetCriteriaFile = async (file: File) => {
    if (!file.name.endsWith(".json")) {
      onValidationError?.("Please upload a JSON file")
      return
    }

    // Validate JSON structure
    try {
      const text = await file.text()
      const criteria = JSON.parse(text)

      // Check for required sections
      const requiredSections = ["Information Section", "Skill Section"]
      for (const section of requiredSections) {
        if (!(section in criteria)) {
          onValidationError?.(`Invalid criteria file: missing '${section}'`)
          if (criteriaFileInputRef.current) {
            criteriaFileInputRef.current.value = ""
          }
          return
        }
      }

      // Store the file for submission
      setCriteriaFile(file)
      onValidationSuccess?.(`Custom criteria loaded: ${file.name}`)
    } catch (error: any) {
      onValidationError?.(error.message || "Invalid JSON file")
      if (criteriaFileInputRef.current) {
        criteriaFileInputRef.current.value = ""
      }
    }
  }

  const handleCriteriaDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsCriteriaDragOver(true)
  }

  const handleCriteriaDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsCriteriaDragOver(false)
  }

  const handleCriteriaDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsCriteriaDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find(
      (file) => file.type === "application/json" || file.name.endsWith(".json"),
    )

    if (jsonFile) {
      await validateAndSetCriteriaFile(jsonFile)
    } else {
      onValidationError?.("Please drop a .json criteria file")
    }
  }

  const handleCriteriaFileSelect = () => {
    criteriaFileInputRef.current?.click()
  }

  const handleCriteriaFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await validateAndSetCriteriaFile(file)
    }
  }

  const removeCriteriaFile = () => {
    setCriteriaFile(null)
    if (criteriaFileInputRef.current) {
      criteriaFileInputRef.current.value = ""
    }
  }

  return {
    useCustomCriteria,
    criteriaFile,
    isCriteriaDragOver,
    criteriaFileInputRef,
    setUseCustomCriteria,
    handleCriteriaDragOver,
    handleCriteriaDragLeave,
    handleCriteriaDrop,
    handleCriteriaFileSelect,
    handleCriteriaFileChange,
    removeCriteriaFile,
  }
}
