import React from "react"
import { Alert, Typography, Fade } from "@mui/material"
import { CheckCircleOutline as CheckCircleOutlineIcon } from "@mui/icons-material"
import type { HealthData } from "../../types"

interface HealthStatusProps {
  healthData: HealthData | null
}

export const HealthStatus: React.FC<HealthStatusProps> = ({ healthData }) => {
  if (!healthData) return null

  return (
    <Fade in>
      <Alert
        severity="success"
        icon={<CheckCircleOutlineIcon />}
        sx={{ mb: 3, borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>Service Status:</strong> {healthData.status} - Ready to process files
        </Typography>
      </Alert>
    </Fade>
  )
}
