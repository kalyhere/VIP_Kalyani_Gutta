/**
 * Debrief Store - Zustand v5
 * Manages state for the Debrief application
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { HealthData, EvaluationScore, ParsedReport } from "../types"

// Re-export types for convenience
export type { HealthData, EvaluationScore, ParsedReport }

// ===== Types =====

interface DebriefState {
  // ===== Core Data State =====
  healthData: HealthData | null
  selectedFile: File | null
  report: string | null
  parsedReport: ParsedReport | null

  // ===== UI State - File Upload =====
  preview: string | null
  uploading: boolean
  uploadSuccess: boolean

  // ===== UI State - Report Generation =====
  generating: boolean

  // ===== UI State - Report Display =====
  showDetails: boolean

  // ===== UI State - Connection =====
  loading: boolean

  // ===== UI State - Error Handling =====
  error: string | null

  // ===== Actions - Health Management =====
  /** Set health data from backend */
  setHealthData: (data: HealthData | null) => void

  // ===== Actions - File Management =====
  /** Set selected file and reset related state */
  setSelectedFile: (file: File | null) => void
  /** Set file preview content */
  setPreview: (preview: string | null) => void
  /** Toggle uploading state */
  setUploading: (uploading: boolean) => void
  /** Toggle upload success state */
  setUploadSuccess: (success: boolean) => void

  // ===== Actions - Report Management =====
  /** Set raw report data */
  setReport: (report: string | null) => void
  /** Set parsed report data */
  setParsedReport: (report: ParsedReport | null) => void
  /** Toggle report generation state */
  setGenerating: (generating: boolean) => void

  // ===== Actions - UI State =====
  /** Toggle full report details dialog */
  setShowDetails: (show: boolean) => void
  /** Toggle connection loading state */
  setLoading: (loading: boolean) => void
  /** Set error message (null to clear) */
  setError: (error: string | null) => void

  // ===== Actions - Complex Operations =====
  /** Start file upload process */
  startUpload: () => void
  /** Complete file upload */
  completeUpload: () => void
  /** Fail file upload with error */
  failUpload: (errorMessage: string) => void
  /** Start report generation */
  startReportGeneration: () => void
  /** Complete report generation */
  completeReportGeneration: (report: string, parsedReport: ParsedReport) => void
  /** Fail report generation with error */
  failReportGeneration: (errorMessage: string) => void
  /** Reset file and report state for new upload */
  resetForNewUpload: () => void

  // ===== Actions - Reset =====
  /** Reset entire store to initial state */
  reset: () => void
}

// ===== Initial State =====

const initialState = {
  // Core Data State
  healthData: null,
  selectedFile: null,
  report: null,
  parsedReport: null,

  // UI State - File Upload
  preview: null,
  uploading: false,
  uploadSuccess: false,

  // UI State - Report Generation
  generating: false,

  // UI State - Report Display
  showDetails: false,

  // UI State - Connection
  loading: true,

  // UI State - Error Handling
  error: null,
}

// ===== Store =====

