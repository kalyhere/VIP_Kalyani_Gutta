import React, { useState, useMemo } from "react"
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  alpha,
  useTheme,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  IconButton,
} from "@mui/material"
import { MaterialReactTable, type MRT_ColumnDef, type MRT_ColumnHelper } from "material-react-table"
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Layers as GroupingIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  Quiz as InformationIcon,
  Psychology as SkillsIcon,
  Link as LinkIcon,
} from "@mui/icons-material"

interface RubricItem {
  output: string | null
  criteria: string | null
  explanation: string | null
  line_nums: number[]
  lines: string[]
  section_title: string | null
}

export interface RubricDataGridProps {
  rubricData: RubricItem[]
  onRubricUpdate?: (updatedRubric: RubricItem[]) => void
  onFinalizeReview?: () => void
  isFaculty: boolean
  strengths_weaknesses?: {
    [sectionTitle: string]: { strengths: string; weaknesses: string; coaching_tips: string }
  } | null
  onJumpToImprovement?: (sectionTitle: string) => void
}

// Helper function to group rubric data by sections
const groupRubricBySection = (rubricData: RubricItem[]) => {
  const grouped: { [key: string]: RubricItem[] } = {}
  rubricData.forEach((item) => {
    if (item.section_title) {
      if (!grouped[item.section_title]) {
        grouped[item.section_title] = []
      }
      grouped[item.section_title].push(item)
    }
  })
  return grouped
}

// Helper function to calculate section scores
const calculateSectionScore = (items: RubricItem[]) => {
  const nonScoringItems = items.filter(
    (item) =>
      item.criteria &&
      !item.criteria.includes("Scoring") &&
      (item.output === "YES" || item.output === "NO")
  )

  const correct = nonScoringItems.filter((item) => item.output === "YES").length
  const total = nonScoringItems.length
  const percentage = total > 0 ? (correct / total) * 100 : 0

  return { correct, incorrect: total - correct, total, percentage }
}

// Helper function to calculate skill scores
const calculateSkillScores = (rubricData: RubricItem[]) => {
  let medicalTermScore = 0
  let politenessScore = 0
  let empathyScore = 0

  rubricData.forEach((item) => {
    if (item.criteria === "Medical Terminology Scoring") {
      const yMatch = item.output?.match(/Y:(\d+)/i)
      const nMatch = item.output?.match(/N:(\d+)/i)
      if (yMatch && nMatch) {
        const yes = parseInt(yMatch[1])
        const no = parseInt(nMatch[1])
        const total = yes + no
        medicalTermScore = total > 0 ? (yes / total) * 100 : 0
      }
    } else if (item.criteria === "Politeness Scoring") {
      const match = item.output?.match(/AVG:([\d.]+)/i)
      politenessScore = match ? parseFloat(match[1]) * 10 : 0
    } else if (item.criteria === "Empathy Scoring") {
      const match = item.output?.match(/AVG:([\d.]+)/i)
      empathyScore = match ? parseFloat(match[1]) * 10 : 0
    }
  })

  const averageScore = (medicalTermScore + politenessScore + empathyScore) / 3

  return {
    medicalTerminology: medicalTermScore,
    politeness: politenessScore,
    empathy: empathyScore,
    average: averageScore,
  }
}

// Helper function to get score color
const getScoreColor = (score: number) => {
  if (score >= 90) return "success.main"
  if (score >= 70) return "warning.main"
  return "error.main"
}

// Helper function to strip section prefix
const stripSectionPrefix = (title: string | null): string => {
  if (!title) return ""
  return title.replace(/^Section \d+:\s*/, "")
}

