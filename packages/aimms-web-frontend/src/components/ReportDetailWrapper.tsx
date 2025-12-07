import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { CircularProgress, Box, Alert } from "@mui/material"
import { ReportDetail } from "@/features/reports"
import type { CompletedReportDetailItem } from "@/features/reports/components/ReportDetail"

export const ReportDetailWrapper: React.FC = () => {
  const params = useParams()
  const { reportId } = params
  const [reportData, setReportData] = useState<CompletedReportDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportData = async () => {
      if (!reportId) {
        setError("No report ID provided")
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem("auth_token")
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

        const response = await fetch(`${apiUrl}/api/aimhei-reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch report data")
        }

        const data = await response.json()
        setReportData(data)
      } catch (err) {
        console.error("Error fetching report:", err)
        setError(err instanceof Error ? err.message : "Failed to load report")
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [reportId])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!reportData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Report not found</Alert>
      </Box>
    )
  }

  return <ReportDetail mockReportDataSource={reportData} />
}
