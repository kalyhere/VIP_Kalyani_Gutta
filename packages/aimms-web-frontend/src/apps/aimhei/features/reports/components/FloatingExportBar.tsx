/**
 * FloatingExportBar Component
 * Floating action bar for exporting selected reports
 */

import React from "react"
import { Paper, Typography, Button, CircularProgress, alpha, useTheme } from "@mui/material"
import CheckIcon from "@mui/icons-material/Check"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import { FlexCenterVertical } from "@/components/styled"

export interface FloatingExportBarProps {
  selectedCount: number
  exporting: boolean
  onExport: () => void
  onCancel: () => void
}

export const FloatingExportBar: React.FC<FloatingExportBarProps> = ({
  selectedCount,
  exporting,
  onExport,
  onCancel,
}) => {
  const theme = useTheme()

  if (selectedCount === 0) {
    return null
  }

  return (
    <Paper
    elevation={8}
    sx={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      px: 4,
      py: 2,
      borderRadius: 4,
      bgcolor: theme.palette.secondary.dark,
      color: theme.palette.background.paper,
      zIndex: 1300,
      boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.dark, 0.4)}`,
    }}>
    <FlexCenterVertical gap={3}>
      <CheckIcon sx={{ color: theme.palette.secondary.light, fontSize: 24 }} />
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
        Select reports above to export
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 500, fontSize: "0.9rem", color: alpha(theme.palette.background.paper, 0.8) }}>
        (
{selectedCount}
        {" "}
        selected)
</Typography>
      <Button
        variant="contained"
        onClick={onExport}
        disabled={exporting}
        startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
        sx={{
          bgcolor: theme.palette.secondary.light,
          color: theme.palette.background.paper,
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 2,
          px: 3,
          "&:hover": {
            bgcolor: theme.palette.secondary.main,
          },
          "&:disabled": {
            bgcolor: alpha(theme.palette.secondary.light, 0.5),
          },
        }}>
        {exporting ? "Exporting..." : "Export CSV"}
      </Button>
      <Button
        variant="text"
        onClick={onCancel}
        sx={{
          color: alpha(theme.palette.background.paper, 0.9),
          fontWeight: 500,
          textTransform: "none",
          "&:hover": {
            bgcolor: alpha(theme.palette.background.paper, 0.1),
          },
        }}>
        Cancel
      </Button>
    </FlexCenterVertical>
  </Paper>
  )
}
