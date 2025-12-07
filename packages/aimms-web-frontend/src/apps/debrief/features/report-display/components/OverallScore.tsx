import React from "react"
import { Box, Typography, alpha, useTheme } from "@mui/material"
import { Star as StarIcon } from "@mui/icons-material"

interface OverallScoreProps {
  totalScore: number
  categoryCount: number
}

export const OverallScore: React.FC<OverallScoreProps> = ({ totalScore, categoryCount }) => {
  const theme = useTheme()

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return theme.palette.secondary.main
    if (percentage >= 60) return theme.palette.secondary.light
    if (percentage >= 40) return "#FF9800"
    return theme.palette.primary.main
  }

  const renderStars = (score: number, maxScore: number) => {
    const stars = []
    for (let i = 1; i <= maxScore; i++) {
      stars.push(
        <StarIcon
          key={i}
          sx={{
            color: i <= score ? getScoreColor(score, maxScore) : alpha("#000", 0.2),
            fontSize: "1.2rem",
          }}
        />
      )
    }
    return stars
  }

  const averageScore = totalScore / categoryCount
  const maxScore = categoryCount * 5

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        backgroundColor: alpha(theme.palette.secondary.main, 0.05),
        borderRadius: 2,
      }}>
      <Typography
        variant="h4"
        sx={{ color: theme.palette.text.primary, fontWeight: 700, textAlign: "center", mb: 1 }}>
        {totalScore}/{maxScore}
      </Typography>
      <Typography
        variant="h6"
        sx={{ color: alpha(theme.palette.text.primary, 0.8), textAlign: "center", mb: 2 }}>
        Overall Score ({categoryCount} categories)
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
        {renderStars(Math.round(averageScore), 5)}
      </Box>
      <Typography
        variant="body2"
        sx={{ color: alpha(theme.palette.text.primary, 0.6), textAlign: "center", mt: 1 }}>
        Average: {averageScore.toFixed(1)}/5
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: alpha(theme.palette.text.primary, 0.5),
          textAlign: "center",
          mt: 1,
          display: "block",
        }}>
        Based on {categoryCount} evaluation categories
      </Typography>
    </Box>
  )
}
