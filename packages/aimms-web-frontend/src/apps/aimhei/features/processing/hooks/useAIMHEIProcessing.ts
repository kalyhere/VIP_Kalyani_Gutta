/**
 * useAIMHEIProcessing Hook
 * Manages AIMHEI processing via Server-Sent Events (SSE) with polling fallback
 */

import { useState, useCallback, useRef } from "react"
import { useAIMHEIStore } from "../../../stores/aimheiStore"

export interface ProcessingState {
  isProcessing: boolean
  progress: number
  message: string
  jobId: string | null
  error: string | null
}

export interface UseAIMHEIProcessingReturn {
  // Aliased properties to match ModernAIMHEI's naming convention
  processing: boolean
  processingProgress: number
  processingMessage: string
  jobId: string | null
  error: string | null
  result: any | null

  // Actions
  startProcessing: (jobId: string) => Promise<void>
  cancelProcessing: () => void
  resetProcessing: () => void
}

interface SSEData {
  type?: string
  status?: string
  progress?: number
  message?: string
  error?: string
}

/**
 * Custom hook for managing AIMHEI SSE processing
 *
 * @example
 * ```tsx
 * const { isProcessing, progress, message, startProcessing } = useAIMHEIProcessing()
 *
 * const handleSubmit = async () => {
 *   const jobId = await submitJob()
 *   await startProcessing(jobId)
 * }
 * ```
 */
export function useAIMHEIProcessing(options?: {
  apiUrl?: string
  token?: string | null
  onComplete?: (jobId: string) => void | Promise<void>
  onError?: (error: string) => void
  timeout?: number
}): UseAIMHEIProcessingReturn {
  const {
    apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000",
    token = null,
    onComplete,
    onError,
    timeout = 300000, // 5 minutes
  } = options || {}

  // Use Zustand store instead of local state
  const processing = useAIMHEIStore((state) => state.processing)
  const processingProgress = useAIMHEIStore((state) => state.processingProgress)
  const processingMessage = useAIMHEIStore((state) => state.processingMessage)
  const jobId = useAIMHEIStore((state) => state.jobId)
  const error = useAIMHEIStore((state) => state.error)
  const result = useAIMHEIStore((state) => state.result)

  const startProcessingAction = useAIMHEIStore((state) => state.startProcessing)
  const updateProcessingProgress = useAIMHEIStore((state) => state.updateProcessingProgress)
  const completeProcessing = useAIMHEIStore((state) => state.completeProcessing)
  const setProcessingError = useAIMHEIStore((state) => state.setProcessingError)
  const resetProcessingAction = useAIMHEIStore((state) => state.resetProcessing)

  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Cleanup function to close SSE connection and stop polling
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /**
   * Setup polling fallback (used if SSE fails)
   */
  const setupPolling = useCallback(
    async (currentJobId: string): Promise<void> =>
      new Promise((resolve, reject) => {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`${apiUrl}/api/transcripts/jobs/${currentJobId}/status`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })

          if (!response.ok) {
            throw new Error("Failed to get job status")
          }

          const data: SSEData = await response.json()

          updateProcessingProgress(data.progress || 0, data.message || "Processing...")

          if (data.status === "completed") {
            cleanup()
            completeProcessing(data)
            if (onComplete) {
              await onComplete(currentJobId)
            }
            resolve()
          } else if (data.status === "failed") {
            cleanup()
            const errorMsg = data.error || "Processing failed"
            setProcessingError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
            reject(new Error(errorMsg))
          }
        } catch (err) {
          cleanup()
          const errorMsg = err instanceof Error ? err.message : "Polling failed"
          setProcessingError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
          reject(err)
        }
      }, 2000) // Poll every 2 seconds
    }),
    [
      apiUrl,
      token,
      onComplete,
      onError,
      cleanup,
      updateProcessingProgress,
      completeProcessing,
      setProcessingError,
    ],
  )

  /**
   * Setup Server-Sent Events connection
   */
  const setupSSE = useCallback(
    async (currentJobId: string): Promise<void> =>
      new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${apiUrl}/api/transcripts/jobs/${currentJobId}/events`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = async (event) => {
        try {
          const data: SSEData = JSON.parse(event.data)

          if (data.error) {
            cleanup()
            setProcessingError(data.error)
            if (onError) {
              onError(data.error)
            }
            reject(new Error(data.error))
            return
          }

          // Handle ping messages
          if (data.type === "ping") {
            if (data.progress !== undefined && data.message) {
              updateProcessingProgress(data.progress, data.message)
            }
            if (!data.progress) {
              return // Ignore basic keep-alive pings
            }
          }

          // Update progress
          if (data.progress !== undefined || data.message) {
            updateProcessingProgress(
              data.progress !== undefined ? data.progress : processingProgress,
              data.message || processingMessage
            )
          }

          // Handle completion
          if (data.status === "completed") {
            cleanup()
            completeProcessing(data)
            if (onComplete) {
              await onComplete(currentJobId)
            }
            resolve()
          } else if (data.status === "failed") {
            cleanup()
            const errorMsg = data.error || "Processing failed"
            setProcessingError(errorMsg)
            if (onError) {
              onError(errorMsg)
            }
            reject(new Error(errorMsg))
          }
        } catch (parseError) {
          console.error("Error parsing SSE data:", parseError)
        }
      }

      eventSource.onerror = () => {
        cleanup()
        // SSE failed, falling back to polling
        setupPolling(currentJobId).then(resolve).catch(reject)
      }

      // Setup timeout
      timeoutRef.current = setTimeout(() => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          cleanup()
          const errorMsg = "SSE timeout"
          setProcessingError(errorMsg)
          if (onError) {
            onError(errorMsg)
          }
          reject(new Error(errorMsg))
        }
      }, timeout)
    }),
    [
      apiUrl,
      token,
      onComplete,
      onError,
      timeout,
      cleanup,
      setupPolling,
      updateProcessingProgress,
      completeProcessing,
      setProcessingError,
      processingProgress,
      processingMessage,
    ],
  )

  /**
   * Start processing job
   */
  const startProcessing = useCallback(
    async (newJobId: string): Promise<void> => {
      startProcessingAction(newJobId)

      try {
        await setupSSE(newJobId)
      } catch (err) {
        // Errors are already handled in setupSSE
        console.error("Processing error:", err)
      }
    },
    [setupSSE, startProcessingAction]
  )

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = useCallback(() => {
    cleanup()
    setProcessingError("Processing cancelled")
  }, [cleanup, setProcessingError])

  /**
   * Reset processing state
   */
  const resetProcessing = useCallback(() => {
    cleanup()
    resetProcessingAction()
  }, [cleanup, resetProcessingAction])

  return {
    // Aliased properties to match ModernAIMHEI's naming convention
    processing,
    processingProgress,
    processingMessage,
    jobId,
    error,
    result,
    startProcessing,
    cancelProcessing,
    resetProcessing,
  }
}
