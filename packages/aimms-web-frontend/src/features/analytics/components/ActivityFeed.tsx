import React, { useState } from "react"
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  alpha,
  Stack,
  useTheme,
} from "@mui/material"
import {
  Assignment as AssignmentIcon,
  Login as LoginIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Circle as CircleIcon,
} from "@mui/icons-material"
import { ActivityItem, formatTimeAgo } from "@/pages/admin/hooks"

interface ActivityFeedProps {
  activities: ActivityItem[]
  onRefresh?: () => void
  maxHeight?: number
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  onRefresh,
  maxHeight = 600,
}) => {
  const theme = useTheme()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <LoginIcon sx={{ fontSize: 20 }} />
      case "case_created":
        return <MedicalIcon sx={{ fontSize: 20 }} />
      case "assignment":
        return <AssignmentIcon sx={{ fontSize: 20 }} />
      case "session":
        return <PsychologyIcon sx={{ fontSize: 20 }} />
      default:
        return <LoginIcon sx={{ fontSize: 20 }} />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "login":
        return theme.palette.secondary.light
      case "case_created":
        return theme.palette.primary.main
      case "assignment":
        return theme.palette.secondary.main
      case "session":
        return theme.palette.secondary.light
      default:
        return theme.palette.text.secondary
    }
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = searchTerm === ""
    activity.action.toLowerCase().includes(searchTerm.toLowerCase())
    activity.user.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || activity.type === filterType

    return matchesSearch && matchesFilter
  })

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "login", label: "Sessions" },
    { value: "case_created", label: "Cases Created" },
    { value: "assignment", label: "Assignments" },
  ]

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "white",
      }}>
      {/* Header */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
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
              Activity Feed
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                fontSize: "1.25rem",
                fontWeight: 600,
              }}>
              Recent Activity
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={activityTypes.find((t) => t.value === filterType)?.label}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              icon={<FilterIcon sx={{ fontSize: 16 }} />}
              sx={{
                height: 28,
                fontSize: "0.75rem",
                fontWeight: 500,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                },
              }}
            />
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh}>
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder="Search activity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: theme.palette.text.disabled }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white",
              fontSize: "0.875rem",
              borderRadius: 1.5,
              "& fieldset": {
                borderColor: theme.palette.divider,
              },
              "&:hover fieldset": {
                borderColor: theme.palette.text.secondary,
              },
              "& input": {
                py: 1,
              },
            },
          }}
        />
      </Box>

      {/* Activity List */}
      <Box sx={{ flex: 1, overflow: "auto", maxHeight, px: 2, pb: 2 }}>
        {filteredActivities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: theme.palette.text.disabled, fontSize: "0.875rem" }}>
              No recent activity
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredActivities.map((activity, index) => {
              const color = getActivityColor(activity.type)
              return (
                <ListItem
                  key={activity.id}
                  sx={{
                    px: 0,
                    py: 0,
                    mb: 1,
                  }}>
                  <Stack direction="row" spacing={2} sx={{ width: "100%", py: 1.5 }}>
                    {/* Icon with accent line */}
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-start",
                        pt: 0.25,
                      }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: alpha(color, 0.1),
                          border: `2px solid ${alpha(color, 0.2)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color,
                          position: "relative",
                          zIndex: 1,
                        }}>
                        {getActivityIcon(activity.type)}
                      </Box>
                      {/* Connecting line */}
                      {index < filteredActivities.length - 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: "50%",
                            top: 36,
                            transform: "translateX(-50%)",
                            width: 2,
                            height: "calc(100% + 12px)",
                            backgroundColor: theme.palette.divider,
                          }}
                        />
                      )}
                    </Box>

                    {/* Content */}
                    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          lineHeight: 1.4,
                        }}>
                        {activity.action}
                      </Typography>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ flexWrap: "wrap" }}>
                        <Chip
                          label={activity.user}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.6875rem",
                            fontWeight: 500,
                            backgroundColor: "white",
                            border: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
                            "& .MuiChip-label": {
                              px: 1,
                            },
                          }}
                        />
                        <CircleIcon sx={{ fontSize: 4, color: theme.palette.divider }} />
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: theme.palette.text.secondary,
                            fontWeight: 400,
                          }}>
                          {formatTimeAgo(activity.timestamp)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </ListItem>
              )
            })}
          </List>
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 0.5,
            boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.15)}`,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          },
        }}>
        {activityTypes.map((type) => (
          <MenuItem
            key={type.value}
            onClick={() => {
              setFilterType(type.value)
              setAnchorEl(null)
            }}
            selected={filterType === type.value}
            sx={{
              fontSize: "0.875rem",
              minWidth: 160,
            }}>
            {type.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  )
}

export default ActivityFeed