const RubricDataGrid: React.FC<RubricDataGridProps> = ({
  rubricData,
  onRubricUpdate,
  onFinalizeReview,
  isFaculty,
  strengths_weaknesses,
  onJumpToImprovement,
}) => {
  const theme = useTheme()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const handleSkillScoreChange = (
    index: number,
    value: number,
    type: "medical" | "politeness" | "empathy"
  ) => {
    const updated = rubricData.map((item, i) => {
      if (i !== index) return item
      if (type === "medical") {
        const yes = Math.max(0, Math.min(10, Math.round(value)))
        const no = 10 - yes
        return { ...item, output: `Y:${yes}/N:${no}` }
      }
      if (type === "politeness" || type === "empathy") {
        const avg = Math.max(0, Math.min(10, Math.round(value * 10) / 10))
        const sdMatch = item.output && item.output.match(/SD:([\d.]+)/i)
        const sd = sdMatch ? sdMatch[1] : "1.0"
        return { ...item, output: `AVG:${avg}/SD:${sd}` }
      }
      return item
    })
    onRubricUpdate && onRubricUpdate(updated)
  }

  const handleOutputChange = (index: number, newValue: string) => {
    const updatedData = [...rubricData]
    updatedData[index] = {
      ...updatedData[index],
      output: newValue,
    }
    onRubricUpdate?.(updatedData)
  }

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((key) => key !== sectionKey) : [...prev, sectionKey]
    )
  }

  // Add expand/collapse all handlers
  const expandAllInformationSections = () => {
    const informationSectionKeys = Object.keys(groupRubricBySection(rubricData)).filter(
      (key) => !key.toLowerCase().includes("skill")
    )
    setExpandedSections((prev) => {
      const newExpanded = [...prev]
      informationSectionKeys.forEach((key) => {
        if (!newExpanded.includes(key)) {
          newExpanded.push(key)
        }
      })
      return newExpanded
    })
  }

  const collapseAllInformationSections = () => {
    const informationSectionKeys = Object.keys(groupRubricBySection(rubricData)).filter(
      (key) => !key.toLowerCase().includes("skill")
    )
    setExpandedSections((prev) => prev.filter((key) => !informationSectionKeys.includes(key)))
  }

  const expandAllSkillsSections = () => {
    const skillKeys = ["skill-medical-terminology", "skill-politeness", "skill-empathy"]
    setExpandedSections((prev) => {
      const newExpanded = [...prev]
      skillKeys.forEach((key) => {
        if (!newExpanded.includes(key)) {
          newExpanded.push(key)
        }
      })
      return newExpanded
    })
  }

  const collapseAllSkillsSections = () => {
    setExpandedSections((prev) => prev.filter((key) => !key.startsWith("skill-")))
  }

  const toggleSkillSection = (skillType: string) => {
    const skillKey = `skill-${skillType}`
    setExpandedSections((prev) =>
      prev.includes(skillKey) ? prev.filter((key) => key !== skillKey) : [...prev, skillKey]
    )
  }

  // Group data and calculate scores
  const groupedRubric = groupRubricBySection(rubricData)
  const skillScores = calculateSkillScores(rubricData)

  // Separate information and skill sections
  const informationSections = Object.entries(groupedRubric).filter(
    ([key]) => !key.toLowerCase().includes("skill")
  )
  const skillItems = rubricData.filter((item) => item.criteria && item.criteria.includes("Scoring"))

  // Calculate overall information score
  const allInformationItems = informationSections.flatMap(([_, items]) => items)
  const overallInfoScore = calculateSectionScore(allInformationItems)

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}>
      {/* Information Section */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}>
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.secondary.main, 0.05),
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <InformationIcon sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="h6" fontWeight="medium">
              Information Section
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                minWidth: 120,
              }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {overallInfoScore.correct}
                /{overallInfoScore.total}
                {" "}
                Correct
