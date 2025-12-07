import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material"
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from "@mui/icons-material"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalFaculty: number
  totalStudents: number
  totalCases: number
  publicCases: number
  activeSessions: number
  totalAssignments: number
  completedAssignments: number
  totalClasses: number
  recentLogins: number
  systemStatus: string
  trends: {
    userGrowth: number
    caseGrowth: number
    activeUsersGrowth: number
  }
}

interface SystemHealth {
  database: string
  sessions: string
  overall: string
  error_count: number
  last_check: string
}

export const SystemAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      // Fetch admin stats
      const statsResponse = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch analytics")
      }

      const statsData = await statsResponse.json()
      setAnalytics(statsData)

      // Fetch system health
      const healthResponse = await fetch(`${apiUrl}/api/admin/system-health`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!healthResponse.ok) {
        throw new Error("Failed to fetch system health")
      }

      const healthData = await healthResponse.json()
      setSystemHealth(healthData)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setError("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon color="success" />
    if (value < 0) return <TrendingDownIcon color="error" />
    return <TrendingFlatIcon color="disabled" />
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "success"
      case "warning":
        return "warning"
      case "error":
        return "error"
      default:
        return "default"
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        System Analytics & Health
      </Typography>

      {/* System Health */}
      {systemHealth && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Health Status
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Chip
                label={`Overall: ${systemHealth.overall.toUpperCase()}`}
                color={getHealthColor(systemHealth.overall)}
                variant="filled"
              />
              <Chip
                label={`Database: ${systemHealth.database.toUpperCase()}`}
                color={getHealthColor(systemHealth.database)}
                variant="outlined"
              />
              <Chip
                label={`Sessions: ${systemHealth.sessions.toUpperCase()}`}
                color={getHealthColor(systemHealth.sessions)}
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Last checked:
              {" "}
              {new Date(systemHealth.last_check).toLocaleString()}
            </Typography>
            {systemHealth.error_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {systemHealth.error_count} error sessions detected in the last hour
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Analytics */}
      {analytics && (
        <>
          {/* User Analytics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Analytics
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalUsers}</Typography>
                  <Typography color="text.secondary">Total Users</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {getTrendIcon(analytics.trends.userGrowth)}
                    <Typography variant="body2" color="text.secondary">
                      {analytics.trends.userGrowth > 0 ? "+" : ""}
                      {analytics.trends.userGrowth}% this month
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.activeUsers}</Typography>
                  <Typography color="text.secondary">Active Users (7 days)</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {getTrendIcon(analytics.trends.activeUsersGrowth)}
                    <Typography variant="body2" color="text.secondary">
                      {analytics.trends.activeUsersGrowth > 0 ? "+" : ""}
                      {analytics.trends.activeUsersGrowth}% this week
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalFaculty}</Typography>
                  <Typography color="text.secondary">Faculty</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalStudents}</Typography>
                  <Typography color="text.secondary">Students</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Content Analytics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content & Activity
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalCases}</Typography>
                  <Typography color="text.secondary">Medical Cases</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {getTrendIcon(analytics.trends.caseGrowth)}
                    <Typography variant="body2" color="text.secondary">
                      {analytics.trends.caseGrowth > 0 ? "+" : ""}
                      {analytics.trends.caseGrowth}% this month
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.publicCases}</Typography>
                  <Typography color="text.secondary">Public Cases</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalClasses}</Typography>
                  <Typography color="text.secondary">Classes</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.activeSessions}</Typography>
                  <Typography color="text.secondary">Active Sessions (24h)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Assignment Analytics */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assignment Progress
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.totalAssignments}</Typography>
                  <Typography color="text.secondary">Total Assignments</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.completedAssignments}</Typography>
                  <Typography color="text.secondary">Completed</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">
                    {analytics.totalAssignments > 0
                      ? Math.round(
                          (analytics.completedAssignments / analytics.totalAssignments) * 100
                        )
                      : 0}
                    %
                  </Typography>
                  <Typography color="text.secondary">Completion Rate</Typography>
                </Box>
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="h4">{analytics.recentLogins}</Typography>
                  <Typography color="text.secondary">Recent Logins (24h)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
