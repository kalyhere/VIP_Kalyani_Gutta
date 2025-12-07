import React from "react"
import { Box, Button, Chip, Paper, Typography, CircularProgress, alpha, useTheme } from "@mui/material"
import { UploadFile as UploadFileIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material"
import { useDebriefStore } from "../../../stores"

export const FileUploadPanel: React.FC = () => {
  const theme = useTheme()
  const selectedFile = useDebriefStore((state) => state.selectedFile)
  const uploading = useDebriefStore((state) => state.uploading)
  const uploadSuccess = useDebriefStore((state) => state.uploadSuccess)
  const generating = useDebriefStore((state) => state.generating)
  const setSelectedFile = useDebriefStore((state) => state.setSelectedFile)
  const setPreview = useDebriefStore((state) => state.setPreview)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      if (file.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsText(file)
      } else {
        setPreview(`Preview not available for ${file.type}`)
      }
    }
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha("#fff", 0.8)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
        📁 Upload Transcript File
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "stretch", sm: "center" },
        }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={uploading || generating}
          sx={{
            minHeight: 48,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
            },
          }}>
          {uploading ? "Uploading..." : "Choose File"}
          <input
            type="file"
            hidden
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileChange}
            aria-label="Select transcript file"
          />
        </Button>

        {selectedFile && (
          <Chip
            icon={<CheckCircleIcon />}
            label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`}
            color="primary"
            variant="outlined"
            sx={{ minWidth: 200 }}
          />
        )}
      </Box>
    </Paper>
  )
}
