import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Chip,
  Grid,
  Stack,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material"
import { DetectionResult, AnalysisResult } from "../../../types"
import { InteractiveCanvas } from "../../canvas-interaction"

interface UnifiedAnalysisViewProps {
  detections: DetectionResult[]
  measurements: AnalysisResult["measurements"]
  imageUrl: string
  imageSize: [number, number]
}

export const UnifiedAnalysisView: React.FC<UnifiedAnalysisViewProps> = ({
  detections,
  measurements,
  imageUrl,
  imageSize,
}) => {
  const [selectedStitch, setSelectedStitch] = useState<number | null>(null)
  const [showInfoBar, setShowInfoBar] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (selectedStitch === null || !detections) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          if (selectedStitch > 0) setSelectedStitch(selectedStitch - 1)
          break
        case "ArrowRight":
          event.preventDefault()
          if (selectedStitch < detections.length - 1) setSelectedStitch(selectedStitch + 1)
          break
        case "Escape":
          setSelectedStitch(null)
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [selectedStitch, detections])

  // Keep drawer collapsed until user selects a suture
  // (no auto-select)

  const classNames = ["good", "loose", "tight"]
  const classColors = [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight]
  const selectedDetection = selectedStitch !== null ? detections[selectedStitch] : null

  const groupedDetections = detections.reduce(
    (acc, detection, index) => {
      const className = classNames[detection.class_id]
      if (!acc[className]) acc[className] = []
      acc[className].push({ ...detection, displayIndex: index + 1, originalIndex: index })
      return acc
    },
    {} as Record<string, (DetectionResult & { displayIndex: number; originalIndex: number })[]>
  )

  const getQualityDistribution = () => {
    const total = detections.length
    return {
      good: parseInt((((groupedDetections.good?.length || 0) / total) * 100).toFixed(0)),
    }
  }

  // Derived overall stats for the summary panel
  const countGood = groupedDetections.good?.length || 0
  const countLoose = groupedDetections.loose?.length || 0
  const countTight = groupedDetections.tight?.length || 0
  const totalDetected = detections.length
  const avgConfidence = totalDetected
    ? Math.round((detections.reduce((s, d) => s + d.confidence, 0) / totalDetected) * 100)
    : 0
  const allLengths = (measurements.stitch_lengths || []).filter(
    (v) => typeof v === "number"
  ) as number[]
  const meanLen = measurements.average_stitch_length
  const stdLen =
    allLengths.length > 1
    ? Math.sqrt(allLengths.reduce((s, v) => s + (v - meanLen) ** 2, 0) / (allLengths.length - 1))
    : 0
  const cvLenPct = meanLen > 0 ? Math.round((stdLen / meanLen) * 100) : 0
  const unitLabel = measurements.pixels_per_mm ? "mm" : "px"
  const qualityPct = getQualityDistribution().good
  const qualityColor =
    qualityPct >= 80
    ? theme.palette.suture.good
    : qualityPct >= 60
      ? theme.palette.suture.loose
      : theme.palette.suture.tight
  const cvColor =
    cvLenPct < 15
    ? theme.palette.suture.good
    : cvLenPct < 25
      ? theme.palette.suture.loose
      : theme.palette.suture.tight
  const confColor =
    avgConfidence >= 75
    ? theme.palette.suture.good
    : avgConfidence >= 50
      ? theme.palette.suture.loose
      : theme.palette.suture.tight

  // Helper functions for stitch selection
  const showStitchInfo = (index: number) => {
    setSelectedStitch(index)
    // No need for showInfoBar state on mobile since drawer is always visible
  }

  const hideStitchInfo = () => {
    setSelectedStitch(null)
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Analysis Overview - Desktop Only */}
      {!isMobile && (
        <Box sx={{ mb: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.light, 0.01)} 100%)`,
              height: 220,
              minHeight: 220,
              boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.08)}`,
            }}>
            <CardContent
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}>
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <AnalyticsIcon sx={{ color: theme.palette.secondary.main, fontSize: 18 }} />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: theme.palette.primary.light, fontSize: "1rem" }}>
                  Analysis Overview
                </Typography>
              </Box>

              {/* Metrics Grid */}
              <Grid container spacing={2} sx={{ flex: 1, alignItems: "stretch" }}>
                {/* Quality Score */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      p: 3,
                      backgroundColor: alpha(
                        getQualityDistribution().good >= 80
                          ? theme.palette.suture.good
                          : getQualityDistribution().good >= 60
                            ? theme.palette.suture.loose
                            : theme.palette.suture.tight,
                        0.08
                      ),
                      borderRadius: 2,
                      border: `2px solid ${alpha(
                        getQualityDistribution().good >= 80
                          ? theme.palette.suture.good
                          : getQualityDistribution().good >= 60
                            ? theme.palette.suture.loose
                            : theme.palette.suture.tight,
                        0.2
                      )}`,
                    }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color:
                          getQualityDistribution().good >= 80
                            ? theme.palette.suture.good
                            : getQualityDistribution().good >= 60
                              ? theme.palette.suture.loose
                              : theme.palette.suture.tight,
                        fontSize: "2.5rem",
                        lineHeight: 1,
                      }}>
                      {getQualityDistribution().good}%
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ fontWeight: 600, mt: 1 }}>
                      QUALITY SCORE
                    </Typography>
                  </Box>
                </Grid>

                {/* Basic Metrics */}
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1.5} sx={{ height: "100%", justifyContent: "space-evenly" }}>
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
                        sx={{ fontSize: "0.7rem", fontWeight: 500 }}>
                        AVG LENGTH
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: theme.palette.primary.light, lineHeight: 1.2 }}>
                        {measurements.average_stitch_length.toFixed(1)}
                        {measurements.pixels_per_mm ? "mm" : "px"}
                      </Typography>
                    </Box>
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
                        sx={{ fontSize: "0.7rem", fontWeight: 500 }}>
                        AVG ANGLE
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: theme.palette.primary.light, lineHeight: 1.2 }}>
                        {measurements.average_angle.toFixed(1)}°
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Pattern Symmetry */}
                <Grid item xs={6} sm={6} md={3}>
                  {measurements.pattern_symmetry ? (
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        backgroundColor: alpha(theme.palette.secondary.light, 0.05),
                        borderRadius: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.light,
                          fontSize: "0.7rem",
                          mb: 1,
                        }}>
                        PATTERN SYMMETRY
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                            {(measurements.pattern_symmetry.symmetry_score * 100).toFixed(0)}%
                          </Typography>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor:
                                measurements.pattern_symmetry.symmetry_score > 0.7
                                  ? theme.palette.suture.good
                                  : measurements.pattern_symmetry.symmetry_score > 0.4
                                    ? theme.palette.suture.loose
                                    : theme.palette.suture.tight,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: theme.palette.primary.light,
                            textAlign: "center",
                          }}>
                          Score
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.65rem", textAlign: "center" }}>
                        Max Dev:
                        {" "}
                        {measurements.pattern_symmetry.max_deviation.toFixed(0)}
                        px
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                        borderRadius: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", fontWeight: 500 }}>
                        Pattern Symmetry
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        N/A
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Spacing Uniformity */}
                <Grid item xs={6} sm={6} md={3}>
                  {measurements.spacing_uniformity ? (
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        backgroundColor: alpha(theme.palette.secondary.light, 0.05),
                        borderRadius: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.light,
                          fontSize: "0.7rem",
                          mb: 1,
                        }}>
                        SPACING UNIFORMITY
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                        }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                            {(measurements.spacing_uniformity.spacing_cv * 100).toFixed(0)}%
                          </Typography>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor:
                                measurements.spacing_uniformity.spacing_cv < 0.15
                                  ? theme.palette.suture.good
                                  : measurements.spacing_uniformity.spacing_cv < 0.25
                                    ? theme.palette.suture.loose
                                    : theme.palette.suture.tight,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: theme.palette.primary.light,
                            textAlign: "center",
                          }}>
                          Variation
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.65rem", textAlign: "center" }}>
                        Mean:
                        {" "}
                        {measurements.spacing_uniformity.mean_spacing.toFixed(0)}
                        {measurements.pixels_per_mm ? "mm" : "px"}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: "100%",
                        p: 2,
                        backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                        borderRadius: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", fontWeight: 500 }}>
                        Spacing Uniformity
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        N/A
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Main Content - Mobile First Design */}
      {isMobile ? (
        <Box
          sx={{
            position: "relative",
            height: "100vh", // Fixed viewport height
            display: "flex",
            flexDirection: "column",
            pt: 1, // Small padding from top
            px: 2, // unified horizontal padding to avoid mx overflow
            overflow: "hidden", // Prevent any scrolling
          }}>
          <Card
            elevation={0}
            sx={{
              mb: 1,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
              overflow: "hidden",
            }}>
            <CardHeader
              title={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: theme.palette.primary.light }}>
                  Suture Analysis
                </Typography>
              }
              action={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, paddingRight: 1 }}>
                  <Chip
                    size="small"
                    label={`Good: ${countGood}`}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      color: theme.palette.suture.good,
                      backgroundColor: alpha(theme.palette.suture.good, 0.08),
                      border: `1px solid ${alpha(theme.palette.suture.good, 0.18)}`,
                    }}
                  />
                  <Chip
                    size="small"
                    label={`Loose: ${countLoose}`}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      color: theme.palette.suture.loose,
                      backgroundColor: alpha(theme.palette.suture.loose, 0.08),
                      border: `1px solid ${alpha(theme.palette.suture.loose, 0.18)}`,
                    }}
                  />
                  {countTight > 0 && (
                    <Chip
                      size="small"
                      label={`Tight: ${countTight}`}
                      sx={{
                        height: 24,
                        fontSize: "0.72rem",
                        color: theme.palette.suture.tight,
                        backgroundColor: alpha(theme.palette.suture.tight, 0.08),
                        border: `1px solid ${alpha(theme.palette.suture.tight, 0.18)}`,
                      }}
                    />
                  )}
                </Box>
              }
              sx={{
                px: 1.5,
                py: 1.25,
                "& .MuiCardHeader-action": {
                  alignSelf: "center",
                  marginTop: 0,
                },
              }}
            />
            <Divider sx={{ borderColor: alpha(theme.palette.text.secondary, 0.1) }} />
            <CardContent sx={{ px: 1.5, pt: 1.25, mb: -1.5 }}>
              <Grid container spacing={1}>
                {/* Quality */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 1.25,
                      px: 0.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                      border: `1px solid ${alpha(theme.palette.text.secondary, 0.08)}`,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: theme.palette.primary.light,
                        lineHeight: 1,
                      }}>
                      {qualityPct}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        lineHeight: 1.2,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        mt: 0.5,
                        fontSize: "0.7rem",
                        color: "text.secondary",
                      }}>
                      Quality
                    </Typography>
                  </Box>
                </Grid>
                {/* Avg Len */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 1.25,
                      px: 0.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                      border: `1px solid ${alpha(theme.palette.text.secondary, 0.08)}`,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: theme.palette.primary.light,
                        lineHeight: 1,
                      }}>
                      {measurements.average_stitch_length.toFixed(1)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        lineHeight: 1.2,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        mt: 0.5,
                        fontSize: "0.7rem",
                        color: "text.secondary",
                      }}>
                      Len ({unitLabel})
                    </Typography>
                  </Box>
                </Grid>
                {/* Avg Angle */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 1.25,
                      px: 0.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                      border: `1px solid ${alpha(theme.palette.text.secondary, 0.08)}`,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: theme.palette.primary.light,
                        lineHeight: 1,
                      }}>
                      {measurements.average_angle.toFixed(1)}°
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        lineHeight: 1.2,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        mt: 0.5,
                        fontSize: "0.7rem",
                        color: "text.secondary",
                      }}>
                      Angle
                    </Typography>
                  </Box>
                </Grid>
                {/* Avg Conf */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 1.25,
                      px: 0.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                      border: `1px solid ${alpha(theme.palette.text.secondary, 0.08)}`,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: theme.palette.primary.light,
                        lineHeight: 1,
                      }}>
                      {avgConfidence}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        lineHeight: 1.2,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        mt: 0.5,
                        fontSize: "0.7rem",
                        color: "text.secondary",
                      }}>
                      Confidence
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          {/* Mobile: Image at the top */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: `${imageSize[1]} / ${imageSize[0]}`, // width / height
              maxHeight: "55vh",
              minHeight: 240,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              overflow: "hidden",
              boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha("#F8FAFC", 0.6)} 0%, ${alpha("#EEF2F7", 0.6)} 100%)`,
              flexShrink: 0, // Prevent shrinking
            }}>
            {/* Edge-blur bleed background */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(14px)",
                transform: "scale(1.08)",
                opacity: 0.55,
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, ${alpha("#000", 0.08)} 0%, ${alpha("#000", 0.04)} 60%, ${alpha("#000", 0.08)} 100%)`,
                zIndex: 0,
              }}
            />

            <InteractiveCanvas
              imageUrl={imageUrl}
              detections={detections}
              imageSize={imageSize}
              selectedStitch={selectedStitch}
              onStitchClick={showStitchInfo}
              onMobileStitchClick={showStitchInfo}
              // Canvas should sit above blurred background
            />

            {/* Subtle in-image hint pill */}
            {selectedStitch === null && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: alpha(theme.palette.primary.light, 0.9),
                  color: "#fff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.light, 0.25)}`,
                }}>
                Tap a numbered badge to analyze
              </Box>
            )}
          </Box>

          {/* Suture details panel - occupies remaining space */}
          <Box
            sx={{
              mt: 1,
              flex: 1,
              minHeight: 0,
              width: "100%",
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.light, 0.08)}`,
              backgroundColor: "#fff",
              overflow: "auto",
              p: 1.5,
            }}>
            {/* Horizontal row of suture numbers */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                pb: 1,
                mb: 1,
                pr: 1,
                overflowX: "auto",
                borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.08)}`,
              }}>
              {detections.map((d, idx) => {
                const c = [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                  d.class_id
                ]
                const active = selectedStitch === idx
                return (
                  <Box
                    key={idx}
                    onClick={() => setSelectedStitch(idx)}
                    role="button"
                    aria-label={`Suture ${idx + 1}`}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      userSelect: "none",
                      backgroundColor: active ? c : alpha(c, 0.1),
                      color: active ? "#FFFFFF" : c,
                      border: `2px solid ${c}`,
                      boxShadow: active ? `0 2px 8px ${alpha(c, 0.35)}` : "none",
                      flex: "0 0 auto",
                    }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {idx + 1}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
            {selectedStitch === null ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.02),
                }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Tap a numbered badge on the image to view detailed suture information
                </Typography>
              </Box>
            ) : (
              (() => {
                const detection = detections[selectedStitch]
                const className = ["good", "loose", "tight"][detection.class_id]
                const classColor = [
                  theme.palette.suture.good,
                  theme.palette.suture.loose,
                  theme.palette.suture.tight,
                ][detection.class_id]
                const unit = measurements.pixels_per_mm ? "mm" : "px"
                return (
                  <Stack spacing={1.5}>
                    {/* Classification and confidence */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                      }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 700, textTransform: "capitalize", color: classColor }}>
                        {className} suture
                      </Typography>
                      <Chip
                        label={`Confidence: ${(detection.confidence * 100).toFixed(0)}%`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.72rem",
                          backgroundColor: alpha(classColor, 0.1),
                          color: classColor,
                          marginRight: 1,
                        }}
                      />
                    </Box>

                    {/* Measurements */}
                    <Grid container columnSpacing={0} rowSpacing={1}>
                      <Grid item xs={6} sx={{ pr: 1 }}>
                        <Box
                          sx={{
                            p: 1.25,
                            backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                            borderRadius: 2,
                            textAlign: "center",
                            border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                          }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 700 }}>
                            LENGTH
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: theme.palette.primary.light }}>
                            {measurements.stitch_lengths[selectedStitch]?.toFixed(1)}
                            {unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            avg:
                            {measurements.average_stitch_length.toFixed(1)}
                            {unit}
                          </Typography>
                        </Box>
                      </Grid>
                      {measurements.stitch_angles[selectedStitch] !== undefined && (
                        <Grid item xs={6} sx={{ pl: 1 }}>
                          <Box
                            sx={{
                              p: 1.25,
                              backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                              borderRadius: 2,
                              textAlign: "center",
                              border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                            }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 700 }}>
                              ANGLE
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: theme.palette.primary.light }}>
                              {measurements.stitch_angles[selectedStitch]?.toFixed(1)}°
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              avg:
                              {measurements.average_angle.toFixed(1)}
