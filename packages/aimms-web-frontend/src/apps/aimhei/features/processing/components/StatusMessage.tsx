/**
 * StatusMessage Component
 * Displays status messages during processing
 */

import React from "react"
import { Alert, AlertColor, Box } from "@mui/material"

export interface StatusMessageProps {
  message: string
  severity?: AlertColor
  type?: AlertColor // Alias for severity
}

/**
 * StatusMessage component for displaying status updates
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  severity = "info",
  type,
}) => {
  const actualSeverity = type || severity
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity={actualSeverity}>
        {message}
      </Alert>
    </Box>
  )
}
