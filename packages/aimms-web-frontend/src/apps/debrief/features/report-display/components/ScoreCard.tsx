import React from "react"
import { Box, Card, Typography, alpha, useTheme } from "@mui/material"
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material"
import type { EvaluationScore } from "../../../types"

interface ScoreCardProps {
  score: EvaluationScore
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const theme = useTheme()

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return theme.palette.secondary.main
    if (percentage >= 60) return theme.palette.secondary.light
    if (percentage >= 40) return "#FF9800"
    return theme.palette.primary.main
  }

  const getScoreIcon = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return <TrendingUpIcon />
    if (percentage >= 60) return <RemoveIcon />
    return <TrendingDownIcon />
  }

  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
        border: `1px solid ${alpha(getScoreColor(score.score, score.maxScore), 0.2)}`,
        backgroundColor: alpha(getScoreColor(score.score, score.maxScore), 0.02),
      }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
            {score.category}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: getScoreColor(score.score, score.maxScore),
                fontWeight: 700,
              }}>
              {score.score}/{score.maxScore}
            </Typography>
            {getScoreIcon(score.score, score.maxScore)}
          </Box>
        </Box>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: alpha(theme.palette.text.primary, 0.8),
          fontSize: "0.85rem",
          lineHeight: 1.4,
        }}>
        {score.comment}
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.text.primary, 0.6), fontSize: "0.75rem" }}>
          {score.score >= 4
            ? "Excellent"
            : score.score >= 3
              ? "Good"
              : score.score >= 2
                ? "Fair"
                : "Needs Improvement"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.text.primary, 0.6), fontSize: "0.75rem" }}>
          {Math.round((score.score / score.maxScore) * 100)}%
        </Typography>
      </Box>
    </Card>
  )
}
