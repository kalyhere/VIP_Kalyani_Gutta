import React from "react"
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material"
import {
  School as SchoolIcon,
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  ContentCut as CutIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"
import { AppMetrics } from "../../hooks/useAdminData"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon: React.ReactNode
  color: string
  action?: () => void
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  action,
}) => {
  const theme = useTheme()

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 2,
        transition: "all 0.3s ease",
        cursor: action ? "pointer" : "default",
        "&:hover": action
          ? {
              transform: "translateY(-2px)",
              boxShadow: `0 4px 20px ${alpha(color, 0.2)}`,
            }
          : {},
      }}
      onClick={action}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  backgroundColor: alpha(color, 0.1),
                  mr: 2,
                }}>
                {React.cloneElement(icon as React.ReactElement, {
                  sx: { fontSize: 24, color },
                })}
              </Box>
              {trend !== undefined && (
                <Chip
                  size="small"
                  icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${trend > 0 ? "+" : ""}${trend}%`}
                  sx={{
                    backgroundColor: alpha(trend > 0 ? theme.palette.success.main : theme.palette.error.main, 0.1),
                    color: trend > 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color,
              mb: 0.5,
            }}>
            {value}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: "text.primary",
              mb: subtitle ? 0.5 : 0,
            }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
              }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Tooltip title="View Details">
            <IconButton size="small">
              <LaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </CardContent>
  </Card>
  )
}

interface AIMmsWebCardProps {
  metrics: AppMetrics["aimmsWeb"]
}

const AIMmsWebCard: React.FC<AIMmsWebCardProps> = ({ metrics }) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
    }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <SchoolIcon sx={{ fontSize: 32, color: theme.palette.primary.light, mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.light }}>
            AIMMS Web Platform
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Core authentication and user management
          </Typography>
        </Box>
        <Chip
          size="small"
          label="ACTIVE"
          sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            fontWeight: 600,
          }}
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.light }}>
              {metrics.weeklyActiveUsers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Weekly Active
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
              {metrics.dailyLogins[metrics.dailyLogins.length - 1]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Today's Logins
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.light }}>
              {metrics.permissionChanges}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permission Updates
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CheckIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
            <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
              Healthy
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)

interface MCCCardProps {
  metrics: AppMetrics["mcc"]
}

const MCCCard: React.FC<MCCCardProps> = ({ metrics }) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.light, 0.04)} 100%)`,
    }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <MedicalIcon sx={{ fontSize: 32, color: theme.palette.secondary.main, mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
            Medical Case Creator
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Clinical case authoring and management
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
              {metrics.casesCreated}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cases
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.light }}>
              {metrics.casesEdited}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent Edits
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.light }}>
              {metrics.averageComplexity.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Complexity
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.secondary.main, fontWeight: 600 }}>
        Top Cases
      </Typography>
      <List dense sx={{ p: 0 }}>
        {metrics.popularCases.slice(0, 3).map((caseItem, index) => (
          <ListItem key={caseItem.id} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: 12,
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                }}>
                {index + 1}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={caseItem.title}
              secondary={`${caseItem.uses} uses`}
              primaryTypographyProps={{ variant: "body2", noWrap: true }}
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
)

interface VirtualPatientCardProps {
  metrics: AppMetrics["virtualPatient"]
}

const VirtualPatientCard: React.FC<VirtualPatientCardProps> = ({ metrics }) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${alpha(theme.palette.secondary.light, 0.2)}`,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.02)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
    }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <PsychologyIcon sx={{ fontSize: 32, color: theme.palette.secondary.light, mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.secondary.light }}>
            Virtual Patient
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Interactive clinical simulations
          </Typography>
        </Box>
        {metrics.activeSessions > 0 && (
          <Chip
            size="small"
            icon={<TimeIcon />}
            label={`${metrics.activeSessions} LIVE`}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.light }}>
              {metrics.completedSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed Today
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {metrics.diagnosisAccuracy.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diagnosis Accuracy
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Avg Session Time
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.light }}>
            {metrics.averageSessionTime.toFixed(1)} min
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(metrics.averageSessionTime / 45) * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.secondary.light, 0.1),
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.palette.secondary.light,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.secondary.light, fontWeight: 600 }}>
        Student Progress
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {metrics.studentProgress.slice(0, 5).map((student, index) => (
          <Tooltip key={student.studentId} title={`${student.progress}% complete`}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 12,
                bgcolor: alpha(
                  student.progress > 80
                    ? theme.palette.success.main
                    : student.progress > 60
                      ? theme.palette.secondary.light
                      : theme.palette.warning.main,
                  0.1
                ),
                color:
                  student.progress > 80
                    ? theme.palette.success.main
                    : student.progress > 60
                      ? theme.palette.secondary.light
                      : theme.palette.warning.main,
              }}>
              {student.progress}
            </Avatar>
          </Tooltip>
        ))}
      </Box>
    </CardContent>
  </Card>
)

interface OtherAppsCardProps {
  aimhei: AppMetrics["aimhei"]
  suture: AppMetrics["suture"]
}

const OtherAppsCard: React.FC<OtherAppsCardProps> = ({ aimhei, suture }) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
      borderRadius: 2,
    }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.light, mb: 3 }}>
        Other Applications
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 24, color: theme.palette.primary.dark, mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
              AIMHEI
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI-powered health education
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {aimhei.submissions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submissions
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {aimhei.averageScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Score
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {aimhei.completionRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completion
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CutIcon sx={{ fontSize: 24, color: theme.palette.warning.main, mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
              Suture Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Surgical skill assessment
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {suture.analyses}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Analyses
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {suture.averageScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Score
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                +{suture.improvementRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Improvement
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </CardContent>
  </Card>
)

export { MetricCard, AIMmsWebCard, MCCCard, VirtualPatientCard, OtherAppsCard }
