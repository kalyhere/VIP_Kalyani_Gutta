import React, { useRef, useState, DragEvent } from "react"
import { Box, Typography, Button, alpha } from "@mui/material"
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material"

interface CustomFileInputProps {
  label: string
  accept?: Record<string, string[]>
  maxSize?: number
  onChange: (files: { rawFile: File; src: string; title: string } | null) => void
  onDropRejected?: () => void
  placeholder?: React.ReactNode
  error?: string | null
}

export const CustomFileInput: React.FC<CustomFileInputProps> = ({
  label,
  accept = { "image/*": [".png", ".jpg", ".jpeg"] },
  maxSize = 10_000_000,
  onChange,
  onDropRejected,
  placeholder,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const acceptedExtensions = Object.values(accept).flat()
  const acceptString = Object.keys(accept).join(",")

  const validateFile = (file: File): boolean => {
    // Check file size
    if (maxSize && file.size > maxSize) {
      onDropRejected?.()
      return false
    }

    // Check file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    const isValidType = acceptedExtensions.some((ext) => ext.toLowerCase() === fileExtension)

    if (!isValidType) {
      onDropRejected?.()
      return false
    }

    return true
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) {
      onChange(null)
      return
    }

    const file = files[0]
    if (validateFile(file)) {
      const fileData = {
        rawFile: file,
        src: URL.createObjectURL(file),
        title: file.name,
      }
      onChange(fileData)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event.target.files)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    handleFileChange(event.dataTransfer.files)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Box sx={{ my: 2, width: "100%" }}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>

      <Box
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          textAlign: "center",
          border: `2px dashed ${error ? "red" : isDragOver ? "#1976d2" : "#ccc"}`,
          borderRadius: 2,
          minHeight: 150,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          backgroundColor: isDragOver ? alpha("#1976d2", 0.04) : "transparent",
          "&:hover": {
            borderColor: error ? "red" : "#1976d2",
            backgroundColor: alpha("#1976d2", 0.02),
          },
        }}>
        {placeholder || (
          <>
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: error ? "error.main" : "text.secondary",
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                color: error ? "error.main" : "text.primary",
                mb: 1,
              }}>
              {error || "Drop a file here or click to select"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats:
              {" "}
              {acceptedExtensions.join(", ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max size:
              {" "}
              {Math.round(maxSize / (1024 * 1024))}
              MB
            </Typography>
          </>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
    </Box>
  )
}

export default CustomFileInput
