import React from "react"
import {
  Paper,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Stack,
  alpha,
  useTheme,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material"
import type { DetectionResult, AnalysisResult } from "../../../types"

interface AnalysisPanelProps {
  detections: DetectionResult[]
  measurements: AnalysisResult["measurements"]
  selectedStitch: number | null
  onStitchSelect: (index: number | null) => void
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  detections,
  measurements,
  selectedStitch,
  onStitchSelect,
}) => {
  const theme = useTheme()
  const classNames = ["good", "loose", "tight"]
  const classColors = [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight]
  const classIcons = [CheckCircleIcon, WarningIcon, ErrorIcon]

  return (
    <Paper
      elevation={0}
      sx={{
        height: "50vh",
        minHeight: 400,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
      }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.light, 0.01)} 100%)`,
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <MedicalIcon sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: theme.palette.primary.light, fontSize: "1rem" }}>
              Suture Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {detections.length} sutures detected • Click to analyze
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Accordion List */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {detections.map((detection, index) => {
          const className = classNames[detection.class_id]
          const Icon = classIcons[detection.class_id]
          const isExpanded = selectedStitch === index

          return (
            <Accordion
              key={index}
              expanded={isExpanded}
              onChange={() => onStitchSelect(isExpanded ? null : index)}
              elevation={0}
              sx={{
                mb: 1,
                border: `1px solid ${isExpanded ? classColors[detection.class_id] : alpha(theme.palette.text.secondary, 0.1)}`,
                borderRadius: "8px !important",
                "&:before": { display: "none" },
                transition: "all 0.2s ease",
                backgroundColor: isExpanded
                  ? alpha(classColors[detection.class_id], 0.02)
                  : "transparent",
              }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                    gap: 2,
                  },
                  backgroundColor: isExpanded
                    ? alpha(classColors[detection.class_id], 0.05)
                    : "transparent",
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: alpha(classColors[detection.class_id], 0.03),
                  },
                }}>
                {/* Suture Number Badge */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: isExpanded
                      ? classColors[detection.class_id]
                      : alpha(classColors[detection.class_id], 0.1),
                    border: `2px solid ${classColors[detection.class_id]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isExpanded ? "#FFFFFF" : classColors[detection.class_id],
                      fontWeight: 700,
                    }}>
                    {index + 1}
                  </Typography>
                </Box>

                {/* Suture Summary */}
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Icon sx={{ fontSize: 18, color: classColors[detection.class_id] }} />
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                      color: classColors[detection.class_id],
                    }}>
                    {className} Suture
                  </Typography>
                  <Chip
                    label={`${(detection.confidence * 100).toFixed(0)}% confidence`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.75rem",
                      backgroundColor: alpha(classColors[detection.class_id], 0.1),
                      color: classColors[detection.class_id],
                    }}
                  />
                </Box>

                {/* Quick Stats */}
                <Box sx={{ display: "flex", gap: 2, mr: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    L:
                    {" "}
                    {measurements.stitch_lengths[index]?.toFixed(1)}
                    {measurements.pixels_per_mm ? "mm" : "px"}
                  </Typography>
                  {measurements.stitch_angles[index] !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      ∠:
                      {" "}
                      {measurements.stitch_angles[index]?.toFixed(1)}
°
</Typography>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 1 }}>
                <Stack spacing={2}>
                  {/* Detailed Measurements */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.light }}>
                      Detailed Measurements
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                            borderRadius: 1.5,
                            textAlign: "center",
                          }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.7rem" }}>
                            LENGTH
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: theme.palette.primary.light }}>
                            {measurements.stitch_lengths[index] !== undefined &&
                            measurements.stitch_lengths[index] !== null
                              ? `${measurements.stitch_lengths[index].toFixed(1)}${measurements.pixels_per_mm ? "mm" : "px"}`
                              : "N/A"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            avg:
                            {" "}
                            {measurements.average_stitch_length.toFixed(1)}
                            {measurements.pixels_per_mm ? "mm" : "px"}
                          </Typography>
                        </Box>
                      </Grid>
                      {measurements.stitch_angles[index] !== undefined && (
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              p: 1.5,
                              backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                              borderRadius: 1.5,
                              textAlign: "center",
                            }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.7rem" }}>
                              ANGLE
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: theme.palette.primary.light }}>
                              {measurements.stitch_angles[index]?.toFixed(1)}°
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              avg:
                              {" "}
                              {measurements.average_angle.toFixed(1)}
°
</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Comparison to Average */}
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                      borderRadius: 1.5,
                    }}>
                    <Typography variant="caption" color="text.secondary">
                      {measurements.stitch_lengths[index] &&
                      measurements.stitch_lengths[index] > measurements.average_stitch_length
                        ? `This suture is ${((measurements.stitch_lengths[index] / measurements.average_stitch_length - 1) * 100).toFixed(0)}% longer than average`
                        : measurements.stitch_lengths[index]
                          ? `This suture is ${((1 - measurements.stitch_lengths[index] / measurements.average_stitch_length) * 100).toFixed(0)}% shorter than average`
                          : "Length comparison not available"}
                    </Typography>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </Paper>
  )
}
