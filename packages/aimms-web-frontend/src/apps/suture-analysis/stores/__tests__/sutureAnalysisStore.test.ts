/**
 * Suture Analysis Store Tests
 * Tests for Zustand state management in Suture Analysis
 */

import { describe, it, expect, beforeEach } from "vitest"
import { useSutureAnalysisStore } from "../sutureAnalysisStore"
import type { AnalysisResult } from "../../types"

describe("sutureAnalysisStore", () => {
  // Reset store before each test
  beforeEach(() => {
    useSutureAnalysisStore.getState().reset()
  })

  describe("Initial State", () => {
    it("should initialize with null analysis result", () => {
      const { analysisResult } = useSutureAnalysisStore.getState()
      expect(analysisResult).toBeNull()
    })

    it("should initialize with null uploaded image", () => {
      const { uploadedImage } = useSutureAnalysisStore.getState()
      expect(uploadedImage).toBeNull()
    })

    it("should initialize with isAnalyzing false", () => {
      const { isAnalyzing } = useSutureAnalysisStore.getState()
      expect(isAnalyzing).toBe(false)
    })

    it("should initialize with showResults false", () => {
      const { showResults } = useSutureAnalysisStore.getState()
      expect(showResults).toBe(false)
    })

    it("should initialize with isTransitioning false", () => {
      const { isTransitioning } = useSutureAnalysisStore.getState()
      expect(isTransitioning).toBe(false)
    })

    it("should initialize with null error", () => {
      const { error } = useSutureAnalysisStore.getState()
      expect(error).toBeNull()
    })
  })

  describe("Basic Setters", () => {
    it("should set analysis result", () => {
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [],
        measurements: {
          stitch_count: 5,
          stitch_lengths: [10, 12, 11, 10, 13],
          average_stitch_length: 11.2,
          stitch_angles: [45, 50, 48, 47, 49],
          average_angle: 47.8,
          quality_assessment: "good",
        },
        processed_by: "test-server",
      }

      useSutureAnalysisStore.getState().setAnalysisResult(mockResult)
      const { analysisResult } = useSutureAnalysisStore.getState()

      expect(analysisResult).toEqual(mockResult)
    })

    it("should set uploaded image", () => {
      const imageUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

      useSutureAnalysisStore.getState().setUploadedImage(imageUrl)
      const { uploadedImage } = useSutureAnalysisStore.getState()

      expect(uploadedImage).toBe(imageUrl)
    })

    it("should set isAnalyzing", () => {
      useSutureAnalysisStore.getState().setIsAnalyzing(true)
      expect(useSutureAnalysisStore.getState().isAnalyzing).toBe(true)

      useSutureAnalysisStore.getState().setIsAnalyzing(false)
      expect(useSutureAnalysisStore.getState().isAnalyzing).toBe(false)
    })

    it("should set showResults", () => {
      useSutureAnalysisStore.getState().setShowResults(true)
      expect(useSutureAnalysisStore.getState().showResults).toBe(true)

      useSutureAnalysisStore.getState().setShowResults(false)
      expect(useSutureAnalysisStore.getState().showResults).toBe(false)
    })

    it("should set isTransitioning", () => {
      useSutureAnalysisStore.getState().setIsTransitioning(true)
      expect(useSutureAnalysisStore.getState().isTransitioning).toBe(true)

      useSutureAnalysisStore.getState().setIsTransitioning(false)
      expect(useSutureAnalysisStore.getState().isTransitioning).toBe(false)
    })

    it("should set error", () => {
      const errorMessage = "Analysis failed: Network error"

      useSutureAnalysisStore.getState().setError(errorMessage)
      expect(useSutureAnalysisStore.getState().error).toBe(errorMessage)

      useSutureAnalysisStore.getState().setError(null)
      expect(useSutureAnalysisStore.getState().error).toBeNull()
    })
  })

  describe("Complex Operations", () => {
    it("should start analysis correctly", () => {
      // Set some existing error first
      useSutureAnalysisStore.getState().setError("Previous error")

      useSutureAnalysisStore.getState().startAnalysis()
      const state = useSutureAnalysisStore.getState()

      expect(state.isAnalyzing).toBe(true)
      expect(state.error).toBeNull()
      expect(state.isTransitioning).toBe(false)
    })

    it("should complete analysis correctly", () => {
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [
          {
            id: 1,
            bbox: { x1: 10, y1: 20, x2: 30, y2: 40 },
            confidence: 0.95,
            class_id: 0,
          },
        ],
        measurements: {
          stitch_count: 1,
          stitch_lengths: [10],
          average_stitch_length: 10,
          stitch_angles: [45],
          average_angle: 45,
          quality_assessment: "good",
        },
        processed_by: "test-server",
      }
      const imageUrl = "data:image/jpeg;base64,converted"

      useSutureAnalysisStore.getState().startAnalysis()
      useSutureAnalysisStore.getState().completeAnalysis(mockResult, imageUrl)
      const state = useSutureAnalysisStore.getState()

      expect(state.analysisResult).toEqual(mockResult)
      expect(state.uploadedImage).toBe(imageUrl)
      expect(state.isAnalyzing).toBe(false)
      expect(state.showResults).toBe(true)
      expect(state.isTransitioning).toBe(false)
      expect(state.error).toBeNull()
    })

    it("should complete analysis using existing image URL when not provided", () => {
      const existingImageUrl = "data:image/jpeg;base64,existing"
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [],
        measurements: {
          stitch_count: 0,
          stitch_lengths: [],
          average_stitch_length: 0,
          stitch_angles: [],
          average_angle: 0,
          quality_assessment: "none",
        },
        processed_by: "test-server",
      }

      useSutureAnalysisStore.getState().setUploadedImage(existingImageUrl)
      useSutureAnalysisStore.getState().completeAnalysis(mockResult)
      const state = useSutureAnalysisStore.getState()

      expect(state.uploadedImage).toBe(existingImageUrl)
    })

    it("should fail analysis correctly", () => {
      const errorMessage = "Failed to connect to server"

      useSutureAnalysisStore.getState().startAnalysis()
      useSutureAnalysisStore.getState().failAnalysis(errorMessage)
      const state = useSutureAnalysisStore.getState()

      expect(state.error).toBe(errorMessage)
      expect(state.isAnalyzing).toBe(false)
      expect(state.isTransitioning).toBe(false)
    })

    it("should reset analysis state", () => {
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [],
        measurements: {
          stitch_count: 0,
          stitch_lengths: [],
          average_stitch_length: 0,
          stitch_angles: [],
          average_angle: 0,
          quality_assessment: "none",
        },
        processed_by: "test-server",
      }

      // Set up some state
      useSutureAnalysisStore.getState().completeAnalysis(mockResult, "image-url")
      useSutureAnalysisStore.getState().setError("Some error")

      // Reset analysis
      useSutureAnalysisStore.getState().resetAnalysis()
      const state = useSutureAnalysisStore.getState()

      expect(state.analysisResult).toBeNull()
      expect(state.uploadedImage).toBeNull()
      expect(state.showResults).toBe(false)
      expect(state.isTransitioning).toBe(false)
      expect(state.error).toBeNull()
      // isAnalyzing should not be reset by resetAnalysis - only by reset()
    })
  })

  describe("Reset", () => {
    it("should reset entire store to initial state", () => {
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [],
        measurements: {
          stitch_count: 0,
          stitch_lengths: [],
          average_stitch_length: 0,
          stitch_angles: [],
          average_angle: 0,
          quality_assessment: "none",
        },
        processed_by: "test-server",
      }

      // Set up various state
      useSutureAnalysisStore.getState().setAnalysisResult(mockResult)
      useSutureAnalysisStore.getState().setUploadedImage("image-url")
      useSutureAnalysisStore.getState().setIsAnalyzing(true)
      useSutureAnalysisStore.getState().setShowResults(true)
      useSutureAnalysisStore.getState().setIsTransitioning(true)
      useSutureAnalysisStore.getState().setError("Error")

      // Reset
      useSutureAnalysisStore.getState().reset()
      const state = useSutureAnalysisStore.getState()

      expect(state.analysisResult).toBeNull()
      expect(state.uploadedImage).toBeNull()
      expect(state.isAnalyzing).toBe(false)
      expect(state.showResults).toBe(false)
      expect(state.isTransitioning).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe("Selectors", () => {
    it("should export selectors for direct store access", () => {
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [],
        measurements: {
          stitch_count: 0,
          stitch_lengths: [],
          average_stitch_length: 0,
          stitch_angles: [],
          average_angle: 0,
          quality_assessment: "none",
        },
        processed_by: "test-server",
      }

      useSutureAnalysisStore.getState().setAnalysisResult(mockResult)
      useSutureAnalysisStore.getState().setUploadedImage("image-url")
      useSutureAnalysisStore.getState().setIsAnalyzing(true)
      useSutureAnalysisStore.getState().setError("Test error")

      // Test that we can access state directly via getState()
      const state = useSutureAnalysisStore.getState()

      expect(state.analysisResult).toEqual(mockResult)
      expect(state.uploadedImage).toBe("image-url")
      expect(state.isAnalyzing).toBe(true)
      expect(state.error).toBe("Test error")
    })

    it("should expose all action functions", () => {
      // Test that actions are accessible via getState()
      const state = useSutureAnalysisStore.getState()

      expect(typeof state.setAnalysisResult).toBe("function")
      expect(typeof state.setUploadedImage).toBe("function")
      expect(typeof state.startAnalysis).toBe("function")
      expect(typeof state.completeAnalysis).toBe("function")
      expect(typeof state.failAnalysis).toBe("function")
      expect(typeof state.resetAnalysis).toBe("function")
    })
  })

  describe("Analysis Flow Integration", () => {
    it("should handle complete analysis flow", () => {
      // 1. Start analysis
      useSutureAnalysisStore.getState().startAnalysis()
      expect(useSutureAnalysisStore.getState().isAnalyzing).toBe(true)
      expect(useSutureAnalysisStore.getState().error).toBeNull()

      // 2. Upload image
      const imageUrl = "data:image/jpeg;base64,uploaded"
      useSutureAnalysisStore.getState().setUploadedImage(imageUrl)
      expect(useSutureAnalysisStore.getState().uploadedImage).toBe(imageUrl)

      // 3. Complete analysis
      const mockResult: AnalysisResult = {
        success: true,
        image_info: {
          filename: "test.jpg",
          size: [800, 600],
        },
        detections: [
          {
            id: 1,
            bbox: { x1: 10, y1: 20, x2: 30, y2: 40 },
            confidence: 0.95,
            class_id: 0,
          },
        ],
        measurements: {
          stitch_count: 1,
          stitch_lengths: [10],
          average_stitch_length: 10,
          stitch_angles: [45],
          average_angle: 45,
          quality_assessment: "good",
        },
        processed_by: "test-server",
      }

      useSutureAnalysisStore.getState().completeAnalysis(mockResult)
      const finalState = useSutureAnalysisStore.getState()

      expect(finalState.analysisResult).toEqual(mockResult)
      expect(finalState.isAnalyzing).toBe(false)
      expect(finalState.showResults).toBe(true)
      expect(finalState.error).toBeNull()

      // 4. Reset for new analysis
      useSutureAnalysisStore.getState().resetAnalysis()
      const resetState = useSutureAnalysisStore.getState()

      expect(resetState.analysisResult).toBeNull()
      expect(resetState.uploadedImage).toBeNull()
      expect(resetState.showResults).toBe(false)
    })

    it("should handle analysis failure flow", () => {
      // 1. Start analysis
      useSutureAnalysisStore.getState().startAnalysis()

      // 2. Fail analysis
      const errorMessage = "Network connection failed"
      useSutureAnalysisStore.getState().failAnalysis(errorMessage)
      const state = useSutureAnalysisStore.getState()

      expect(state.error).toBe(errorMessage)
      expect(state.isAnalyzing).toBe(false)
      expect(state.showResults).toBe(false)

      // 3. Reset to try again
      useSutureAnalysisStore.getState().resetAnalysis()
      expect(useSutureAnalysisStore.getState().error).toBeNull()
    })
  })
})
