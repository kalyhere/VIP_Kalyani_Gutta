/**
 * ErrorDisplay Component
 * Displays error messages with optional retry action
 */

import React from "react"
import { Alert, AlertTitle, Button } from "@mui/material"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"

export interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  title?: string
}

/**
 * ErrorDisplay component for showing errors
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, title }) => (
  <Alert
    severity="error"
    icon={<ErrorOutlineIcon />}
    action={
      onRetry ? (
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
    sx={{ borderRadius: 2 }}>
    {title && <AlertTitle>{title}</AlertTitle>}
    {error}
  </Alert>
)
