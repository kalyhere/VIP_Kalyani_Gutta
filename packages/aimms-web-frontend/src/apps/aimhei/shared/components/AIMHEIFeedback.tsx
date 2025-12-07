import React, { useState } from "react"
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Collapse,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Tooltip,
} from "@mui/material"
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as LocalHospitalIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material"

interface SectionScore {
  name: string
  correct: number
  incorrect: number
  total: number
  percentage: number
}

interface SkillScore {
  name: string
  score: number
  total: number
  details?: string
}

interface Feedback {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

interface SectionFeedback {
  title: string
  strengths: string[]
  weaknesses: string[]
  overall: string
}

export interface AIMHEIReport {
  date: string
  overallScore: number
  maxScore: number
  weightedPercentage: number
  proficiencyLevel: "excellent" | "good" | "fair" | "poor"
  informationSections: SectionScore[]
  skillSections: SkillScore[]
  sectionFeedback: SectionFeedback[]
  hasUnacceptablePerformance: boolean
}

interface AIMHEIFeedbackProps {
  report: AIMHEIReport
  onUpdateLearningObjectives?: (objectives: string[]) => void
  onUpdateSkillFocus?: (skills: string[]) => void
}

export const AIMHEIFeedback: React.FC<AIMHEIFeedbackProps> = ({
  report,
  onUpdateLearningObjectives,
  onUpdateSkillFocus,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showAllFeedback, setShowAllFeedback] = useState(false)

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "#4CAF50"
      case "good":
        return "#2196F3"
      case "fair":
        return "#FF9800"
      case "poor":
        return "#F44336"
      default:
        return "#757575"
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "#4CAF50"
    if (percentage >= 75) return "#2196F3"
    if (percentage >= 60) return "#FF9800"
    return "#F44336"
  }

  const handleExpandSection = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName)
  }

  const generateActionItems = () => {
    const actionItems = new Set<string>()

    // Add items based on weak sections
    report.informationSections
      .filter((section) => section.percentage < 70)
      .forEach((section) => {
        actionItems.add(`Review ${section.name.toLowerCase()} techniques and best practices`)
      })

    // Add items based on skill scores
    report.skillSections
      .filter((skill) => skill.score / skill.total < 0.7)
      .forEach((skill) => {
        actionItems.add(`Practice ${skill.name.toLowerCase()} skills`)
      })

    // Add specific recommendations from feedback
    report.sectionFeedback.forEach((section) => {
      section.weaknesses.forEach((weakness) => {
        actionItems.add(weakness)
      })
    })

    return Array.from(actionItems)
  }

  return (
    <Card sx={{ mb: 3, position: "relative", overflow: "visible" }}>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            pb: 2,
            borderBottom: "2px solid rgba(171, 5, 32, 0.1)",
          }}>
          <Box>
            <Typography variant="h5" sx={{ color: "#0C234B", fontWeight: "bold", mb: 1 }}>
              AIMHEI Performance Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluation Date:
              {" "}
              {report.date}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Chip
              label={`${report.weightedPercentage}%`}
              sx={{
                bgcolor: getProficiencyColor(report.proficiencyLevel),
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "bold",
                mb: 1,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: getProficiencyColor(report.proficiencyLevel),
                fontWeight: "medium",
              }}>
              {report.proficiencyLevel.toUpperCase()} Proficiency
            </Typography>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(12, 35, 75, 0.05)",
                height: "100%",
              }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Information Sections Performance
              </Typography>
              {report.informationSections.map((section) => (
                <Box key={section.name} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption">{section.name}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: getScoreColor(section.percentage),
                        fontWeight: "bold",
                      }}>
                      {section.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={section.percentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreColor(section.percentage),
                      },
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(171, 5, 32, 0.05)",
                height: "100%",
              }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Clinical Skills Assessment
              </Typography>
              {report.skillSections.map((skill) => (
                <Box key={skill.name} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption">{skill.name}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: getScoreColor((skill.score / skill.total) * 100),
                        fontWeight: "bold",
                      }}>
                      {skill.score}/{skill.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(skill.score / skill.total) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getScoreColor((skill.score / skill.total) * 100),
                      },
                    }}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Action Items */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            background: "linear-gradient(45deg, #0C234B, #1E5288)",
            color: "white",
          }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon />
            Recommended Actions
          </Typography>
          <List dense>
            {generateActionItems().map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ArrowUpwardIcon sx={{ color: "white" }} />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  sx={{
                    "& .MuiListItemText-primary": {
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "0.9rem",
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
          {onUpdateLearningObjectives && (
            <Button
              variant="contained"
              size="small"
              sx={{
                mt: 2,
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.2)",
                },
              }}
              onClick={() => onUpdateLearningObjectives(generateActionItems())}>
              Update Learning Objectives
            </Button>
          )}
        </Paper>

        {/* Detailed Feedback Sections */}
        {report.sectionFeedback.map((section) => (
          <Paper
            key={section.title}
            sx={{
              mb: 2,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.1)",
              "&:last-child": { mb: 0 },
            }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                bgcolor:
                  expandedSection === section.title ? "rgba(12, 35, 75, 0.05)" : "transparent",
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: "rgba(12, 35, 75, 0.05)",
                },
              }}
              onClick={() => handleExpandSection(section.title)}>
              <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                {section.title}
              </Typography>
              <IconButton
                size="small"
                sx={{
                  transform: expandedSection === section.title ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>
                <ExpandMoreIcon />
              </IconButton>
            </Box>
            <Collapse in={expandedSection === section.title}>
              <Box sx={{ p: 2, pt: 0 }}>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Strengths
                    </Typography>
                    <List dense>
                      {section.strengths.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Areas for Improvement
                    </Typography>
                    <List dense>
                      {section.weaknesses.map((weakness, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={weakness} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Overall Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.overall}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Paper>
        ))}

        {report.hasUnacceptablePerformance && (
          <Paper
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "error.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}>
            <ErrorIcon />
            <Typography variant="body1">
              Some areas require immediate attention. Please consult with your advisor for
              additional support.
            </Typography>
          </Paper>
        )}
      </CardContent>
    </Card>
  )
}
