/**
 * useFileUpload Hook
 * Manages file upload state and operations for AIMHEI transcript files
 */

import { useState, useRef, useCallback } from "react"

/**
 * Helper function to clean filename for display as report name
 */
const cleanFilenameForReportName = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")

  // Replace underscores and hyphens with spaces
  const withSpaces = nameWithoutExt.replace(/[_-]/g, " ")

  // Capitalize first letter of each word
  const titleCase = withSpaces.replace(/\b\w/g, (l) => l.toUpperCase())

  return titleCase
}

/**
 * Default accepted file types - defined outside hook to maintain referential stability
 */
const DEFAULT_ACCEPTED_TYPES = ["text/plain", ".txt"]

export interface UseFileUploadReturn {
  // State
  file: File | null
  isDragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement>

  // Actions
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileSelect: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void
  getCleanedFilename: (filename: string) => string
}

/**
 * Custom hook for managing file upload state and operations
 *
 * @example
 * ```tsx
 * const {
 *   file,
 *   isDragOver,
 *   fileInputRef,
 *   handleDrop,
 *   handleFileChange,
 *   removeFile
 * } = useFileUpload({
 *   onFileSelect: (file, cleanedName) => {
 *     console.log('File selected:', file.name)
 *   },
 *   onError: (message) => {
 *     console.error(message)
 *   }
 * })
 * ```
 */
export function useFileUpload(options?: {
  onFileSelect?: (file: File, cleanedFilename: string) => void
  onError?: (message: string) => void
  acceptedTypes?: string[]
}): UseFileUploadReturn {
  const { onFileSelect, onError, acceptedTypes = DEFAULT_ACCEPTED_TYPES } = options || {}

  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validates if a file is an accepted type
   */
  const isValidFileType = useCallback(
    (file: File): boolean =>
      file.type === "text/plain"
        || file.name.endsWith(".txt")
        || acceptedTypes.some(
          (type) => file.type === type || file.name.endsWith(type),
        ),
        [acceptedTypes]
    )

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  /**
   * Handles file drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const textFile = files.find((file) => isValidFileType(file))

      if (textFile) {
        setFile(textFile)
        const cleanedName = cleanFilenameForReportName(textFile.name)
        onFileSelect?.(textFile, cleanedName)
      } else {
        onError?.("Please drop a .txt transcript file")
      }
    },
    [isValidFileType, onFileSelect, onError]
  )

  /**
   * Triggers file input click
   */
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * Handles file input change
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]

      if (selectedFile && isValidFileType(selectedFile)) {
        setFile(selectedFile)
        const cleanedName = cleanFilenameForReportName(selectedFile.name)
        onFileSelect?.(selectedFile, cleanedName)
      } else {
        onError?.("Please select a .txt transcript file")
      }
    },
    [isValidFileType, onFileSelect, onError]
  )

  /**
   * Removes the currently selected file
   */
  const removeFile = useCallback(() => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  /**
   * Gets cleaned filename for display
   */
  const getCleanedFilename = useCallback(
    (filename: string) => cleanFilenameForReportName(filename),
    []
  )

  return {
    // State
    file,
    isDragOver,
    fileInputRef,

    // Actions
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleFileChange,
    removeFile,
    getCleanedFilename,
  }
}
