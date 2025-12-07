import React from "react"
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
  Stack,
  SwipeableDrawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  useTheme,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import { DetectionResult, AnalysisResult } from "../../../types"

interface MobileAnalysisDrawerProps {
  detections: DetectionResult[]
  measurements: AnalysisResult["measurements"]
  selectedStitch: number | null
  onStitchSelect: (index: number | null) => void
  open: boolean
  onClose: () => void
}

export const MobileAnalysisDrawer: React.FC<MobileAnalysisDrawerProps> = ({
  detections,
  measurements,
  selectedStitch,
  onStitchSelect,
  open,
  onClose,
}) => {
  const theme = useTheme()

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "80vh",
          backgroundColor: "background.paper", // Solid background instead of transparent
          boxShadow: `0 -4px 20px ${alpha(theme.palette.primary.light, 0.15)}`,
        },
      }}>
    {/* Drawer Handle */}
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        pt: 1,
        pb: 2,
      }}>
      <Box
        sx={{
          width: 40,
          height: 4,
          backgroundColor: alpha(theme.palette.text.secondary, 0.3),
          borderRadius: 2,
        }}
      />
    </Box>

    {/* Header */}
    <Box
      sx={{
        px: 2.5,
        pb: 2,
        borderBottom: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
      }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.light,
              fontWeight: 600,
              fontSize: "1.1rem",
            }}>
            Suture Analysis
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detections.length} sutures detected
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>

    {/* Content */}
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        p: 2.5,
        maxHeight: "calc(80vh - 120px)",
      }}>
      {detections.map((detection, index) => {
        const className = ["good", "loose", "tight"][detection.class_id]
        const Icon = [CheckCircleIcon, WarningIcon, ErrorIcon][detection.class_id]
        const isExpanded = selectedStitch === index

        return (
          <Accordion
            key={index}
            expanded={isExpanded}
            onChange={() => onStitchSelect(isExpanded ? null : index)}
            elevation={0}
            sx={{
              mb: 1.5,
              border: `1px solid ${isExpanded ? [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][detection.class_id] : alpha(theme.palette.text.secondary, 0.1)}`,
              borderRadius: "12px !important",
              "&:before": { display: "none" },
              transition: "all 0.3s ease",
              backgroundColor: isExpanded
                ? alpha(
                    [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                      detection.class_id
                    ],
                    0.02
                  )
                : "transparent",
              "&:hover": {
                backgroundColor: alpha(
                  [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                    detection.class_id
                  ],
                  0.04
                ),
                transform: "translateY(-1px)",
                boxShadow: `0 4px 12px ${alpha([theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][detection.class_id], 0.15)}`,
              },
            }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                  gap: 2,
                  py: 1,
                },
                backgroundColor: "transparent",
                borderRadius: "12px",
                minHeight: 64,
              }}>
              {/* Badge */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
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
                  boxShadow: `0 2px 8px ${alpha([theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][detection.class_id], 0.2)}`,
                }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: isExpanded
                      ? "#FFFFFF"
                      : [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                          detection.class_id
                        ],
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}>
                  {index + 1}
                </Typography>
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Icon
                    sx={{
                      fontSize: 20,
                      color: [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                        detection.class_id
                      ],
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                      color: [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                        detection.class_id
                      ],
                      fontSize: "1rem",
                    }}>
                    {className} Suture
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Chip
                    label={`${(detection.confidence * 100).toFixed(0)}% confidence`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.75rem",
                      backgroundColor: alpha(
                        [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                          detection.class_id
                        ],
                        0.1
                      ),
                      color: [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight][
                        detection.class_id
                      ],
                      fontWeight: 500,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {measurements.stitch_lengths[index]?.toFixed(1)}
                    {measurements.pixels_per_mm ? "mm" : "px"}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                        borderRadius: 2,
                        textAlign: "center",
                        border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                      }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                        LENGTH
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: theme.palette.primary.light, mt: 0.5 }}>
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
                          p: 2,
                          backgroundColor: alpha(theme.palette.text.secondary, 0.03),
                          borderRadius: 2,
                          textAlign: "center",
                          border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                        }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          ANGLE
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: theme.palette.primary.light, mt: 0.5 }}>
                          {measurements.stitch_angles[index]?.toFixed(1)}°
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  </SwipeableDrawer>
  )
}
