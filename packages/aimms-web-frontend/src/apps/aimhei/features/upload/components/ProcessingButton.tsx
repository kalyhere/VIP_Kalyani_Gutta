/**
 * ProcessingButton Component
 * Button for starting AIMHEI processing with loading state
 */

import React from "react"
import { Button, CircularProgress, useTheme } from "@mui/material"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"

export interface ProcessingButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  processing?: boolean // Alias for loading
  label?: string
}

/**
 * ProcessingButton component
 */
export const ProcessingButton: React.FC<ProcessingButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  processing = false,
  label = "Start Analysis",
}) => {
  const theme = useTheme()
  const isLoading = loading || processing
  return (
    <Button
      variant="contained"
      size="large"
      onClick={onClick}
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
      sx={{
        bgcolor: theme.palette.secondary.main,
        color: "white",
        py: 1.5,
        px: 4,
        fontSize: "1rem",
        fontWeight: 600,
        "&:hover": {
          bgcolor: theme.palette.secondary.dark,
        },
        "&:disabled": {
          bgcolor: theme.palette.divider,
          color: theme.palette.text.secondary,
        },
      }}>
      {isLoading ? "Processing..." : label}
    </Button>
  )
}
