import React from "react"
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  PlayArrow,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"

interface Assignment {
  id: string
  title: string
  assignedDate: string
  dueDate: string
  faculty: {
    name: string
    email: string
  }
}

interface AssignedCasesProps {
  assignments: Assignment[]
  loading: boolean
  error: string | null
  onStartCase: (id: string) => void
}

export const AssignedCases: React.FC<AssignedCasesProps> = ({
  assignments,
  loading,
  error,
  onStartCase,
}) => {
  if (loading) {
    return (
      <Card sx={{ mb: 3, p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ mb: 3, p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Card>
    )
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: "flex",
            alignItems: "center",
            color: "#003366",
            borderBottom: "2px solid rgba(0, 51, 102, 0.1)",
            pb: 1,
            mb: 3,
          }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          Assigned Cases
        </Typography>

        {assignments.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
            <Typography>No cases assigned yet</Typography>
          </Box>
        ) : (
          assignments.map((assignment) => (
            <Paper
              key={assignment.id}
              elevation={3}
              sx={{
                mb: 2,
                overflow: "hidden",
                border: "1px solid rgba(0, 51, 102, 0.1)",
                borderRadius: 2,
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}>
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {assignment.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <Chip
                        size="small"
                        icon={<PersonIcon />}
                        label={assignment.faculty.email}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => onStartCase(assignment.id)}
                    sx={{
                      bgcolor: "#003366",
                      "&:hover": {
                        bgcolor: "#002244",
                      },
                    }}>
                    Launch Case
                  </Button>
                </Box>

                <Box sx={{ display: "flex", gap: 4, color: "text.secondary" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2">
                      Assigned:
                      {" "}
                      {new Date(assignment.assignedDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimerIcon fontSize="small" />
                    <Typography variant="body2">
                      Due:
                      {" "}
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </CardContent>
    </Card>
  )
}
