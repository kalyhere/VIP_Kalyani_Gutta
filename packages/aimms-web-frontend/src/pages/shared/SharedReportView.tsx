import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Box, Container, Typography, CircularProgress, Alert, Paper } from "@mui/material"
import { FacultyReportDetail } from "@/pages/faculty/components"
import { api } from "@/services/api"

/**
 * Public page for viewing shared AIMHEI reports
 * No authentication required - uses secure token from URL
 */
export const SharedReportView: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [reportData, setReportData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = React.useRef(false)

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) {
        setError("Invalid share link - no token provided")
        setLoading(false)
        return
      }

      // Prevent double-fetching in React StrictMode
      if (hasFetched.current) {
        return
      }
      hasFetched.current = true

      try {
        // Fetch report using the public endpoint (no auth required)
        // increment_view=true to count this as a unique view
        const response = await api.get(`/api/aimhei-reports/shared/${token}?increment_view=true`)
        setReportData(response.data)
        setLoading(false)
      } catch (err: any) {
        setLoading(false)
        if (err.response?.status === 403) {
          setError(err.response.data.detail || "This share link has expired or been deactivated")
        } else if (err.response?.status === 404) {
          setError("Share link not found or invalid")
        } else {
          setError("Failed to load report. Please try again later.")
        }
      }
    }

    fetchReport()
  }, [token])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
          Loading report...
        </Typography>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="body1" color="text.secondary">
            If you believe this is an error, please contact the person who shared this link with
          </Typography>
        </Paper>
      </Container>
    )
  }

  if (!reportData) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Failed to load report data</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Display the full report with pre-fetched data (no auth required) */}
      <FacultyReportDetail
        reportId={reportData.report_id}
        reportData={reportData}
        isFaculty={false} // Read-only mode
      />
    </Container>
  )
}
