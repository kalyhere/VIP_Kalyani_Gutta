import React from "react"
import { Alert, Button, Fade } from "@mui/material"
import { Error as ErrorIcon } from "@mui/icons-material"

interface ErrorDisplayProps {
  error: string | null
  onDismiss: () => void
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null

  return (
    <Fade in>
      <Alert
        severity="error"
        icon={<ErrorIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
        action={
          <Button color="inherit" size="small" onClick={onDismiss}>
            Dismiss
          </Button>
        }>
        {error}
      </Alert>
    </Fade>
  )
}
