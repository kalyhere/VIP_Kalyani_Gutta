import React, { useState, useCallback, useRef, useEffect } from "react"
import {
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material"
import type { DetectionResult } from "../../../types"

interface InteractiveCanvasProps {
  imageUrl: string
  detections: DetectionResult[]
  imageSize: [number, number]
  selectedStitch: number | null
  onStitchClick: (index: number) => void
  onMobileStitchClick?: (index: number, element: HTMLElement) => void
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  imageUrl,
  detections,
  imageSize,
  selectedStitch,
  onStitchClick,
  onMobileStitchClick,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const classNames = ["suture_good", "suture_loose", "suture_tight"]
  const classColors = [theme.palette.suture.good, theme.palette.suture.loose, theme.palette.suture.tight]

  // Helper function to convert hex color to rgba for canvas
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !imageLoaded) return

    const img = new Image()
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate display dimensions
      const containerWidth = containerRef.current?.clientWidth || 800
      const containerHeight = containerRef.current?.clientHeight || 600

      canvas.width = containerWidth
      canvas.height = containerHeight

      // Calculate image dimensions with zoom and pan (aspect-ratio-driven container)
      const imgAspect = img.width / img.height
      // Use full container while preserving aspect using the smaller bound
      let baseWidth = containerWidth
      let baseHeight = baseWidth / imgAspect
      if (baseHeight > containerHeight) {
        baseHeight = containerHeight
        baseWidth = baseHeight * imgAspect
      }

      const scaledWidth = baseWidth * zoom
      const scaledHeight = baseHeight * zoom

      const offsetX = (containerWidth - scaledWidth) / 2 + pan.x
      const offsetY = (containerHeight - scaledHeight) / 2 + pan.y

      // Draw image with zoom and pan
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

      // Draw subtle border around the image bounds for visual definition
      ctx.strokeStyle = "rgba(12, 35, 75, 0.18)"
      ctx.lineWidth = 1
      ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight)

      // Draw detection overlays
      detections.forEach((detection, index) => {
        const { bbox, confidence, class_id } = detection

        // Scale bbox coordinates
        const scaleX = scaledWidth / imageSize[1]
        const scaleY = scaledHeight / imageSize[0]

        const x1 = bbox.x1 * scaleX + offsetX
        const y1 = bbox.y1 * scaleY + offsetY
        const x2 = bbox.x2 * scaleX + offsetX
        const y2 = bbox.y2 * scaleY + offsetY

        const width = x2 - x1
        const height = y2 - y1
        const centerX = x1 + width / 2
        const centerY = y1 + height / 2

        const color = classColors[class_id] || theme.palette.text.secondary
        const isSelected = selectedStitch === index

        // Draw subtle bounding box
        ctx.strokeStyle = hexToRgba(color, 0.6)
        ctx.lineWidth = isSelected ? 3 : 2
        ctx.setLineDash(isSelected ? [] : [5, 5])
        ctx.strokeRect(x1, y1, width, height)
        ctx.setLineDash([])

        // On mobile, only show number badges and details for the selected stitch
        // On desktop, show all badges
        const showBadge = !isMobile || isSelected

        if (showBadge) {
          // Draw interactive indicator
          const radius = isMobile ? Math.max(12, 8 * zoom) : Math.max(10, 6 * zoom)

          // Outer glow for selected
          if (isSelected) {
            ctx.shadowColor = color
            ctx.shadowBlur = 12
          } else {
            ctx.shadowBlur = 0
          }

          // Badge background with gradient
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY - height / 2 - radius,
            0,
            centerX,
            centerY - height / 2 - radius,
            radius
          )
          gradient.addColorStop(0, color)
          gradient.addColorStop(1, hexToRgba(color, 0.8))

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(centerX, centerY - height / 2 - radius, radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.shadowBlur = 0

          // Badge border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
          ctx.lineWidth = 2
          ctx.stroke()

          // Number text
          ctx.fillStyle = "#FFFFFF"
          ctx.font = `bold ${Math.max(10, 8 * zoom)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(`${index + 1}`, centerX, centerY - height / 2 - radius)
        }

        // Confidence indicator - only show on desktop or when selected on mobile
        if (zoom > 0.8 && showBadge) {
          const confidenceText = `${Math.round(confidence * 100)}%`
          const fontSize = Math.max(11, 9 * zoom)
          ctx.font = `bold ${fontSize}px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

          // Dark background for better readability
          const textWidth = ctx.measureText(confidenceText).width
          const textHeight = fontSize
          const padding = 4
          const bgX = centerX - textWidth / 2 - padding
          const bgY = centerY + height / 2 + 10 - padding
          const bgWidth = textWidth + padding * 2
          const bgHeight = textHeight + padding * 2

          // Draw rounded rectangle background
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
          ctx.beginPath()
          ctx.moveTo(bgX + 3, bgY)
          ctx.lineTo(bgX + bgWidth - 3, bgY)
          ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + 3)
          ctx.lineTo(bgX + bgWidth, bgY + bgHeight - 3)
          ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - 3, bgY + bgHeight)
          ctx.lineTo(bgX + 3, bgY + bgHeight)
          ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - 3)
          ctx.lineTo(bgX, bgY + 3)
          ctx.quadraticCurveTo(bgX, bgY, bgX + 3, bgY)
          ctx.closePath()
          ctx.fill()

          // White text on dark background
          ctx.fillStyle = "#FFFFFF"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(confidenceText, centerX, centerY + height / 2 + 10 + textHeight / 2)
        }
      })

      ctx.textAlign = "start"
      ctx.textBaseline = "alphabetic"
    }
    img.src = imageUrl
  }, [
    imageUrl,
    detections,
    imageSize,
    selectedStitch,
    zoom,
    pan,
    imageLoaded,
    isMobile,
    classColors,
    hexToRgba,
  ])

  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
    }
    img.onerror = (error) => {
      console.error("Image failed to load in canvas:", error)
      setImageLoaded(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [drawCanvas, imageLoaded])

  // Handle mouse interactions - disabled dragging on mobile
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isMobile) {
        setIsDragging(true)
        setLastPanPoint({ x: event.clientX, y: event.clientY })
      }
    },
    [isMobile]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isMobile && isDragging) {
        const deltaX = event.clientX - lastPanPoint.x
        const deltaY = event.clientY - lastPanPoint.y
        setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
        setLastPanPoint({ x: event.clientX, y: event.clientY })
      }
    },
    [isMobile, isDragging, lastPanPoint]
  )

  const handleMouseUp = useCallback(() => {
    if (!isMobile) {
      setIsDragging(false)
    }
  }, [isMobile])

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) return // Don't handle clicks if we were dragging

      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Calculate image position and scaling
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const imgAspect = imageSize[1] / imageSize[0] // width/height
      let baseWidth = containerWidth * 0.8
      let baseHeight = baseWidth / imgAspect

      if (baseHeight > containerHeight * 0.8) {
        baseHeight = containerHeight * 0.8
        baseWidth = baseHeight * imgAspect
      }

      const scaledWidth = baseWidth * zoom
      const scaledHeight = baseHeight * zoom
      const offsetX = (containerWidth - scaledWidth) / 2 + pan.x
      const offsetY = (containerHeight - scaledHeight) / 2 + pan.y

      // Check clicks on detections
      detections.forEach((detection, index) => {
        const { bbox } = detection
        const scaleX = scaledWidth / imageSize[1]
        const scaleY = scaledHeight / imageSize[0]

        if (isMobile) {
          // On mobile, allow clicking anywhere within the bounding box
          const x1 = bbox.x1 * scaleX + offsetX
          const y1 = bbox.y1 * scaleY + offsetY
          const x2 = bbox.x2 * scaleX + offsetX
          const y2 = bbox.y2 * scaleY + offsetY

          if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            if (onMobileStitchClick) {
              onMobileStitchClick(index, event.currentTarget)
            } else {
              onStitchClick(index)
            }
          }
        } else {
          // On desktop, check clicks on the number badge circle
          const bboxCenterX = ((bbox.x1 + bbox.x2) / 2) * scaleX + offsetX
          const bboxCenterY = bbox.y1 * scaleY + offsetY - Math.max(10, 6 * zoom)

          const radius = Math.max(10, 6 * zoom)
          const distance = Math.sqrt((x - bboxCenterX) ** 2 + (y - bboxCenterY) ** 2)

          if (distance <= radius) {
            onStitchClick(index)
          }
        }
      })
    },
    [detections, imageSize, zoom, pan, isDragging, onStitchClick, onMobileStitchClick, isMobile]
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!isMobile) {
        const delta = event.deltaY > 0 ? 0.9 : 1.1
        setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)))
      }
    },
    [isMobile]
  )

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <Box sx={{ position: "relative", height: "100%" }}>
      {/* Image Controls - Desktop Only */}
      {!isMobile && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              display: "flex",
              gap: 1,
            }}>
            <Tooltip title="Zoom In">
              <IconButton
                size="small"
                aria-label="Zoom In"
                onClick={() => setZoom((prev) => Math.min(3, prev * 1.2))}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.light, 0.9),
                  color: "white",
                  width: 40,
                  height: 40,
                  "&:hover": { backgroundColor: theme.palette.primary.light },
                }}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton
                size="small"
                aria-label="Zoom Out"
                onClick={() => setZoom((prev) => Math.max(0.5, prev * 0.8))}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.light, 0.9),
                  color: "white",
                  width: 40,
                  height: 40,
                  "&:hover": { backgroundColor: theme.palette.primary.light },
                }}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset View">
              <IconButton
                size="small"
                aria-label="Reset View"
                onClick={resetView}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.light, 0.9),
                  color: "white",
                  width: 40,
                  height: 40,
                  "&:hover": { backgroundColor: theme.palette.primary.light },
                }}>
                <CenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Zoom indicator - Desktop Only */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 2,
              backgroundColor: alpha(theme.palette.primary.light, 0.9),
              color: "white",
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: "0.75rem",
              fontWeight: 600,
            }}>
            {Math.round(zoom * 100)}%
          </Box>
        </>
      )}

      {/* Canvas Container */}
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          cursor: isMobile ? "default" : isDragging ? "grabbing" : "grab",
          position: "relative",
        }}
        onWheel={handleWheel}>
        {imageLoaded ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              touchAction: isMobile ? "pinch-zoom" : "none",
            }}
          />
        ) : detections.length > 0 ? (
          // Only show placeholder if we have analysis results (backend should have converted HEIC)
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              backgroundColor: alpha(theme.palette.text.secondary, 0.05),
              border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
              borderRadius: 2,
              flexDirection: "column",
              gap: 2,
            }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <MedicalIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.secondary.main,
                textAlign: "center",
                fontWeight: 600,
              }}>
              Image Analyzed Successfully
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                maxWidth: 280,
                px: 2,
              }}>
              Image preview not available, but analysis completed successfully.
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.suture.good,
                fontWeight: 600,
                mt: 1,
              }}>
              {detections.length} suture{detections.length !== 1 ? "s" : ""} detected
            </Typography>
          </Box>
        ) : (
          // Show loading state or empty canvas while processing
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              backgroundColor: alpha(theme.palette.text.secondary, 0.02),
            }}>
            <CircularProgress size={40} sx={{ color: theme.palette.secondary.main }} />
          </Box>
        )}
      </Box>

      {/* Instructions - Desktop Only */}
      {!isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 2,
            backgroundColor: alpha(theme.palette.primary.light, 0.9),
            color: "white",
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: "0.75rem",
            maxWidth: 200,
          }}>
          Click badges to analyze • Drag to pan • Scroll to zoom
        </Box>
      )}
    </Box>
  )
}
