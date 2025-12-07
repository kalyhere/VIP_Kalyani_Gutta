/**
 * LoadingTile Component
 * Displays a loading card with progress during processing
 */

import React from "react"
import { Box, Card, CardContent, Typography, CircularProgress, alpha, useTheme } from "@mui/material"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FlexCenterVertical } from "@/components/styled"

export interface LoadingTileProps {
  title: string
  progress: number
  message: string
}

const generateProcessingMessage = (progress: number, baseMessage: string): string => {
  // If we have a specific message from the server, use it for lower progress
  if (progress < 40 && baseMessage && !baseMessage.includes("Processing")) {
    return baseMessage
  }

  const medicalTerms = [
    "neuroplasticity matrices",
    "synaptic coherence patterns",
    "diagnostic resonance fields",
    "empathic wavelength calibration",
    "therapeutic algorithm vectors",
    "patient rapport coefficients",
    "clinical intuition parameters",
    "bedside manner analytics",
    "compassion index calculations",
    "communication efficacy scores",
    "interpersonal diagnostic matrices",
    "empathy gradient analysis",
    "therapeutic presence indicators",
    "healing frequency modulation",
    "care quality algorithms",
    "patient-centered optimization",
    "holistic assessment protocols",
    "humanistic factor analysis",
  ]

  const technicalVerbs = [
    "Recalibrating",
    "Optimizing",
    "Synthesizing",
    "Harmonizing",
    "Quantifying",
    "Triangulating",
    "Normalizing",
    "Interpolating",
    "Contextualizing",
    "Correlating",
    "Extrapolating",
    "Decompiling",
    "Vectorizing",
    "Analyzing",
    "Cross-referencing",
  ]

  const processingPhases = [
    "temporal coherence patterns",
    "multi-dimensional care vectors",
    "quantum empathy states",
    "advanced healing methodologies",
    "integrated wellness parameters",
    "comprehensive care indices",
    "patient interaction dynamics",
    "therapeutic communication flows",
    "clinical excellence metrics",
    "compassionate response algorithms",
    "holistic assessment frameworks",
    "healing-centered analytics",
  ]

  // Different message styles based on progress
  if (progress < 20) {
    return baseMessage || "Initializing medical assessment protocols..."
  }
  if (progress < 40) {
    return baseMessage || "Parsing transcript and clinical interactions..."
  }
  if (progress < 60) {
    const term = medicalTerms[Math.floor(Math.random() * medicalTerms.length)]
    const verb = technicalVerbs[Math.floor(Math.random() * technicalVerbs.length)]
    return `${verb} ${term}...`
  }
  if (progress < 80) {
    const phase = processingPhases[Math.floor(Math.random() * processingPhases.length)]
    return `Computing ${phase}...`
  }
  if (progress < 95) {
    return "Finalizing compassion algorithms and empathy metrics..."
  }
  return "Generating comprehensive AIMHEI assessment report..."
}

export const LoadingTile: React.FC<LoadingTileProps> = ({ title, progress, message }) => {
  const theme = useTheme()
  return (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}>
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 3,
        transition: "all 0.2s ease",
        border: `1px solid ${alpha(theme.palette.secondary.light, 0.3)}`,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.text.disabled, 0.08)}`,
        mb: 2,
        pointerEvents: "none",
        opacity: 0.95,
        "&:hover": {
          transform: "none",
          boxShadow: `0 2px 8px ${alpha(theme.palette.text.disabled, 0.08)}`,
          borderColor: alpha(theme.palette.secondary.light, 0.3),
        },
      }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 2 }}>
          <FlexCenterVertical justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                color: theme.palette.text.primary,
                fontSize: "1.1rem",
                mb: 0.5,
              }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 500,
              }}>
              Processing •
              {" "}
              {format(new Date(), "MMM d, yyyy h:mm a")}
            </Typography>
          </Box>

          {/* Progress Percentage */}
          <FlexCenterVertical gap={1} sx={{ minWidth: "fit-content" }}>
            <CircularProgress size={20} thickness={4} sx={{ color: theme.palette.secondary.light }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.secondary.main,
                fontSize: "1rem",
                minWidth: "45px",
                textAlign: "right",
              }}>
              {Math.round(progress)}%
            </Typography>
          </FlexCenterVertical>
        </FlexCenterVertical>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.secondary.light, 0.15),
              overflow: "hidden",
              position: "relative",
            }}>
            <motion.div
              style={{
                height: "100%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.light, 0.3)}`,
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                type: "tween",
              }}
            />

            {/* Shimmer effect */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.background.paper, 0.4)}, transparent)`,
                animation: "shimmer 2s infinite",
                "@keyframes shimmer": {
                  "0%": { transform: "translateX(-100%)" },
                  "100%": { transform: "translateX(100%)" },
                },
              }}
            />
          </Box>
        </Box>

        {/* Status Message */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.85rem",
            lineHeight: 1.4,
            fontStyle: "italic",
          }}>
          {generateProcessingMessage(progress, message)}
        </Typography>
      </CardContent>
    </Card>
  </motion.div>
  )
}
