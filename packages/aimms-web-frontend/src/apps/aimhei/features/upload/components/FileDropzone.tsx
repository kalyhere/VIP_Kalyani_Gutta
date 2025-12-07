/**
 * FileDropzone Component
 * Presentational component for file upload with drag-and-drop support
 */

import React from "react"
import { Box, Paper, Typography, Button, alpha, IconButton, useTheme } from "@mui/material"
import FileIcon from "@mui/icons-material/InsertDriveFileOutlined"
import UploadIcon from "@mui/icons-material/CloudUploadOutlined"
import CloseIcon from "@mui/icons-material/Close"
import { FlexCenterVertical } from "@/components/styled"

// Theme constants
const typography = {
  h3: {
    fontFamily: '"Proxima Nova", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
  },
}

const spacing = {
  md: 2,
}

export interface FileDropzoneProps {
  file: File | null
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: () => void
  onRemove: () => void
  accept?: string
  maxSizeMB?: number
  title?: string
  subtitle?: string
  error?: string
}

/**
 * FileDropzone component for uploading files with drag-and-drop
 *
 * @example
 * ```tsx
 * <FileDropzone
 *   file={transcriptFile}
 *   isDragOver={isDragOver}
 *   onDragOver={handleDragOver}
 *   onDragLeave={handleDragLeave}
 *   onDrop={handleDrop}
 *   onFileSelect={handleFileSelect}
 *   onRemove={removeFile}
 *   accept=".txt"
 *   title="Transcript Upload"
 * />
 * ```
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  file,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemove,
  accept = ".txt",
  maxSizeMB,
  title = "File Upload",
  subtitle = "Drop file here",
  error,
}) => {
  const theme = useTheme()
  return (
  <Box>
    <Box sx={{ mb: spacing.md }}>
      <FlexCenterVertical gap={1} component={Typography} variant="h6" sx={{
        ...typography.h3,
        fontSize: "1rem",
        color: theme.palette.text.primary,
      }}>
        <UploadIcon sx={{ fontSize: 20 }} />
        {title}
      </FlexCenterVertical>
    </Box>

    {!file ? (
      <Box sx={{ textAlign: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            border: `2px dashed ${isDragOver ? theme.palette.secondary.main : theme.palette.divider}`,
            borderRadius: 2,
            cursor: "pointer",
            bgcolor: isDragOver ? alpha(theme.palette.secondary.main, 0.05) : "transparent",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: theme.palette.secondary.main,
              bgcolor: alpha(theme.palette.secondary.main, 0.02),
            },
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onFileSelect}>
          <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 2 }}>
              <FileIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              {subtitle}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
          or click to browse for
{' '}
{accept} file
          {maxSizeMB ? ` (max ${maxSizeMB}MB)` : ""}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              sx={{
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main,
                "&:hover": {
                  borderColor: theme.palette.text.primary,
                  bgcolor: alpha(theme.palette.secondary.main, 0.04),
                },
              }}>
              Select File
            </Button>
          </Box>
        </Paper>
      </Box>
    ) : (
      <Box sx={{ p: 2 }}>
        <FlexCenterVertical gap={2} sx={{
          bgcolor: alpha(theme.palette.secondary.main, 0.1),
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          p: 2,
        }}>
          <FileIcon sx={{ color: theme.palette.secondary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024).toFixed(1)}
{' '}
KB
</Typography>
          </Box>
          <IconButton onClick={onRemove} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </FlexCenterVertical>
      </Box>
    )}

    {/* Error message */}
    {error && (
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.primary.main,
            fontSize: "0.75rem",
            display: "block",
          }}>
          {error}
        </Typography>
      </Box>
    )}
  </Box>
  )
}
