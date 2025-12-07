/**
 * UploadPanel Component
 *
 * Left panel for file upload and configuration in ModernAIMHEI
 */

import React, { useRef } from "react"
import { Box, Paper, Typography, Divider, Stack, Checkbox, FormControlLabel, useTheme } from "@mui/material"
import { Dayjs } from "dayjs"
import UploadIcon from "@mui/icons-material/CloudUpload"
import DataObjectIcon from "@mui/icons-material/DataObject"
import { FormSectionHeader } from "../../../../../components/StyledFormComponents"
import { FlexColumn } from "@/components/styled"
import { FileDropzone } from "./FileDropzone"
import { ConfigurationForm } from "./ConfigurationForm"
import type { AIMHEIConfig, ValidationErrors } from "../hooks/useAIMHEIConfig"

// Spacing constants
const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

const typography = {
  caption: {
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  h3: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
}

export interface UploadPanelProps {
  // File upload state
  transcriptFile: File | null
  isDragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  validationErrors: ValidationErrors

  // File upload handlers
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileSelect: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: () => void

  // Custom criteria state
  useCustomCriteria: boolean
  setUseCustomCriteria: (value: boolean) => void
  criteriaFile: File | null
  isCriteriaDragOver: boolean
  criteriaFileInputRef: React.RefObject<HTMLInputElement>

  // Custom criteria handlers
  handleCriteriaDragOver: (e: React.DragEvent) => void
  handleCriteriaDragLeave: (e: React.DragEvent) => void
  handleCriteriaDrop: (e: React.DragEvent) => void
  handleCriteriaFileSelect: () => void
  handleCriteriaFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeCriteriaFile: () => void

  // Configuration
  config: AIMHEIConfig
  interviewDate: Dayjs | null
  processing: boolean
  processingProgress: number
  processingMessage: string
  jobId: string | null
  error: string | null

  // Configuration handlers
  updateConfig: (key: keyof AIMHEIConfig, value: string) => void
  setInterviewDate: (date: Dayjs | null) => void
  processTranscript: () => void
}

/**
 * Upload panel for file upload and configuration
 */
export const UploadPanel: React.FC<UploadPanelProps> = ({
  transcriptFile,
  isDragOver,
  fileInputRef,
  validationErrors,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
  handleFileChange,
  removeFile,
  useCustomCriteria,
  setUseCustomCriteria,
  criteriaFile,
  isCriteriaDragOver,
  criteriaFileInputRef,
  handleCriteriaDragOver,
  handleCriteriaDragLeave,
  handleCriteriaDrop,
  handleCriteriaFileSelect,
  handleCriteriaFileChange,
  removeCriteriaFile,
  config,
  interviewDate,
  processing,
  processingProgress,
  processingMessage,
  jobId,
  error,
  updateConfig,
  setInterviewDate,
  processTranscript,
}) => {
  const theme = useTheme()
  return (
  <Paper
    elevation={0}
    variant="outlined"
    sx={{
      height: "100%",
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      overflow: "auto",
    }}>
    <FlexColumn sx={{ height: "100%" }}>
    <Box
      sx={{
        p: spacing.lg,
        pb: spacing.md,
        flexShrink: 0
      }}>
      <Typography
        variant="overline"
        sx={{
          ...typography.caption,
          color: theme.palette.secondary.main,
          display: "block",
          lineHeight: 1.2,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          mb: spacing.xs,
        }}>
        Configuration
      </Typography>
      <Typography
        variant="h6"
        sx={{
          ...typography.h3,
          color: theme.palette.text.primary,
        }}>
        Upload & Settings
      </Typography>
    </Box>
    <Divider sx={{ mx: spacing.lg }} />
    <Box sx={{ p: spacing.lg, pt: spacing.md, flexGrow: 1, overflow: "auto" }}>
      <Stack spacing={spacing.lg}>
        {/* File Upload Section */}
        <Box>
          <FileDropzone
            file={transcriptFile}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemove={removeFile}
            accept=".txt,text/plain"
            title="Transcript Upload"
            subtitle="Drop transcript file here"
            error={validationErrors.file}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </Box>

        {/* Scoring Criteria (Optional) */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={(
              <Checkbox
                checked={useCustomCriteria}
                id="use-custom-criteria"
                name="use-custom-criteria"
                onChange={(e) => {
                  setUseCustomCriteria(e.target.checked)
                  if (!e.target.checked) {
                    removeCriteriaFile()
                  }
                }}
                size="small"
                sx={{
                  color: theme.palette.secondary.main,
                  "&.Mui-checked": { color: theme.palette.secondary.main },
                }}
              />
            )}
            label={(
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontSize: "0.6875rem",
                }}>
                Use Custom Scoring Criteria (Optional)
              </Typography>
            )}
          />

          {useCustomCriteria && (
            <Box sx={{ mt: 1.5 }}>
              <FileDropzone
                file={criteriaFile}
                isDragOver={isCriteriaDragOver}
                onDragOver={handleCriteriaDragOver}
                onDragLeave={handleCriteriaDragLeave}
                onDrop={handleCriteriaDrop}
                onFileSelect={handleCriteriaFileSelect}
                onRemove={removeCriteriaFile}
                accept=".json,application/json"
                title="Custom Scoring Criteria"
                subtitle="Drop criteria.json here"
              />
              <input
                ref={criteriaFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleCriteriaFileChange}
                style={{ display: "none" }}
              />
            </Box>
          )}
        </Box>

        {/* Configuration Section */}
        <Box>
          <FormSectionHeader
            icon={<DataObjectIcon sx={{ fontSize: 20 }} />}
            title="Analysis Configuration"
            subtitle="Configure the AI analysis parameters"
          />

          <ConfigurationForm
            config={config}
            interviewDate={interviewDate}
            validationErrors={validationErrors}
            processing={processing}
            processingProgress={processingProgress}
            processingMessage={processingMessage}
            jobId={jobId}
            error={error}
            transcriptFile={transcriptFile}
            onConfigUpdate={updateConfig}
            onInterviewDateChange={setInterviewDate}
            onProcessClick={processTranscript}
          />
        </Box>
      </Stack>
    </Box>
    </FlexColumn>
  </Paper>
  )
}
