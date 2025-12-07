import React from "react"
import { Box, Typography, Card, CardContent } from "@mui/material"

export const AssignmentManagement: React.FC = () => (
  <Box>
    <Typography variant="h6" gutterBottom>
      Assignment Management
    </Typography>
    <Card>
      <CardContent>
        <Typography>
          Assignment management functionality will be implemented here. This will allow admins to
          view and manage case assignments across all classes and students.
        </Typography>
      </CardContent>
    </Card>
  </Box>
)
