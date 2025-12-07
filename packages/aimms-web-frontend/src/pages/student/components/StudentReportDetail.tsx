import React, { useState, useEffect } from "react"
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material"
import { FacultyReportDetail } from "@/pages/faculty/components"
import type { CompletedReportDetailItem } from "@/types/faculty-types"
import { getStudentReport } from "@/services/studentService"

interface StudentReportDetailProps {
  reportId: number
}

export const StudentReportDetail: React.FC<StudentReportDetailProps> = ({ reportId }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Just check if report exists, let FacultyReportDetail handle the actual data fetching
    const checkReport = async () => {
      try {
        setLoading(true)
        setError(null)
        await getStudentReport(reportId)
        // If we get here, the report exists
      } catch (err) {
        console.error("Failed to fetch student report:", err)
        setError("Failed to load report. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (reportId) {
      checkReport()
    }
  }, [reportId])

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading report...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  // Wrap FacultyReportDetail in a scrollable container
  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}>
      <FacultyReportDetail reportId={reportId} isFaculty={false} />
    </Box>
  )
}
