import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip as MuiTooltip,
  alpha,
  Grid2 as Grid,
  useTheme,
} from "@mui/material"
import { motion, AnimatePresence } from "framer-motion"
import { SxProps, Theme } from "@mui/material/styles"
import { FacultyClass } from "@/types/faculty-types"

const MotionBox = motion(Box)

interface ClassListPanelProps {
  classes: FacultyClass[]
  selectedClass: FacultyClass | null
  isLoadingClasses: boolean
  leftMd: number
  mainView: "classList" | "classDetail" | "reportReview"
  selectedReportId: number | null
  onClassSelect: (classData: FacultyClass) => void
  fadeVariants: {
    hidden: { opacity: number }
    visible: { opacity: number; transition: { duration: number } }
    exit: { opacity: number; transition: { duration: number } }
  }
}

export const ClassListPanel = ({
  classes,
  selectedClass,
  isLoadingClasses,
  leftMd,
  mainView,
  selectedReportId,
  onClassSelect,
  fadeVariants,
}: ClassListPanelProps) => {
  const theme = useTheme()

  const isCollapsed = leftMd < 3

  return (
    <AnimatePresence initial={false}>
      {leftMd > 0 && (
        <Grid size={{ xs: 12, md: leftMd }} key="left-panel" sx={{ height: "100%" }}>
          <MotionBox
            sx={{
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit">
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                py: 2,
                px: 1.5,
              }}>
              <Box
                sx={{
                  py: 1,
                  px: 1.5,
                  mb: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  flexShrink: 0,
                }}>
                <Typography
                  variant="overline"
                  sx={{ color: theme.palette.primary.light, display: "block", lineHeight: 1.2 }}>
                  My Workspace
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "medium",
                      color: theme.palette.text.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title="Classes">
                    Classes
                  </Typography>
                  {!isLoadingClasses && classes.length > 0 && (
                    <Chip
                      label={`${classes.reduce((total, cls) => total + cls.pendingReviews, 0)} ${classes.reduce((total, cls) => total + cls.pendingReviews, 0) === 1 ? "Review" : "Reviews"}`}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{
                        fontSize: "0.65rem",
                        height: 20,
                        display: leftMd < 3 ? "none" : "flex",
                      }}
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "visible" }}>
                {isLoadingClasses ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
                    {[...Array(3)].map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.1,
                          ease: "easeOut",
                        }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: leftMd < 3 ? 1 : 1.5,
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.primary.light, 0.03),
                            border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                          }}>
                          {/* Avatar skeleton */}
                          <Box
                            sx={{
                              width: leftMd < 3 ? 28 : 36,
                              height: leftMd < 3 ? 28 : 36,
                              borderRadius: "50%",
                              backgroundColor: alpha(theme.palette.primary.light, 0.15),
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            {/* Title skeleton */}
                            <Box
                              sx={{
                                width: "80%",
                                height: 14,
                                backgroundColor: alpha(theme.palette.primary.light, 0.12),
                                borderRadius: 0.5,
                                mb: 0.75,
                              }}
                            />
                            {/* Subtitle skeleton */}
                            <Box
                              sx={{
                                width: "50%",
                                height: 10,
                                backgroundColor: alpha(theme.palette.primary.light, 0.08),
                                borderRadius: 0.5,
                              }}
                            />
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                ) : classes.length === 0 ? (
                  <Box
                    sx={{
                      p: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}>
                    <Typography variant="body2">No classes found</Typography>
                  </Box>
                ) : (
                  <List>
                    {classes.map((classData, index) => {
                      const isSelected = selectedClass?.id === classData.id
                      const hasUrgentReviews = classData.pendingReviews > 0

                      const listItemStyles: SxProps<Theme> = {
                        borderRadius: 1.5,
                        mb: 1,
                        mx: 1,
                        px: isCollapsed ? 0.75 : 1.5,
                        py: isCollapsed ? 1 : 1.25,
                        flexDirection: isCollapsed ? "column" : "row",
                        alignItems: isCollapsed ? "center" : "flex-start",
                        gap: isCollapsed ? 0 : 1.5,
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.light, 0.08)
                          : "transparent",
                        border: `1px solid ${isSelected ? theme.palette.primary.light : "transparent"}`,
                        boxShadow: isSelected
                          ? `0 0 0 1px ${alpha(theme.palette.primary.light, 0.2)}`
                          : "none",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          backgroundColor: isSelected
                            ? alpha(theme.palette.primary.light, 0.12)
                            : alpha(theme.palette.primary.light, 0.04),
                          borderColor: isSelected
                            ? theme.palette.primary.light
                            : alpha(theme.palette.primary.light, 0.3),
                        },
                        // Add keyframe animation for pulse effect
                        "@keyframes pulse": {
                          "0%": { opacity: 1, transform: "scale(1)" },
                          "50%": { opacity: 0.7, transform: "scale(1.2)" },
                          "100%": { opacity: 1, transform: "scale(1)" },
                        },
                      }

                      const avatarStyles: SxProps<Theme> = {
                        width: isCollapsed ? 28 : 36,
                        height: isCollapsed ? 28 : 36,
                        bgcolor: isSelected
                          ? theme.palette.primary.light
                          : alpha(theme.palette.primary.light, 0.15),
                        color: isSelected ? theme.palette.background.paper : theme.palette.primary.light,
                        fontSize: isCollapsed ? "0.7rem" : "0.9rem",
                        fontWeight: "bold",
                        mb: isCollapsed ? 0.5 : 0,
                        border: `2px solid ${isSelected ? theme.palette.primary.light : "transparent"}`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }

                      return (
                        <motion.div
                          key={classData.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1,
                            ease: "easeOut",
                          }}
                          whileHover={{
                            y: -2,
                            transition: { duration: 0.15, ease: "easeOut" },
                          }}
                          whileTap={{
                            scale: 0.995,
                            transition: { duration: 0.1 },
                          }}>
                          <ListItemButton
                            selected={isSelected}
                            onClick={() => {
                              if (selectedClass?.id === classData.id) {
                                if (mainView === "classDetail") return
                                if (mainView === "reportReview" && selectedReportId !== null) {
                                  return
                                }
                              }
                              onClassSelect(classData)
                            }}
                            sx={listItemStyles}>
                            <MuiTooltip
                              title={
                                isCollapsed
                                  ? `${classData.name} (${classData.studentCount} students, ${classData.pendingReviews} pending reviews)`
                                  : ""
                              }
                              placement="right">
                              <Avatar sx={avatarStyles}>
                                {classData.code.substring(0, 2).toUpperCase()}
                              </Avatar>
                            </MuiTooltip>

                            {isCollapsed && (
                              <>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: isSelected ? "bold" : "medium",
                                    fontSize: "0.65rem",
                                    lineHeight: 1.2,
                                    textAlign: "center",
                                    color: isSelected ? theme.palette.primary.light : "text.secondary",
                                    mt: 0.25,
                                  }}>
                                  {classData.code}
                                </Typography>
                                {hasUrgentReviews && (
                                  <Box
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: "50%",
                                      bgcolor: theme.palette.primary.main,
                                      mt: 0.25,
                                    }}
                                  />
                                )}
                              </>
                            )}

                            {!isCollapsed && (
                              <>
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: isSelected ? "bold" : "medium",
                                        color: isSelected ? theme.palette.primary.light : "text.primary",
                                        fontSize: "0.9rem",
                                        lineHeight: 1.3,
                                      }}>
                                      {classData.name}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.75,
                                        mt: 0.5,
                                        color: "text.secondary",
                                        fontSize: "0.7rem",
                                      }}>
                                      <span>{classData.term}</span>
                                      <span>
