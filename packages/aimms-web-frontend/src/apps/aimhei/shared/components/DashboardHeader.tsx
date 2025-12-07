/**
 * DashboardHeader Component
 * Header section for AIMHEI dashboard with profile and status chips
 */

import React from "react"
import { Paper, Box, Grid, Avatar, Typography, Chip, CircularProgress, alpha, useTheme } from "@mui/material"
import AnalyticsIcon from "@mui/icons-material/Analytics"
import CheckIcon from "@mui/icons-material/Check"
import { FlexCenterVertical, FlexRow } from "@/components/styled"

export interface DashboardHeaderProps {
  selectedReportId: number | null
  processing: boolean
  reportCount: number
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedReportId,
  processing,
  reportCount,
}) => {
  const theme = useTheme()

  return (
    <Paper
      className="page-header"
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 2.5,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
        },
      }}>
    <Box sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
      <Grid container spacing={1.5} alignItems="center">
        {/* Left Section - Enhanced Profile */}
        <Grid item xs={12} lg={5}>
          <FlexCenterVertical gap={1.5}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={{
                  width: { xs: 38, sm: 42 },
                  height: { xs: 38, sm: 42 },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
                  transition: "all 0.3s ease-in-out",
                }}>
                <AnalyticsIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "white" }} />
              </Avatar>
              {/* Status Indicator */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0.5,
                  right: 0.5,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: theme.palette.secondary.light,
                  border: "2px solid white",
                  boxShadow: `0 1px 4px ${alpha(theme.palette.secondary.light, 0.4)}`,
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: 0.125,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                AIMHEI Analysis Tool
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                Artificial Intelligence Medical History Evaluation Instrument
              </Typography>
            </Box>
          </FlexCenterVertical>
        </Grid>

        {/* Right Section - Status Chips */}
        <Grid item xs={12} lg={7}>
          <FlexRow justifyContent="flex-end" gap={1}>
            {selectedReportId && (
              <Chip
                icon={<CheckIcon sx={{ fontSize: "0.75rem !important" }} />}
                label="Report Selected"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: theme.palette.secondary.main,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  fontSize: "0.6rem",
                  height: 22,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
            {processing && (
              <Chip
                icon={<CircularProgress size={12} sx={{ color: theme.palette.secondary.main }} />}
                label="Processing..."
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  color: theme.palette.secondary.main,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  fontSize: "0.6rem",
                  height: 22,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
            {reportCount > 0 && (
              <Chip
                label={`${reportCount} Reports`}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.light, 0.08),
                  color: theme.palette.secondary.light,
                  border: `1px solid ${alpha(theme.palette.secondary.light, 0.2)}`,
                  fontSize: "0.6rem",
                  height: 22,
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            )}
          </FlexRow>
        </Grid>
      </Grid>
    </Box>
  </Paper>
  )
}
