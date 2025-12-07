import { Paper, Box, Grid2 as Grid, Typography, Avatar, Chip, Alert, alpha,
  useTheme,
} from "@mui/material"
import {
  School as SchoolIcon,
  Group as GroupIcon,
  LocalHospital as CaseIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material"
import { motion } from "framer-motion"
import { FacultyUser, FacultyClass } from "@/types/faculty-types"

const MotionBox = motion(Box)

interface FacultyDashboardHeaderProps {
  facultyData: FacultyUser | null
  classes: FacultyClass[]
  selectedClass: FacultyClass | null
  isLoadingStats: boolean
  statsError: string | null
  getGreeting: () => string
  onClassSelect: (classData: FacultyClass) => void
  onStartAssignmentFlow: () => void
}

export const FacultyDashboardHeader = ({
  facultyData,
  classes,
  selectedClass,
  isLoadingStats,
  statsError,
  getGreeting,
  onClassSelect,
  onStartAssignmentFlow,
}: FacultyDashboardHeaderProps) => {
  const theme = useTheme()
  return (
  <Paper
    elevation={0}
    sx={{
      mb: 1.5,
      borderRadius: 2.5,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
      overflow: "hidden",
      flexShrink: 0,
      position: "relative",
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
    <Box sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
      <Grid container spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
        {/* Left Section - Enhanced Profile */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {isLoadingStats ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)} 25%, ${alpha(theme.palette.primary.light, 0.15)} 50%, ${alpha(theme.palette.primary.light, 0.1)} 75%)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  "@keyframes shimmer": {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                  },
                }}
              />
              <Box>
                <Box
                  sx={{
                    width: 160,
                    height: 18,
                    mb: 0.25,
                    borderRadius: 0.75,
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)} 25%, ${alpha(theme.palette.primary.light, 0.15)} 50%, ${alpha(theme.palette.primary.light, 0.1)} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
                <Box
                  sx={{
                    width: 90,
                    height: 12,
                    borderRadius: 0.75,
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.1)} 25%, ${alpha(theme.palette.primary.light, 0.15)} 50%, ${alpha(theme.palette.primary.light, 0.1)} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              </Box>
            </Box>
          ) : statsError ? (
            <Alert severity="error" sx={{ borderRadius: 1.5, py: 0.75 }}>
              {statsError}
            </Alert>
          ) : facultyData ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* Enhanced Avatar with Status Indicator */}
              <Box sx={{ position: "relative" }}>
                <Avatar
                  sx={{
                    width: { xs: 38, sm: 42 },
                    height: { xs: 38, sm: 42 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                    border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                    boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: `0 5px 16px ${alpha(theme.palette.primary.light, 0.25)}`,
                    },
                  }}>
                  <SchoolIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "white" }} />
                </Avatar>
                {/* Status Indicator */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0.5,
                    right: 0.5,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: theme.palette.secondary.light,
                    border: "2px solid white",
                    boxShadow: `0 1px 4px ${alpha(theme.palette.secondary.light, 0.4)}`,
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.secondary.light, 0.7)}` },
                      "70%": { boxShadow: `0 0 0 6px ${alpha(theme.palette.secondary.light, 0)}` },
                      "100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.secondary.light, 0)}` },
                    },
                  }}
                />
              </Box>

              {/* Enhanced Profile Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    mb: 0.125,
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                  {getGreeting()}
,
{facultyData.name.split(" ")[0]}
                </Typography>

                {/* Row 2: Role + Quick Action Pills */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
                    {facultyData.role.replace("Clinical ", "")}
                  </Typography>

                  <Chip
                    icon={<ScheduleIcon sx={{ fontSize: "0.75rem !important" }} />}
                    label={`${classes.reduce((total, cls) => total + cls.pendingReviews, 0)} Pending`}
                    size="small"
                    clickable
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontSize: "0.6rem",
                      height: 22,
                      "& .MuiChip-label": { px: 0.75 },
                      "& .MuiChip-icon": { ml: 0.5 },
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                    onClick={() => {
                      const urgentClass = classes.find((c) => c.pendingReviews > 0)
                      if (urgentClass) {
                        onClassSelect(urgentClass)
                      }
                    }}
                  />

                  <Chip
                    icon={<AssignmentIcon sx={{ fontSize: "0.75rem !important" }} />}
                    label="New Assignment"
                    size="small"
                    clickable
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.light, 0.08),
                      color: theme.palette.secondary.light,
                      border: `1px solid ${alpha(theme.palette.secondary.light, 0.2)}`,
                      fontSize: "0.6rem",
                      height: 22,
                      "& .MuiChip-label": { px: 0.75 },
                      "& .MuiChip-icon": { ml: 0.5 },
                      "&:hover": {
                        bgcolor: alpha(theme.palette.secondary.light, 0.12),
                      },
                    }}
                    onClick={() => {
                      if (selectedClass) {
                        onStartAssignmentFlow()
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ) : null}
        </Grid>

        {/* Right Section - Enhanced Stats Dashboard */}
        <Grid size={{ xs: 12, lg: 7 }}>
          {isLoadingStats ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: 1.25,
              }}>
              {[...Array(4)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.05)} 25%, ${alpha(theme.palette.primary.light, 0.1)} 50%, ${alpha(theme.palette.primary.light, 0.05)} 75%)`,
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    height: 55,
                  }}
                />
              ))}
            </Box>
          ) : statsError ? (
            <Alert severity="error" sx={{ borderRadius: 1.5, py: 0.75 }}>
              {statsError}
            </Alert>
          ) : facultyData ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: { xs: 1.25, sm: 1.5, lg: 2 },
              }}>
              {/* Enhanced Stat Cards */}
              {[
                {
                  label: "Students",
                  value: facultyData.stats.totalStudents,
                  icon: GroupIcon,
                  color: theme.palette.secondary.main,
                },
                {
                  label: "Active Cases",
                  value: facultyData.stats.activeCases,
                  icon: CaseIcon,
                  color: theme.palette.secondary.light,
                },
                {
                  label: "Completion",
                  value: `${facultyData.stats.averageCompletion}%`,
                  icon: TimelineIcon,
                  color: theme.palette.primary.main,
                },
                {
                  label: "Pending",
                  value: classes.reduce((total, cls) => total + cls.pendingReviews, 0),
                  icon: ScheduleIcon,
                  color: theme.palette.primary.dark,
                  urgent: classes.reduce((total, cls) => total + cls.pendingReviews, 0) > 5,
                },
              ].map((stat, index) => (
                <MotionBox
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.25 }}
                  sx={{
                    p: { xs: 1, sm: 1.25 },
                    borderRadius: 1.75,
                    background: "white",
                    border: `1px solid ${alpha(stat.color, 0.12)}`,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: `0 6px 20px ${alpha(stat.color, 0.15)}`,
                      borderColor: alpha(stat.color, 0.25),
                      "&::before": {
                        transform: "translateX(0)",
                      },
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.6)} 100%)`,
                      transform: "translateX(-100%)",
                      transition: "transform 0.3s ease-in-out",
                    },
                  }}>
                  {/* Horizontal Layout: Icon + Label + Value */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: { xs: 22, sm: 26 },
                        height: { xs: 22, sm: 26 },
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                        border: `1px solid ${alpha(stat.color, 0.15)}`,
                        flexShrink: 0,
                      }}>
                      <stat.icon
                        sx={{ color: stat.color, fontSize: { xs: "0.85rem", sm: "1rem" } }}
                      />
                    </Box>

                    {/* Label */}
                    <Typography
                      variant="overline"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        lineHeight: 1,
                        letterSpacing: 0.5,
                        flexGrow: 1,
                        minWidth: 0,
                      }}>
                      {stat.label}
                    </Typography>

                    {/* Value */}
                    <Typography
                      variant="h6"
                      sx={{
                        color: stat.color,
                        fontWeight: 800,
                        lineHeight: 1,
                        fontSize: { xs: "1.1rem", sm: "1.3rem" },
                        flexShrink: 0,
                      }}>
                      {stat.value}
                    </Typography>

                    {/* Urgent Indicator */}
                    {stat.urgent && (
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          bgcolor: theme.palette.primary.main,
                          animation: "pulse 2s infinite",
                          flexShrink: 0,
                          ml: 0.5,
                        }}
                      />
                    )}
                  </Box>
                </MotionBox>
              ))}
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  </Paper>
  )
}
