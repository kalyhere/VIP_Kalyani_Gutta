/**
 * ReportsList Component
 * Grid display of report cards
 */

import React from "react"
import { Grid, Box, Typography, CircularProgress, useTheme } from "@mui/material"
import AssessmentIcon from "@mui/icons-material/Assessment"
import { FlexCenter } from "@/components/styled"
import { ReportCard, ReportCardProps } from "./ReportCard"

export interface ReportsListProps {
  reports: ReportCardProps[] | any[] // Accept any report format that ReportCard can handle
  loading?: boolean
  onViewReport?: (reportId: number) => void
  onDeleteReport?: (reportId: number) => void
  onShareReport?: (reportId: number, shareData: any) => void
  onReportClick?: (reportId: number) => void
  onReportMenuClick?: (reportId: number, event: React.MouseEvent<HTMLElement>) => void
  selectedReportId?: number | null
  emptyMessage?: string
}

/**
 * ReportsList component
 */
export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  loading = false,
  onViewReport,
  onReportClick,
  onReportMenuClick,
  selectedReportId = null,
  emptyMessage = "No reports found",
}) => {
  const theme = useTheme()

  if (loading) {
    return (
      <FlexCenter sx={{ py: 8 }}>
        <CircularProgress />
      </FlexCenter>
    )
  }

  if (reports.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {reports.map((report) => {
        const reportId = report.reportId ?? report.report_id ?? 0
        return (
          <Grid item xs={12} md={6} lg={4} key={reportId}>
            <ReportCard
              {...report}
              onClick={
                onViewReport
                  ? () => onViewReport(reportId)
                  : onReportClick
                    ? () => onReportClick(reportId)
                    : undefined
              }
              onMenuClick={onReportMenuClick ? (e) => onReportMenuClick(reportId, e) : undefined}
              selected={selectedReportId === reportId}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}
