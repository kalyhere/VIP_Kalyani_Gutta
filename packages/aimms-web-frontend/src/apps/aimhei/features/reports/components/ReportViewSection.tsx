/**
 * ReportViewSection Component
 *
 * Full-screen report view with back navigation
 */

import React from "react"
import { Box, Typography, Paper, Button, Divider, useTheme, alpha } from "@mui/material"
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { motion } from "framer-motion"
import { FlexCenterVertical, FlexColumn } from "@/components/styled"
import { FacultyReportDetail } from "@/pages/faculty/components"
import { typography, spacing } from "../../../shared/constants"

const MotionBox = motion.create(Box)

export interface ReportViewSectionProps {
  selectedReportId: number
  onBackToUpload: () => void
}

/**
 * ReportViewSection component - displays full report with navigation
 */
export const ReportViewSection: React.FC<ReportViewSectionProps> = ({
  selectedReportId,
  onBackToUpload,
}) => {
  const theme = useTheme()
  return (
  <MotionBox
    sx={{
      height: "100%",
      "@media print": {
        height: "auto",
        overflow: "visible",
      },
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}>
    <FlexColumn sx={{ height: "100%" }}>
      <Box
        sx={{
          p: spacing.lg,
          flexShrink: 0,
          pb: spacing.md,
        }}>
        <FlexCenterVertical justifyContent="space-between">
        <Box>
          <Typography
            variant="overline"
            sx={{
              ...typography.caption,
              color: theme.palette.secondary.main,
              display: "block",
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              mb: spacing.xs,
            }}>
            AIMHEI Report
          </Typography>
          <Typography
            variant="h6"
            sx={{
              ...typography.h3,
              color: theme.palette.text.primary,
            }}>
            Analysis Results
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBackToUpload}
          sx={{
            color: theme.palette.secondary.main,
            borderColor: theme.palette.divider,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              borderColor: theme.palette.secondary.main,
            },
          }}>
          Back to Upload
        </Button>
        </FlexCenterVertical>
      </Box>
      <Divider sx={{ mx: spacing.lg }} />
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          m: spacing.lg,
          mt: spacing.lg,
          borderRadius: 2,
          background: theme.palette.background.paper,
          "@media print": {
            overflow: "visible",
            height: "auto",
            minHeight: "auto",
          },
        }}>
        <FacultyReportDetail reportId={selectedReportId} isFaculty />
      </Box>
    </FlexColumn>
  </MotionBox>
  )
}
