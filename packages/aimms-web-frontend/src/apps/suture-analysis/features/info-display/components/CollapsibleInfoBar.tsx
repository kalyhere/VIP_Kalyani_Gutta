import React, { useState, useEffect } from "react"
import { Box, Typography, Chip, IconButton, Divider, Grid, Collapse, alpha, useTheme } from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import { DetectionResult, AnalysisResult } from "../../../types"

interface CollapsibleInfoBarProps {
  detection: DetectionResult | null
  index: number | null
  measurements: AnalysisResult["measurements"]
  show: boolean
  onClose: () => void
  onHeightChange?: (h: number) => void
}

export const CollapsibleInfoBar: React.FC<CollapsibleInfoBarProps> = ({
  detection,
  index,
  measurements,
  show,
  onClose,
  onHeightChange,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [startHeight, setStartHeight] = useState<number | null>(null)
  const [drawerHeight, setDrawerHeight] = useState<number>(280)
  const [snapPeek, setSnapPeek] = useState<number>(220)
  const [snapMid, setSnapMid] = useState<number>(Math.round(window.innerHeight * 0.5))
  const [snapFull, setSnapFull] = useState<number>(
    Math.round(Math.min(window.innerHeight * 0.85, 600))
  )

  // Open behavior based on selection: expand if a stitch is selected; otherwise stay at peek
  useEffect(() => {
    if (!show) return
    const maxH = Math.min(window.innerHeight * 0.85, 600)
    setSnapFull(Math.round(maxH))
    setSnapMid(Math.round(window.innerHeight * 0.5))
    setSnapPeek(220)
    if (detection && index !== null) {
      setExpanded(true)
      setDrawerHeight(Math.round(window.innerHeight * 0.5))
    } else {
      setExpanded(false)
      setDrawerHeight(220)
    }
  }, [show, detection, index])

  // Sync height with expanded state
  useEffect(() => {
    const maxH = Math.min(window.innerHeight * 0.85, 600)
    if (expanded) {
      setDrawerHeight(Math.round(maxH))
    } else {
      setDrawerHeight(220)
    }
  }, [expanded])

  // Notify parent on height changes
  useEffect(() => {
    if (show && onHeightChange) onHeightChange(drawerHeight)
    if (!show && onHeightChange) onHeightChange(0)
  }, [drawerHeight, show, onHeightChange])

  // Recalculate snap points on resize/orientation change
  useEffect(() => {
    const onResize = () => {
      setSnapFull(Math.round(Math.min(window.innerHeight * 0.85, 600)))
      setSnapMid(Math.round(window.innerHeight * 0.5))
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [])

  const beginDragMouse = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartY(e.clientY)
    setStartHeight(drawerHeight)
    e.preventDefault()
  }

  const beginDragTouch = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStartY(touch.clientY)
    setStartHeight(drawerHeight)
  }

  const onDragMove = (clientY: number) => {
    if (!isDragging || dragStartY === null || startHeight === null) return
    const delta = dragStartY - clientY
    const maxH = Math.min(window.innerHeight * 0.85, 600)
    const minH = 160
    const next = Math.max(minH, Math.min(maxH, startHeight + delta))
    setDrawerHeight(next)
  }

  const onDragMouseMove = (e: React.MouseEvent) => {
    onDragMove(e.clientY)
  }

  const onDragTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    onDragMove(touch.clientY)
  }

  const endDrag = () => {
    if (!isDragging) return
    setIsDragging(false)
    setDragStartY(null)
    setStartHeight(null)
    // snap to nearest of peek/mid/full
    const candidates = [snapPeek, snapMid, snapFull]
    const nearest = candidates.reduce((prev, curr) =>
      Math.abs(curr - drawerHeight) < Math.abs(prev - drawerHeight) ? curr : prev
    )
    setExpanded(nearest === snapFull)
    setDrawerHeight(nearest)
  }

  const theme = useTheme()

  if (!show) return null

  const classNames = ["good", "loose", "tight"]
  const classColors = [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight]
  const classIcons = [CheckCircleIcon, WarningIcon, ErrorIcon]

  const className = detection ? classNames[detection.class_id] : "suture"
  const Icon = detection ? classIcons[detection.class_id] : CheckCircleIcon
  const color = detection ? classColors[detection.class_id] : theme.palette.secondary.main

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderTop: `1px solid ${alpha(color, 0.25)}`,
        boxShadow: `0 -8px 32px ${alpha(theme.palette.primary.light, 0.12)}`,
        zIndex: 6,
        transform: show ? "translateY(0)" : "translateY(100%)",
        transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        height: `${drawerHeight}px`,
        maxHeight: "85vh",
      }}
      onMouseLeave={endDrag}>
      {/* Drag Handle */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          pt: 1,
          pb: 0.75,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseDown={beginDragMouse}
        onMouseMove={onDragMouseMove}
        onMouseUp={endDrag}
        onTouchStart={beginDragTouch}
        onTouchMove={onDragTouchMove}
        onTouchEnd={endDrag}>
        <Box
          sx={{
            width: 42,
            height: 4,
            backgroundColor: alpha(color, 0.25),
            borderRadius: 999,
            transition: "all 0.2s ease",
          }}
        />
      </Box>
      {/* Compact Header - Always Visible */}

      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}>
        {/* Stitch Badge or placeholder */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 8px ${alpha(color, 0.3)}`,
            flexShrink: 0,
          }}>
          <Typography variant="body1" sx={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>
            {index !== null ? index + 1 : "+"}
          </Typography>
        </Box>

        {/* Quick Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Icon sx={{ fontSize: 18, color }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color, fontSize: "1rem" }}>
              {detection ? `${className} Suture` : "Suture Details"}
            </Typography>
            {detection && (
              <Chip
                label={`${(detection.confidence * 100).toFixed(0)}%`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  backgroundColor: alpha(color, 0.1),
                  color,
                  fontWeight: 500,
                }}
              />
            )}
          </Box>

          {/* Quick Stats Row */}
          {detection && index !== null ? (
            <Box sx={{ display: "flex", gap: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                <strong>Length:</strong>{" "}
                {(() => {
                  const length = measurements.stitch_lengths?.[index]
                  return length
                    ? `${length.toFixed(1)}${measurements.pixels_per_mm ? "mm" : "px"}`
                    : "N/A"
                })()}
              </Typography>
              {measurements.stitch_angles[index] !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                  <strong>Angle:</strong>
                  {" "}
                  {measurements.stitch_angles[index]?.toFixed(1)}
°
</Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              Select a suture on the image to view details
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            size="small"
            sx={{
              color: alpha(color, 0.7),
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}>
            <ExpandMoreIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            size="small"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.7),
              "&:hover": { color: theme.palette.text.secondary },
            }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Details */}
      <Collapse in={expanded && !!detection && index !== null}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 2, backgroundColor: alpha(color, 0.1) }} />

          {/* Detailed Measurements */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: alpha(color, 0.05),
                  borderRadius: 2,
                  textAlign: "center",
                  border: `1px solid ${alpha(color, 0.1)}`,
                }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", fontWeight: 600, display: "block" }}>
                  STITCH LENGTH
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: theme.palette.primary.light, mt: 0.5 }}>
                  {index !== null ? measurements.stitch_lengths[index]?.toFixed(1) : "-"}
                  {measurements.pixels_per_mm ? "mm" : "px"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                  avg:
                  {" "}
                  {measurements.average_stitch_length.toFixed(1)}
                  {measurements.pixels_per_mm ? "mm" : "px"}
                </Typography>
              </Box>
            </Grid>

            {index !== null && measurements.stitch_angles[index] !== undefined && (
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: alpha(color, 0.05),
                    borderRadius: 2,
                    textAlign: "center",
                    border: `1px solid ${alpha(color, 0.1)}`,
                  }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.7rem", fontWeight: 600, display: "block" }}>
                    STITCH ANGLE
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: theme.palette.primary.light, mt: 0.5 }}>
                    {index !== null ? measurements.stitch_angles[index]?.toFixed(1) : "-"}°
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                    avg:
                    {" "}
                    {measurements.average_angle.toFixed(1)}
°
</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Analysis Comparison */}
          <Box
            sx={{
              p: 2,
              backgroundColor: alpha(theme.palette.secondary.main, 0.03),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: theme.palette.primary.light, mb: 1 }}>
              Analysis
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
              {index !== null &&
              measurements.stitch_lengths[index] &&
              measurements.stitch_lengths[index] > measurements.average_stitch_length
                ? `This suture is ${((measurements.stitch_lengths[index] / measurements.average_stitch_length - 1) * 100).toFixed(0)}% longer than the average stitch length. `
                : index !== null && measurements.stitch_lengths[index]
                  ? `This suture is ${((1 - measurements.stitch_lengths[index] / measurements.average_stitch_length) * 100).toFixed(0)}% shorter than the average stitch length. `
                  : "Length comparison not available. "}
              {className === "good"
                ? "This indicates proper suturing technique with appropriate tension and spacing."
                : className === "loose"
                  ? "This may indicate insufficient tension or improper needle placement."
                  : "This may indicate excessive tension which could compromise tissue healing."}
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}
