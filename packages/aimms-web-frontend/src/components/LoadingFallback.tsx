import React from "react"
import { Box, LinearProgress, Fade } from "@mui/material"

interface LoadingFallbackProps {
  message?: string
}

/**
 * Loading fallback component for lazy-loaded routes
 * Uses a subtle top progress bar instead of full-screen spinner
 * to prevent white flashing during route transitions
 */
export function LoadingFallback({ message = "Loading..." }: LoadingFallbackProps): JSX.Element {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }}>
        <LinearProgress />
      </Box>
    </Fade>
  )
}