</Typography>
              <LinearProgress
                variant="determinate"
                value={overallInfoScore.percentage}
                sx={{
                  width: 80,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.divider, 0.3),
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      overallInfoScore.percentage >= 90
                        ? "success.main"
                        : overallInfoScore.percentage >= 70
                          ? "warning.main"
                          : "error.main",
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
            <Chip
              label={`${overallInfoScore.percentage.toFixed(1)}%`}
              sx={{
                fontWeight: "bold",
                color: "white",
                bgcolor:
                  overallInfoScore.percentage >= 90
                    ? "success.main"
                    : overallInfoScore.percentage >= 70
                      ? "warning.main"
                      : "error.main",
              }}
            />
          </Box>
        </Box>

        <TableContainer
          sx={{
            overflowX: "auto",
          }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", minWidth: 200 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 0 }}>
                      <Tooltip title="Expand All Sections">
                        <IconButton
                          size="small"
                          onClick={expandAllInformationSections}
                          sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                          <ExpandAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Collapse All Sections">
                        <IconButton
                          size="small"
                          onClick={collapseAllInformationSections}
                          sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                          <CollapseAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    Section
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 80 }} align="center">
                  Correct
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 80 }} align="center">
                  Incorrect
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 60 }} align="center">
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 100 }} align="center">
                  Percentage
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {informationSections.map(([sectionTitle, items]) => {
                const sectionScore = calculateSectionScore(items)
                const isExpanded = expandedSections.includes(sectionTitle)

                return (
                  <React.Fragment key={sectionTitle}>
                    <TableRow
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: "white",
                      }}
                      onClick={() => toggleSection(sectionTitle)}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ExpandMoreIcon
                            sx={{
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                              fontSize: "1rem",
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {stripSectionPrefix(sectionTitle)}
                          </Typography>
                          {strengths_weaknesses && strengths_weaknesses[sectionTitle] && (
                            <Box
                              onClick={(e) => {
                                e.stopPropagation()
                                onJumpToImprovement?.(sectionTitle)
                              }}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                ml: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                cursor: "pointer",
                                transition: "all 0.2s",
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                },
                              }}>
                              <LinkIcon sx={{ fontSize: "0.875rem", color: theme.palette.secondary.main }} />
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.secondary.main, fontWeight: "medium" }}>
                                View Feedback
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {sectionScore.correct}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {sectionScore.incorrect}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {sectionScore.total}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ color: getScoreColor(sectionScore.percentage) }}>
                          {sectionScore.percentage.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <>
                        {/* Sub-header row for expanded details */}
                        <TableRow
                          sx={{
                            bgcolor: "#E8F0F7",
                          }}>
                          <TableCell
                            sx={{
                              pl: 4,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Criteria
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Output
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Explanation
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Source Lines
                          </TableCell>
                          <TableCell />
                        </TableRow>

                        {/* Detailed criteria rows */}
                        {items
                          .filter((item) => !item.criteria?.includes("Scoring"))
                          .map((item, index) => (
                            <TableRow
                              key={index}
                              sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                              <TableCell sx={{ pl: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {item.criteria}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {isFaculty ? (
                                  <Checkbox
                                    checked={item.output === "YES"}
                                    onChange={(e) =>
                                      handleOutputChange(
                                      rubricData.indexOf(item),
                                      e.target.checked ? "YES" : "NO"
                                      )
                                    }
                                    size="small"
                                    color="success"
                                  />
                                ) : item.output === "YES" ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <CancelIcon color="error" fontSize="small" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                                  {item.explanation}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}>
                                  {Array.isArray(item.lines) ? item.lines.join("\n") : item.lines}
                                </Typography>
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                      </>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Skills Section */}
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}>
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.secondary.light, 0.05),
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <SkillsIcon sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="h6" fontWeight="medium">
              Skills Section
            </Typography>
          </Box>
          <Chip
            label={`${skillScores.average.toFixed(1)}%`}
            sx={{
              fontWeight: "bold",
              color: "white",
              bgcolor:
                skillScores.average >= 90
                  ? "success.main"
                  : skillScores.average >= 70
                    ? "warning.main"
                    : "error.main",
            }}
          />
        </Box>

        <TableContainer
          sx={{
            overflowX: "auto",
          }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", minWidth: 150 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 0 }}>
                      <Tooltip title="Expand All Skills">
                        <IconButton
                          size="small"
                          onClick={expandAllSkillsSections}
                          sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                          <ExpandAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Collapse All Skills">
                        <IconButton
                          size="small"
                          onClick={collapseAllSkillsSections}
                          sx={{ color: theme.palette.secondary.main, p: 0.25 }}>
                          <CollapseAllIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="inherit">Component</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 80 }} align="center">
                  Score
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", minWidth: 100 }} align="center">
                  Percentage
                </TableCell>
                {isFaculty && (
                  <TableCell sx={{ fontWeight: "bold", minWidth: 100 }} align="center">
                    Edit
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {skillItems.map((item, index) => {
                let score = 0
                let label = ""
                let maxScore = 10
                let skillType = ""

                if (item.criteria === "Medical Terminology Scoring") {
                  const yMatch = item.output?.match(/Y:(\d+)/i)
                  const nMatch = item.output?.match(/N:(\d+)/i)
                  if (yMatch && nMatch) {
                    score = parseInt(yMatch[1])
                    maxScore = score + parseInt(nMatch[1])
                  }
                  label = "Medical Terminology"
                  skillType = "medical-terminology"
                } else if (item.criteria === "Politeness Scoring") {
                  const match = item.output?.match(/AVG:([\d.]+)/i)
                  score = match ? parseFloat(match[1]) : 0
                  label = "Politeness"
                  skillType = "politeness"
                } else if (item.criteria === "Empathy Scoring") {
                  const match = item.output?.match(/AVG:([\d.]+)/i)
                  score = match ? parseFloat(match[1]) : 0
                  label = "Empathy"
                  skillType = "empathy"
                }

                const percentage = (score / maxScore) * 100
                const isExpanded = expandedSections.includes(`skill-${skillType}`)

                return (
                  <React.Fragment key={index}>
                    <TableRow
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: "white",
                      }}
                      onClick={() => toggleSkillSection(skillType)}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ExpandMoreIcon
                            sx={{
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                              fontSize: "1rem",
                            }}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {score.toFixed(item.criteria === "Medical Terminology Scoring" ? 0 : 1)}/
                          {maxScore}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ color: getScoreColor(percentage) }}>
                          {percentage.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      {isFaculty && (
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <TextField
                            type="number"
                            size="small"
                            value={score}
                            onChange={(e) => {
                              const type =
                                item.criteria === "Medical Terminology Scoring"
                                ? "medical"
                                : item.criteria === "Politeness Scoring"
                                  ? "politeness"
                                  : "empathy"
                              handleSkillScoreChange(
                                rubricData.indexOf(item),
                                parseFloat(e.target.value),
                                type
                              )
                            }}
                            inputProps={{
                              min: 0,
                              max: 10,
                              step: item.criteria === "Medical Terminology Scoring" ? 1 : 0.1,
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                      )}
                    </TableRow>

                    {isExpanded && (
                      <>
                        {/* Sub-header row for expanded details */}
                        <TableRow
                          sx={{
                            bgcolor: "#E8F5F0",
                          }}>
                          <TableCell
                            sx={{
                              pl: 4,
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Criteria
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Output
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Explanation
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                              color: theme.palette.secondary.main,
                            }}>
                            Source Lines
                          </TableCell>
                          {isFaculty && <TableCell />}
                        </TableRow>

                        {/* Detailed skill row */}
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                          <TableCell sx={{ pl: 4, verticalAlign: "top" }}>
                            <Typography variant="body2" color="text.secondary">
                              {item.criteria}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ verticalAlign: "top" }}>
                            <Typography variant="body2">{item.output}</Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top" }}>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
                              {item.explanation}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top" }}>
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}>
                              {Array.isArray(item.lines) ? item.lines.join("\n") : ""}
                            </Typography>
                          </TableCell>
                          {isFaculty && <TableCell sx={{ verticalAlign: "top" }} />}
                        </TableRow>
                      </>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default RubricDataGrid
