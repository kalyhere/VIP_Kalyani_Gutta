/**
 * ConfigurationForm Component
 *
 * Form for configuring AIMHEI analysis parameters
 */

import React from "react"
import { Stack, Button, Box, CircularProgress, useTheme } from "@mui/material"
import { format } from "date-fns"
import { Dayjs } from "dayjs"
import ProcessIcon from "@mui/icons-material/AutoAwesomeMotion"
import {
  UATextField,
  UASelect,
  UADateTimePicker,
  FieldGroup,
} from "../../../../../components/StyledFormComponents"
import { ProgressIndicator } from "../../processing/components/ProgressIndicator"
import { ErrorDisplay } from "../../processing/components/ErrorDisplay"

import type { AIMHEIConfig, ValidationErrors } from "../hooks/useAIMHEIConfig"

// Spacing constants
const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

export interface ConfigurationFormProps {
  config: AIMHEIConfig
  interviewDate: Dayjs | null
  validationErrors: ValidationErrors
  processing: boolean
  processingProgress: number
  processingMessage: string
  jobId: string | null
  error: string | null
  transcriptFile: File | null

  onConfigUpdate: (key: keyof AIMHEIConfig, value: string) => void
  onInterviewDateChange: (date: Dayjs | null) => void
  onProcessClick: () => void
}

/**
 * Configuration form for AIMHEI analysis
 */
export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  config,
  interviewDate,
  validationErrors,
  processing,
  processingProgress,
  processingMessage,
  jobId,
  error,
  transcriptFile,
  onConfigUpdate,
  onInterviewDateChange,
  onProcessClick,
}) => {
  const theme = useTheme()
  return (
  <Stack spacing={spacing.lg}>
    {/* Report Name */}
    <UATextField
      fullWidth
      required
      label="Report Name"
      value={config.report_name}
      onChange={(e) => onConfigUpdate("report_name", e.target.value)}
      placeholder="Enter a name for this analysis"
      error={!!validationErrors.report_name}
      helperText={validationErrors.report_name}
    />

    {/* Interview Date & Time */}
    <UADateTimePicker
      label="Interview Date & Time"
      value={interviewDate}
      onChange={(newDate) => {
        onInterviewDateChange(newDate)
        if (newDate && newDate.isValid()) {
          onConfigUpdate("interview_date", format(newDate.toDate(), "yyyy-MM-dd"))
        }
      }}
      error={!!validationErrors.interview_date}
    />

    {/* Clinical Supervisor and Interview Location */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 2,
      }}>
      <UATextField
        fullWidth
        required
        label="Clinical Supervisor"
        value={config.human_supervisor}
        onChange={(e) => onConfigUpdate("human_supervisor", e.target.value)}
        error={!!validationErrors.human_supervisor}
        helperText={validationErrors.human_supervisor}
      />
      <UATextField
        fullWidth
        required
        label="Interview Location"
        value={config.aispe_location}
        onChange={(e) => onConfigUpdate("aispe_location", e.target.value)}
        error={!!validationErrors.aispe_location}
        helperText={validationErrors.aispe_location}
      />
    </Box>

    {/* Provider and Patient Info */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 2,
      }}>
      <UATextField
        fullWidth
        required
        label="Healthcare Provider Name"
        value={config.hcp_name}
        onChange={(e) => onConfigUpdate("hcp_name", e.target.value)}
        error={!!validationErrors.hcp_name}
        helperText={validationErrors.hcp_name}
      />
      <UATextField
        fullWidth
        required
        label="Academic Year"
        value={config.hcp_year}
        onChange={(e) => onConfigUpdate("hcp_year", e.target.value)}
        placeholder="e.g., 2024"
        error={!!validationErrors.hcp_year}
        helperText={validationErrors.hcp_year}
      />
      <UATextField
        fullWidth
        required
        label="Patient ID"
        value={config.patient_id}
        onChange={(e) => onConfigUpdate("patient_id", e.target.value)}
        error={!!validationErrors.patient_id}
        helperText={validationErrors.patient_id}
      />
      <UASelect
        label="AI Model"
        value={config.model}
        onChange={(value) => onConfigUpdate("model", value)}
        options={[
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gpt-4o-mini", label: "GPT-4o Mini" },
          { value: "gpt-4", label: "GPT-4" },
        ]}
      />
    </Box>

    {/* Process Button */}
    <Box sx={{ pt: spacing.md }}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onProcessClick}
        disabled={
          !transcriptFile
          || processing
          || Object.values(validationErrors).some((error) => error !== undefined)
        }
        startIcon={processing && <CircularProgress size={20} />}
        sx={{
          bgcolor: theme.palette.primary.main,
          "&:hover": { bgcolor: theme.palette.primary.dark },
          "&:disabled": {
            bgcolor: theme.palette.divider,
            color: theme.palette.background.paper,
          },
          height: 48,
          fontWeight: 600,
          textTransform: "none",
        }}>
        {processing ? "Processing..." : "Analyze Transcript"}
      </Button>

      {/* Progress Display */}
      {processing && (
        <Box sx={{ mt: 2 }}>
          <ProgressIndicator
            progress={processingProgress}
            message={processingMessage}
            jobId={jobId}
          />
        </Box>
      )}
    </Box>

    {/* Error Display */}
    {error && <ErrorDisplay error={error} />}
  </Stack>
  )
}
