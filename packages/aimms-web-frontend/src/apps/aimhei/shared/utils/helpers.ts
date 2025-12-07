/**
 * Helper Functions for AIMHEI
 *
 * Utility functions for score colors, avatar colors, and transcript processing
 */

import type { Theme } from "@mui/material"
import type { AIMHEIConfig } from "../../features/upload/hooks/useAIMHEIConfig"

/**
 * Get color for score based on value
 * Now uses MUI theme palette
 */
export const getScoreColor = (score: number | null, theme: Theme): string => {
  if (score === null) return theme.palette.text.disabled
  if (score >= 80) return theme.palette.secondary.light
  if (score >= 60) return theme.palette.secondary.main
  return theme.palette.primary.main
}

/**
 * Get avatar color based on title hash
 * Now uses MUI theme palette
 */
export const getAvatarColor = (title: string | null | undefined, theme: Theme): string => {
  if (!title) return theme.palette.text.disabled

  // Simple hash to get consistent colors based on title
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    theme.palette.secondary.main,
    theme.palette.secondary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
    theme.palette.secondary.dark,
    theme.palette.primary.light,
  ]

  return colors[Math.abs(hash) % colors.length]
}

export interface SubmitTranscriptParams {
  transcriptFile: File
  config: AIMHEIConfig
  criteriaFile: File | null
}

export interface SubmitTranscriptResult {
  success: boolean
  job_id?: string
  message?: string
}

/**
 * Submit transcript and config to backend for async processing
 */
export async function submitTranscriptForProcessing(
  params: SubmitTranscriptParams
): Promise<SubmitTranscriptResult> {
  const { transcriptFile, config, criteriaFile } = params

  const formData = new FormData()

  // Create config file with proper field name mapping for backend
  const backendConfig = {
    model: config.model,
    report_name: config.report_name,
    formatting_process: "none", // Default formatting process
    HCP_name: config.hcp_name,
    HCP_year: parseInt(config.hcp_year),
    patient_ID: config.patient_id,
    human_supervisor: config.human_supervisor,
    interview_date: config.interview_date,
    aispe_location: config.aispe_location,
  }

  const configBlob = new Blob([JSON.stringify(backendConfig)], { type: "application/json" })
  const configFile = new File([configBlob], "config.json", { type: "application/json" })

  formData.append("transcript", transcriptFile)
  formData.append("config", configFile)

  // Add criteria file if user uploaded one
  if (criteriaFile) {
    formData.append("criteria", criteriaFile)
  }

  const token = localStorage.getItem("auth_token")
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

  // Submit job to async endpoint
  const response = await fetch(`${apiUrl}/api/transcripts/submit-async`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || "Failed to submit transcript for processing")
  }

  const data = await response.json()

  return data
}