°
</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Stack>
                )
              })()
            )}
          </Box>
        </Box>
      ) : (
        /* Desktop Layout */
        <Grid container spacing={3}>
          {/* Left Side - Suture Analysis */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                height: "60vh",
                minHeight: 500,
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                overflow: "hidden",
                boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.08)}`,
              }}>
              {/* Panel Header */}
              <Box
                sx={{
                  p: 2.5,
                  flexShrink: 0,
                  borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.light, 0.01)} 100%)`,
                }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{
                        color: theme.palette.secondary.main,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        display: "block",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                      }}>
                      Surgical Assessment
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.primary.light,
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                      }}>
                      Suture Analysis ({detections.length})
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Panel Content */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2.5 }}>
                {detections.map((detection, index) => {
                  const className = ["good", "loose", "tight"][detection.class_id]
                  const Icon = [CheckCircleIcon, WarningIcon, ErrorIcon][detection.class_id]
                  const isExpanded = selectedStitch === index

                  return (
                    <Accordion
                      key={index}
                      expanded={isExpanded}
                      onChange={() => setSelectedStitch(isExpanded ? null : index)}
                      elevation={0}
                      sx={{
                        mb: 1,
                        border: `1px solid ${isExpanded ? [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][detection.class_id] : alpha(theme.palette.text.secondary, 0.1)}`,
                        borderRadius: "8px !important",
                        "&:before": { display: "none" },
                        transition: "all 0.2s ease",
                        backgroundColor: isExpanded
                          ? alpha(
                              [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                detection.class_id
                              ],
                              0.02
                            )
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
                            ? alpha(
                                [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                  detection.class_id
                                ],
                                0.05,
                            )
                            : "transparent",
                          borderRadius: "8px",
                          "&:hover": {
                            backgroundColor: alpha(
                              [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                detection.class_id
                              ],
                              0.03
                            ),
                          },
                        }}>
                        {/* Suture Number Badge */}
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: isExpanded
                              ? [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                  detection.class_id
                                ]
                              : alpha(
                                  [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                    detection.class_id
                                  ],
                                  0.1
                                ),
                            border: `2px solid ${[theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][detection.class_id]}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: isExpanded
                                ? "#FFFFFF"
                                : [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                    detection.class_id
                                  ],
                              fontWeight: 700,
                            }}>
                            {index + 1}
                          </Typography>
                        </Box>

                        {/* Suture Summary */}
                        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Icon
                            sx={{
                              fontSize: 18,
                              color: [
                                theme.palette.suture.good,
                                theme.palette.suture.loose,
                                theme.palette.suture.tight,
                              ][detection.class_id],
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              textTransform: "capitalize",
                              color: [
                                theme.palette.suture.good,
                                theme.palette.suture.loose,
                                theme.palette.suture.tight,
                              ][detection.class_id],
                            }}>
                            {className} Suture
                          </Typography>
                          <Chip
                            label={`${(detection.confidence * 100).toFixed(0)}%`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.75rem",
                              backgroundColor: alpha(
                                [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                                  detection.class_id
                                ],
                                0.1
                              ),
                              color: [
                                theme.palette.suture.good,
                                theme.palette.suture.loose,
                                theme.palette.suture.tight,
                              ][detection.class_id],
                            }}
                          />
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ pt: 1 }}>
                        <Stack spacing={2}>
                          {/* Detailed Measurements */}
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.light }}>
                              Measurements
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
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Box>
            </Paper>
          </Grid>

          {/* Right Side - Interactive Image */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                position: "relative",
                width: "100%",
                height: "60vh",
                minHeight: 500,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                overflow: "hidden",
                boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.12)}`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
                  zIndex: 1,
                },
                "&:hover": {
                  boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.main, 0.16)}`,
                  transform: "translateY(-2px)",
                },
              }}>
              {/* Panel Header */}
              <Box
                sx={{
                  p: 2.5,
                  flexShrink: 0,
                  borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                  backgroundColor: "background.paper",
                  backdropFilter: "blur(10px)",
                  position: "relative",
                  zIndex: 2,
                }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{
                        color: alpha(theme.palette.secondary.main, 0.8),
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: 1,
                        display: "block",
                        lineHeight: 1.2,
                        textTransform: "uppercase",
                      }}>
                      Interactive Analysis
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.primary.light,
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                      }}>
                      Suture Image Viewer
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Image Content with Enhanced Styling */}
              <Box
                sx={{
                  flex: 1,
                  position: "relative",
                  background: `radial-gradient(circle at center, ${alpha("#F8FAFC", 0.3)} 0%, ${alpha("#F1F5F9", 0.6)} 100%)`,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.01)} 25%, transparent 25%),
                             linear-gradient(-45deg, ${alpha(theme.palette.secondary.main, 0.01)} 25%, transparent 25%),
                             linear-gradient(45deg, transparent 75%, ${alpha(theme.palette.secondary.main, 0.01)} 75%),
                             linear-gradient(-45deg, transparent 75%, ${alpha(theme.palette.secondary.main, 0.01)} 75%)`,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    opacity: 0.3,
                    zIndex: 0,
                  },
                }}>
                <InteractiveCanvas
                  imageUrl={imageUrl}
                  detections={detections}
                  imageSize={imageSize}
                  selectedStitch={selectedStitch}
                  onStitchClick={setSelectedStitch}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
