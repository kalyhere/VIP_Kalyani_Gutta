/**
 * ScoreAvatar Component
 * Displays a circular avatar with score and progress indicator
 */

import React from "react"
import { Box, Avatar, CircularProgress, alpha, useTheme } from "@mui/material"

export interface ScoreAvatarProps {
  score: number | null
  title: string | null | undefined
  size?: number
  showProgress?: boolean
}

export const ScoreAvatar: React.FC<ScoreAvatarProps> = ({
  score,
  title,
  size = 40,
  showProgress = true,
}) => {
  const theme = useTheme()

  const getScoreColor = (score: number | null) => {
    if (score === null) return theme.palette.text.disabled
    if (score >= 80) return theme.palette.secondary.light // Oasis (blue-green) for excellent
    if (score >= 70) return theme.palette.secondary.main // Azurite (blue) for good
    if (score >= 60) return theme.palette.primary.main // Arizona Red for needs improvement
    return theme.palette.primary.dark // Chili (dark red) for poor
  }

  const getFirstLetter = (title: string | null | undefined) => {
    if (!title) return "?"
    return title.charAt(0).toUpperCase()
  }

  const getAvatarColor = (title: string | null | undefined) => {
    if (!title) return theme.palette.text.disabled
    const colors = [theme.palette.primary.light, theme.palette.secondary.main, theme.palette.secondary.light, theme.palette.primary.dark]
    const index = title.charCodeAt(0) % colors.length
    return colors[index]
  }

  const scoreColor = getScoreColor(score)
  const avatarColor = getAvatarColor(title)
  const progressValue = score || 0

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      {/* Circular Progress Background */}
      {showProgress && (
        <CircularProgress
          variant="determinate"
          value={100}
          size={size + 8}
          thickness={3}
          sx={{
            color: alpha(scoreColor, 0.1),
            position: "absolute",
            top: -4,
            left: -4,
          }}
        />
      )}

      {/* Circular Progress Foreground */}
      {showProgress && score !== null && (
        <CircularProgress
          variant="determinate"
          value={progressValue}
          size={size + 8}
          thickness={3}
          sx={{
            color: scoreColor,
            position: "absolute",
            top: -4,
            left: -4,
            transform: "rotate(-90deg) !important",
          }}
        />
      )}

      {/* Avatar */}
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: alpha(scoreColor, 0.1),
          color: scoreColor,
          fontWeight: 700,
          fontSize: size * 0.35,
        }}>
        {score !== null ? Math.round(score) : "?"}
      </Avatar>
    </Box>
  )
}
