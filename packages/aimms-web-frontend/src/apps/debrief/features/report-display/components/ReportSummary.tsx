import React from "react"
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Grid,
  Fade,
  alpha,
  useTheme,
} from "@mui/material"
import { Visibility as VisibilityIcon } from "@mui/icons-material"
import { useDebriefStore } from "../../../stores"
import { OverallScore } from "./OverallScore"
import { ScoreCard } from "./ScoreCard"

export const ReportSummary: React.FC = () => {
  const theme = useTheme()
  const parsedReport = useDebriefStore((state) => state.parsedReport)
  const setShowDetails = useDebriefStore((state) => state.setShowDetails)

  if (!parsedReport) return null

  return (
    <Fade in>
      <Card
        sx={{ mb: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}` }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
              📊 Evaluation Summary
            </Typography>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowDetails(true)}
              sx={{ borderRadius: 2 }}>
              View Full Report
            </Button>
          </Box>

          <OverallScore
            totalScore={parsedReport.totalScore}
            categoryCount={parsedReport.scores.length}
          />

          {/* Individual Scores */}
          <Grid container spacing={2}>
            {parsedReport.scores.map((score, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <ScoreCard score={score} />
              </Grid>
            ))}
          </Grid>

          {/* Summary Report */}
          {parsedReport.summaryReport && (
            <Box
              sx={{
                mt: 3,
                p: 3,
                backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                borderRadius: 2,
              }}>
              <Typography
                variant="h6"
                sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                📝 Summary
              </Typography>
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.8) }}>
                {parsedReport.summaryReport}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  )
}
