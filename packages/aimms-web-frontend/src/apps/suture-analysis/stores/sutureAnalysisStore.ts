/**
 * Suture Analysis Store - Zustand v5
 * Manages state for the Suture Analysis application
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { AnalysisResult } from "../types"

// ===== Types =====

interface SutureAnalysisState {
  // ===== Core Data State =====
  analysisResult: AnalysisResult | null
  uploadedImage: string | null

  // ===== UI State - Analysis Flow =====
  isAnalyzing: boolean
  showResults: boolean
  isTransitioning: boolean

  // ===== UI State - Error Handling =====
  error: string | null

  // ===== Actions - Analysis Management =====
  /** Set analysis result data */
  setAnalysisResult: (result: AnalysisResult | null) => void
  /** Set uploaded image URL */
  setUploadedImage: (imageUrl: string | null) => void

  // ===== Actions - UI State =====
  /** Toggle analyzing state */
  setIsAnalyzing: (isAnalyzing: boolean) => void
  /** Toggle results visibility */
  setShowResults: (show: boolean) => void
  /** Toggle transition state */
  setIsTransitioning: (isTransitioning: boolean) => void

  // ===== Actions - Error Handling =====
  /** Set error message (null to clear) */
  setError: (error: string | null) => void

  // ===== Actions - Complex Operations =====
  /** Start analysis (sets loading state and clears errors) */
  startAnalysis: () => void
  /** Complete analysis with result */
  completeAnalysis: (result: AnalysisResult, imageUrl?: string) => void
  /** Fail analysis with error */
  failAnalysis: (errorMessage: string) => void
  /** Reset entire analysis state */
  resetAnalysis: () => void

  // ===== Actions - Reset =====
  /** Reset entire store to initial state */
  reset: () => void
}

// ===== Initial State =====

const initialState = {
  // Core Data State
  analysisResult: null,
  uploadedImage: null,

  // UI State - Analysis Flow
  isAnalyzing: false,
  showResults: false,
  isTransitioning: false,

  // UI State - Error Handling
  error: null,
}

// ===== Store =====

export const useSutureAnalysisStore = create<SutureAnalysisState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic Setters
      setAnalysisResult: (result) => set({ analysisResult: result }, false, "setAnalysisResult"),

      setUploadedImage: (imageUrl) => set({ uploadedImage: imageUrl }, false, "setUploadedImage"),

      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }, false, "setIsAnalyzing"),

      setShowResults: (show) => set({ showResults: show }, false, "setShowResults"),

      setIsTransitioning: (isTransitioning) => set({ isTransitioning }, false, "setIsTransitioning"),

      setError: (error) => set({ error }, false, "setError"),

      // Complex Operations
      startAnalysis: () =>
        set(
        {
          isAnalyzing: true,
          error: null,
          isTransitioning: false,
        },
        false,
        "startAnalysis"
        ),

      completeAnalysis: (result, imageUrl) =>
        set(
        {
          analysisResult: result,
          uploadedImage: imageUrl || get().uploadedImage,
          isAnalyzing: false,
          showResults: true,
          isTransitioning: false,
          error: null,
        },
        false,
        "completeAnalysis"
        ),

      failAnalysis: (errorMessage) =>
        set(
        {
          error: errorMessage,
          isAnalyzing: false,
          isTransitioning: false,
        },
        false,
        "failAnalysis"
        ),

      resetAnalysis: () =>
        set(
        {
          analysisResult: null,
          uploadedImage: null,
          showResults: false,
          isTransitioning: false,
          error: null,
        },
        false,
        "resetAnalysis"
        ),

      // Reset Action
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "SutureAnalysisStore" }
  )
)

// ===== Selectors (for better performance) =====

// Core data selectors
export const selectAnalysisResult = (state: SutureAnalysisState) => state.analysisResult
export const selectUploadedImage = (state: SutureAnalysisState) => state.uploadedImage

// UI state selectors
export const selectIsAnalyzing = (state: SutureAnalysisState) => state.isAnalyzing
export const selectShowResults = (state: SutureAnalysisState) => state.showResults
export const selectIsTransitioning = (state: SutureAnalysisState) => state.isTransitioning

// Error handling selectors
export const selectError = (state: SutureAnalysisState) => state.error

// ===== Convenience Hooks =====

/**
 * DEPRECATED: Do not use these convenience hooks in components!
 * They return new objects on every render, causing infinite re-renders.
 *
 * Instead, use individual selectors like:
 * const analysisResult = useSutureAnalysisStore((state) => state.analysisResult)
 * const startAnalysis = useSutureAnalysisStore((state) => state.startAnalysis)
 *
 * See: https://zustand.docs.pmnd.rs/migrations/migrating-to-v5#requiring-stable-selector-outputs
 */

// Hook to get all analysis state
// @deprecated Use individual selectors instead
export const useAnalysisState = () =>
  useSutureAnalysisStore((state) => ({
  analysisResult: state.analysisResult,
  uploadedImage: state.uploadedImage,
  isAnalyzing: state.isAnalyzing,
  showResults: state.showResults,
  isTransitioning: state.isTransitioning,
  error: state.error,
}))

// Hook to get all analysis actions
// @deprecated Use individual selectors instead
export const useAnalysisActions = () =>
  useSutureAnalysisStore((state) => ({
  setAnalysisResult: state.setAnalysisResult,
  setUploadedImage: state.setUploadedImage,
  setIsAnalyzing: state.setIsAnalyzing,
  setShowResults: state.setShowResults,
  setIsTransitioning: state.setIsTransitioning,
  setError: state.setError,
  startAnalysis: state.startAnalysis,
  completeAnalysis: state.completeAnalysis,
  failAnalysis: state.failAnalysis,
  resetAnalysis: state.resetAnalysis,
}))
