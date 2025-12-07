import React from "react"
import { Box, Typography, Card, CardContent, Switch, FormControlLabel } from "@mui/material"

export const SystemSettings: React.FC = () => (
  <Box>
    <Typography variant="h6" gutterBottom>
      System Settings
    </Typography>

    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          General Settings
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Allow new user registrations"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable email notifications"
          />
          <FormControlLabel control={<Switch />} label="Maintenance mode" />
        </Box>
      </CardContent>
    </Card>
  </Box>
)