•{classData.studentCount}
{' '}
students
</span>
                                    </Typography>
                                  }
                                />
                                {hasUrgentReviews && (
                                  <ListItemIcon
                                    sx={{
                                      minWidth: "auto",
                                      ml: 1,
                                    }}>
                                    <Chip
                                      label={classData.pendingReviews}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        fontWeight: "bold",
                                        "& .MuiChip-label": { px: 0.75 },
                                        animation: hasUrgentReviews ? "pulse 2s infinite" : "none",
                                      }}
                                    />
                                  </ListItemIcon>
                                )}
                              </>
                            )}
                          </ListItemButton>
                        </motion.div>
                      )
                    })}
                  </List>
                )}
              </Box>

              {/* Quick Actions Footer - Only show when not collapsed */}
              {leftMd >= 3 && classes.length > 0 && (
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 1,
                    mt: 1,
                    flexShrink: 0,
                  }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Find first class with pending reviews
                        const urgentClass = classes.find((c) => c.pendingReviews > 0)
                        if (urgentClass) {
                          onClassSelect(urgentClass)
                        }
                      }}
                      disabled={!classes.some((c) => c.pendingReviews > 0)}
                      sx={{
                        fontSize: "0.65rem",
                        py: 0.5,
                        px: 1,
                        minWidth: "auto",
                        flexGrow: 1,
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        "&:hover": {
                          borderColor: theme.palette.primary.dark,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}>
                      Next Review
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </MotionBox>
        </Grid>
      )}
    </AnimatePresence>
  )
}
