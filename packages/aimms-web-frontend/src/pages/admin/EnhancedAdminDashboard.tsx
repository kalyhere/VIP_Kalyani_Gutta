import React, { useEffect, useMemo, useState } from "react"
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  Fade,
  Skeleton,
  Stack,
  useTheme,
  Avatar,
} from "@mui/material"
import { FlexCenterVertical, FlexRow, FlexColumn, FlexBetween } from "@/components/styled"
import {
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  NotificationsActive as NotificationIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material"
import { useAuthStore } from "@/stores/authStore"
import { useAdminData } from "./hooks/useAdminData"
import { MetricCard, ActivityFeed } from "@/features/analytics"
import { InviteUsers } from "./pages/InviteUsers"
import { ManageUsers } from "./pages/ManageUsers"
import { useLocation, useNavigate } from "react-router-dom"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    aria-labelledby={`admin-tab-${index}`}
    {...other}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
)

export const EnhancedAdminDashboard: React.FC = () => {
  const theme = useTheme()
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null
  const { stats, activities, loading, error, refreshData } = useAdminData()
  const [activeTab, setActiveTab] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  const tabKeyToIndex = useMemo(
    () => ({
      overview: 0,
      invite: 1,
      manage: 2,
    }),
    []
  )

  const tabIndexToKey = useMemo(() => ["overview", "invite", "manage"], [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabKey = params.get("tab")
    if (tabKey && tabKeyToIndex[tabKey as keyof typeof tabKeyToIndex] !== undefined) {
      const nextIndex = tabKeyToIndex[tabKey as keyof typeof tabKeyToIndex]
      if (nextIndex !== activeTab) {
        setActiveTab(nextIndex)
      }
    } else if (!tabKey && activeTab !== 0) {
      setActiveTab(0)
    }
  }, [location.search, tabKeyToIndex, activeTab])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)

    const key = tabIndexToKey[newValue] ?? "overview"
    const params = new URLSearchParams(location.search)

    if (key === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", key)
    }

    const searchString = params.toString()
    navigate(`${location.pathname}${searchString ? `?${searchString}` : ""}`, { replace: true })
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} lg={3} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={refreshData} sx={{ color: theme.palette.secondary.main }}>
          <RefreshIcon />
        </IconButton>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, position: "relative" }}>
      {/* Header */}
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            mb: 4,
            borderRadius: 2.5,
            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.dark, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
            },
          }}>
          <FlexBetween sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
            <FlexCenterVertical>
              <Avatar
                sx={{
                  width: { xs: 38, sm: 42 },
                  height: { xs: 38, sm: 42 },
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                  boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
                  mr: 1.5,
                }}>
                <DashboardIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "white" }} />
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    lineHeight: 1.1,
                    mb: 0.125,
                  }}>
                  AIMMS Dashboard
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: "0.8rem",
                  }}>
                  Welcome back,
                  {" "}
                  {identity?.fullName || identity?.email}
                </Typography>
              </Box>
            </FlexCenterVertical>
            <FlexCenterVertical sx={{ gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={refreshData} sx={{ color: theme.palette.secondary.main }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </FlexCenterVertical>
          </FlexBetween>
        </Paper>
      </Fade>

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
        }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              minHeight: 64,
            },
          }}>
          <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Invite Users" icon={<PersonAddIcon />} iconPosition="start" />
          <Tab label="Manage Users" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Virtual Patient" icon={<VirtualPatientIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {/* Overview Tab - Real Data Only */}
        <Grid container spacing={3}>
          {/* Left Side - Platform Status and App Stats */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              {/* Platform Status */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    p: 0,
                    background: "white",
                  }}>
                  {/* Header */}
                  <Box sx={{ p: 2.5, pb: 2 }}>
                    <FlexBetween>
                      <Box>
                        <Typography
                          variant="overline"
                          sx={{
                            color: theme.palette.secondary.main,
                            display: "block",
                            lineHeight: 1.2,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            mb: 0.5,
                            fontSize: "0.6875rem",
                            fontWeight: 500,
                          }}>
                          Platform Status
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: "1.25rem",
                            fontWeight: 600,
                          }}>
                          Platform Overview
                        </Typography>
                      </Box>
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label="OPERATIONAL"
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          height: 28,
                        }}
                      />
                    </FlexBetween>
                  </Box>

                  {/* Stats Grid */}
                  <Box sx={{ px: 3, pb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.1)}`,
                            },
                          }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.secondary.main,
                              mb: 0.5,
                              fontSize: "2.25rem",
                              lineHeight: 1,
                            }}>
                            {stats?.totalStudents || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                              fontSize: "0.8125rem",
                            }}>
                            Students
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.1)}`,
                            },
                          }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.error.main,
                              mb: 0.5,
                              fontSize: "2.25rem",
                              lineHeight: 1,
                            }}>
                            {stats?.totalFaculty || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                              fontSize: "0.8125rem",
                            }}>
                            Faculty
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.1)}`,
                            },
                          }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.secondary.main,
                              mb: 0.5,
                              fontSize: "2.25rem",
                              lineHeight: 1,
                            }}>
                            {stats?.activeSessions || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                              fontSize: "0.8125rem",
                            }}>
                            Active Sessions
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Box
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.1)}`,
                            },
                          }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.success.main,
                              mb: 0.5,
                              fontSize: "2.25rem",
                              lineHeight: 1,
                            }}>
                            {stats?.totalClasses || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                              fontSize: "0.8125rem",
                            }}>
                            Classes
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              {/* Application Stats */}
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    p: 2.5,
                    background: "white",
                  }}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: theme.palette.secondary.main,
                        display: "block",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        mb: 0.5,
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                      }}>
                      Applications
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: "1.25rem",
                        fontWeight: 600,
                      }}>
                      Application Statistics
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {/* AIMMS Web */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.secondary.main, fontWeight: 600, mb: 1 }}>
                          AIMMS Web
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Total Users
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.totalUsers || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Active (7d)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.activeUsers || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Recent Logins
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.recentLogins || 0}
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* MCC */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.error.main, fontWeight: 600, mb: 1 }}>
                          MCC (Medical Case Creator)
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Total Cases
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.totalCases || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Public Cases
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.publicCases || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Assignments
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.totalAssignments || 0}
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Virtual Patient */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.success.main, fontWeight: 600, mb: 1 }}>
                          Virtual Patient
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Active Sessions
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.activeSessions || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Completed
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.completedAssignments || 0}
                            </Typography>
                          </FlexBetween>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Classes
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              {stats?.totalClasses || 0}
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* AIMHEI */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.secondary.main, fontWeight: 600, mb: 1 }}>
                          AIMHEI
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Status
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              Coming Soon
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Suture Analysis */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1 }}>
                          Suture Analysis
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Status
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              Coming Soon
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Debrief */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
                          backgroundColor: "background.paper",
                          height: "100%",
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1 }}>
                          Debrief
                        </Typography>
                        <Stack spacing={1}>
                          <FlexBetween>
                            <Typography
                              variant="body2"
                              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                              Status
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                              Coming Soon
                            </Typography>
                          </FlexBetween>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Side - Activity Feed */}
          <Grid item xs={12} lg={4}>
            <ActivityFeed activities={activities} onRefresh={refreshData} maxHeight={800} />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Invite Users Tab */}
        <InviteUsers />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Manage Users Tab */}
        <ManageUsers />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Virtual Patient Cases Tab */}
        <ManageVirtualPatientCases />
      </TabPanel>
    </Container>
  )
}

export default EnhancedAdminDashboard
