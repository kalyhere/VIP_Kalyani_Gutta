import React, { Component, ReactNode } from "react"
import { Box, Button, Typography, Paper } from "@mui/material"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary for lazy-loaded components
 * Provides retry functionality for failed code splits
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("LazyLoadErrorBoundary caught error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
          }}>
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: "center",
            }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Failed to Load Component
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error?.message || "An error occurred while loading this page."}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This might be due to a network issue or an outdated version of the app.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
              <Button variant="contained" color="primary" onClick={this.handleRetry}>
                Retry
              </Button>
              <Button variant="outlined" onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    return children
  }
}
