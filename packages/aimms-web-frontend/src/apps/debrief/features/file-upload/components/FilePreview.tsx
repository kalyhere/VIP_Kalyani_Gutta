import React from "react"
import { Card, CardContent, Paper, Typography, Fade, alpha, useTheme } from "@mui/material"
import { useDebriefStore } from "../../../stores"

export const FilePreview: React.FC = () => {
  const theme = useTheme()
  const preview = useDebriefStore((state) => state.preview)

  if (!preview) return null

  return (
    <Fade in>
      <Card sx={{ mb: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            📄 File Preview
          </Typography>
          <Paper
            sx={{
              maxHeight: 300,
              overflow: "auto",
              p: 2,
              backgroundColor: alpha("#000", 0.02),
              borderRadius: 2,
              border: `1px solid ${alpha("#000", 0.05)}`,
            }}>
            <Typography
              variant="body2"
              component="pre"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {preview}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    </Fade>
  )
}
