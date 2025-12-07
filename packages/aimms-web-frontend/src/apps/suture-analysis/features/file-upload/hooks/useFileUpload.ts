import { useState, useEffect } from "react"
import { useNotificationStore } from "../../../../../stores/notificationStore"

// Define more specific type for file input
export interface FileInputState {
  rawFile: File
  src: string
  title: string
}

// Define the structure that FileInput passes to onChange
export interface FileInputChangeValue extends FileInputState {
  [key: string]: any
}

/**
 * Custom hook to manage file upload state and logic
 */
export const useFileUpload = (onFileChange?: () => void) => {
  const notify = useNotificationStore((state) => state.notify)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create and clean up the preview URL when the file changes
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile)
      setPreviewUrl(url)

      // Clean up the URL when the component unmounts or when the file changes
      return () => {
        URL.revokeObjectURL(url)
        setPreviewUrl(null)
      }
    }
  }, [uploadedFile])

  /**
   * Handles file changes from the FileInput component
   */
  const handleFileChange = (files: FileInputChangeValue | null) => {
    // If files exists, try to extract the actual File object
    if (files) {
      // Extract the file from the files object
      let fileToUpload: File | null = null

      // Try to find the file in the most common locations
      if (files.rawFile instanceof File) {
        fileToUpload = files.rawFile
      } else if (files.files?.rawFile instanceof File) {
        fileToUpload = files.files.rawFile
      }

      setUploadedFile(fileToUpload)
    } else {
      setUploadedFile(null)
    }

    // Call the callback if provided
    if (onFileChange) {
      onFileChange()
    }

    setError(null) // Clear any previous error
  }

  /**
   * Handles file rejection when a non-image file is dropped
   */
  const handleDropRejected = () => {
    setError("Only image files are allowed.")
    notify("Only image files are allowed.", { type: "error" })
  }

  return {
    uploadedFile,
    previewUrl,
    error,
    handleFileChange,
    handleDropRejected,
    setError,
  }
}
