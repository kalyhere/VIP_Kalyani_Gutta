/**
 * ProgressIndicator Component
 * Displays processing progress with percentage and visual bar
 */

import React from "react"
import { Box, LinearProgress, Typography, useTheme } from "@mui/material"

export interface ProgressIndicatorProps {
  progress: number
  message?: string
  jobId?: string | null
}

/**
 * ProgressIndicator component for showing analysis progress
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  jobId,
}) => {
  const theme = useTheme()

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          {message || "Processing..."}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>
          {Math.round(progress)}
%
</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: theme.palette.divider,
          "& .MuiLinearProgress-bar": {
            bgcolor: theme.palette.secondary.main,
            borderRadius: 4,
          },
        }}
      />
      {jobId && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ textAlign: "center", display: "block", mt: 0.5 }}>
          Job ID:
{' '}
{jobId}
        </Typography>
      )}
    </Box>
  )
}
