import React from "react"
import { Box, Typography } from "@mui/material"
import { CustomFileInput } from "../../../../../components/CustomFileInput"
import { FileInputChangeValue } from "../hooks/useFileUpload"

interface FileUploaderProps {
  onChange: (files: FileInputChangeValue | null) => void
  onDropRejected: () => void
  error: string | null
}

/**
 * Component to handle file uploads
 */
const FileUploader: React.FC<FileUploaderProps> = ({ onChange, onDropRejected, error }) => {
  const handleFileChange = (fileData: { rawFile: File; src: string; title: string } | null) => {
    onChange(fileData)
  }

  return (
    <CustomFileInput
      label="Suture Image"
      accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
      maxSize={10_000_000}
      onChange={handleFileChange}
      onDropRejected={onDropRejected}
      error={error}
      placeholder={
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 150,
          }}>
          <Typography variant="h6" sx={{ color: error ? "error.main" : "inherit" }}>
            {error ?? "Drop a suture image to upload, or click to select it."}
          </Typography>
        </Box>
      }
    />
  )
}

export default FileUploader
