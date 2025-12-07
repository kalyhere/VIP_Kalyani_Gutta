import React from "react"
import { Container, Box, CircularProgress, Typography, useTheme } from "@mui/material"

export const LoadingScreen: React.FC = () => {
  const theme = useTheme()

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={60} sx={{ color: theme.palette.secondary.main, mb: 2 }} />
        <Typography variant="h6" color={theme.palette.text.primary}>
          Connecting to Debrief Service...
        </Typography>
      </Box>
    </Container>
  )
}