export const useDebriefStore = create<DebriefState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Health Management Actions
      setHealthData: (data) => set({ healthData: data }, false, "setHealthData"),

      // File Management Actions
      setSelectedFile: (file) =>
        set(
          {
            selectedFile: file,
            report: null,
            parsedReport: null,
            uploadSuccess: false,
            error: null,
          },
          false,
          "setSelectedFile"
        ),

      setPreview: (preview) => set({ preview }, false, "setPreview"),

      setUploading: (uploading) => set({ uploading }, false, "setUploading"),

      setUploadSuccess: (success) => set({ uploadSuccess: success }, false, "setUploadSuccess"),

      // Report Management Actions
      setReport: (report) => set({ report }, false, "setReport"),

      setParsedReport: (report) => set({ parsedReport: report }, false, "setParsedReport"),

      setGenerating: (generating) => set({ generating }, false, "setGenerating"),

      // UI State Actions
      setShowDetails: (show) => set({ showDetails: show }, false, "setShowDetails"),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      // Complex Operations
      startUpload: () =>
        set(
          {
            uploading: true,
            error: null,
          },
          false,
          "startUpload"
        ),

      completeUpload: () =>
        set(
          {
            uploading: false,
            uploadSuccess: true,
          },
          false,
          "completeUpload"
        ),

      failUpload: (errorMessage) =>
        set(
          {
            uploading: false,
            uploadSuccess: false,
            error: errorMessage,
          },
          false,
          "failUpload"
        ),

      startReportGeneration: () =>
        set(
          {
            generating: true,
            report: null,
            parsedReport: null,
            error: null,
          },
          false,
          "startReportGeneration"
        ),

      completeReportGeneration: (report, parsedReport) =>
        set(
          {
            generating: false,
            report,
            parsedReport,
            error: null,
          },
          false,
          "completeReportGeneration"
        ),

      failReportGeneration: (errorMessage) =>
        set(
          {
            generating: false,
            error: errorMessage,
          },
          false,
          "failReportGeneration"
        ),

      resetForNewUpload: () =>
        set(
          {
            selectedFile: null,
            preview: null,
            report: null,
            parsedReport: null,
            uploadSuccess: false,
            error: null,
          },
          false,
          "resetForNewUpload"
        ),

      // Reset Action
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "DebriefStore" }
  )
)

// ===== Selectors (for better performance) =====

// Core data selectors
export const selectHealthData = (state: DebriefState) => state.healthData
export const selectSelectedFile = (state: DebriefState) => state.selectedFile
export const selectReport = (state: DebriefState) => state.report
export const selectParsedReport = (state: DebriefState) => state.parsedReport

// File upload selectors
export const selectPreview = (state: DebriefState) => state.preview
export const selectUploading = (state: DebriefState) => state.uploading
export const selectUploadSuccess = (state: DebriefState) => state.uploadSuccess

// Report generation selectors
export const selectGenerating = (state: DebriefState) => state.generating

// UI state selectors
export const selectShowDetails = (state: DebriefState) => state.showDetails
export const selectLoading = (state: DebriefState) => state.loading

// Error handling selectors
export const selectError = (state: DebriefState) => state.error

// ===== Convenience Hooks =====

/**
 * DEPRECATED: Do not use these convenience hooks in components!
 * They return new objects on every render, causing infinite re-renders.
 *
 * Instead, use individual selectors like:
 * const selectedFile = useDebriefStore((state) => state.selectedFile)
 * const setSelectedFile = useDebriefStore((state) => state.setSelectedFile)
 *
 * See: https://zustand.docs.pmnd.rs/migrations/migrating-to-v5#requiring-stable-selector-outputs
 */

// Hook to get all file upload state
// @deprecated Use individual selectors instead
export const useFileUploadState = () =>
  useDebriefStore((state) => ({
    selectedFile: state.selectedFile,
    preview: state.preview,
    uploading: state.uploading,
    uploadSuccess: state.uploadSuccess,
  }))

// Hook to get all file upload actions
// @deprecated Use individual selectors instead
export const useFileUploadActions = () =>
  useDebriefStore((state) => ({
    setSelectedFile: state.setSelectedFile,
    setPreview: state.setPreview,
    startUpload: state.startUpload,
    completeUpload: state.completeUpload,
    failUpload: state.failUpload,
  }))

// Hook to get all report state
// @deprecated Use individual selectors instead
export const useReportState = () =>
  useDebriefStore((state) => ({
    report: state.report,
    parsedReport: state.parsedReport,
    generating: state.generating,
    showDetails: state.showDetails,
  }))

// Hook to get all report actions
// @deprecated Use individual selectors instead
export const useReportActions = () =>
  useDebriefStore((state) => ({
    setReport: state.setReport,
    setParsedReport: state.setParsedReport,
    startReportGeneration: state.startReportGeneration,
    completeReportGeneration: state.completeReportGeneration,
    failReportGeneration: state.failReportGeneration,
    setShowDetails: state.setShowDetails,
  }))
