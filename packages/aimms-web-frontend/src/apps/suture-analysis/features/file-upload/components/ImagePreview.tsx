import React from "react"
import { Box, Typography } from "@mui/material"

interface ImagePreviewProps {
  previewUrl: string
  fileName: string
  onImageClick: (e: React.MouseEvent<HTMLImageElement>) => void
}

/**
 * Component to display a preview of the uploaded image
 */
const ImagePreview: React.FC<ImagePreviewProps> = ({ previewUrl, fileName, onImageClick }) => (
  <Box sx={{ textAlign: "center", mb: 2 }}>
    <Typography sx={{ color: "primary.main", mb: 1 }}>
      Uploaded:
      {fileName}
    </Typography>
    <img
      src={previewUrl}
      alt="Preview"
      style={{
        maxWidth: "100%",
        maxHeight: "300px",
        borderRadius: "4px",
        objectFit: "contain",
        cursor: "pointer",
      }}
      onClick={onImageClick}
    />
  </Box>
)

export default ImagePreview
