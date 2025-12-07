import React from "react"
import { Box, Paper, Typography, IconButton, Tooltip, alpha, useTheme } from "@mui/material"
import {
  IntegrationInstructions as IntegrationInstructionsIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"

interface DebriefHeaderProps {
  onRefresh: () => void
}

export const DebriefHeader: React.FC<DebriefHeaderProps> = ({ onRefresh }) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2.5,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
        },
      }}>
      <Box sx={{ display: "flex", alignItems: "center", p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box
          sx={{
            width: { xs: 48, sm: 52 },
            height: { xs: 48, sm: 52 },
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
          }}>
          <IntegrationInstructionsIcon sx={{ fontSize: { xs: 24, sm: 26 }, color: "white" }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              color: theme.palette.text.primary,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              mb: 0.5,
            }}>
            AI Debriefing Tool
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: alpha(theme.palette.text.primary, 0.8),
              fontSize: "0.95rem",
              fontWeight: 500,
            }}>
            Upload transcript files for AI-powered evaluation and feedback
          </Typography>
        </Box>
        <Tooltip title="Refresh connection">
          <IconButton onClick={onRefresh} sx={{ color: theme.palette.secondary.main }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  )
}
