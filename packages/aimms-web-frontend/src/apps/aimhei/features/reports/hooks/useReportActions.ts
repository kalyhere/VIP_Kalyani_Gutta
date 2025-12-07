/**
 * useReportActions Hook
 * Manages AIMHEI report actions: view, delete, share, download using Zustand store
 */

import { useState, useCallback } from "react"
import { useAIMHEIStore } from "../../../stores/aimheiStore"

export interface UseReportActionsReturn {
  // State
  deleting: boolean
  sharing: boolean
  error: string | null

  // Actions
  deleteReport: (reportId: number) => Promise<boolean>
  shareReport: (reportId: number, recipientEmail: string) => Promise<boolean>
  downloadReport: (reportId: number) => Promise<void>
  viewReport: (reportId: number) => void

  // Reset
  resetState: () => void
}

/**
 * Custom hook for managing AIMHEI report actions
 *
 * @example
 * ```tsx
 * const { deleteReport, deleting, error } = useReportActions({
 *   apiUrl: 'http://localhost:8000',
 *   onDelete: () => refreshReports(),
 *   onError: (msg) => showSnackbar(msg, 'error')
 * })
 *
 * const handleDelete = async (reportId: number) => {
 *   const success = await deleteReport(reportId)
 *   if (success) {
 *     showSnackbar('Report deleted successfully')
 *   }
 * }
 * ```
 */
export function useReportActions(options?: {
  apiUrl?: string
  token?: string | null
  onDelete?: (reportId: number) => void
  onShare?: (reportId: number) => void
  onView?: (reportId: number) => void
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}): UseReportActionsReturn {
  const {
    apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000",
    token = null,
    onDelete,
    onShare,
    onView,
    onError,
    onSuccess,
  } = options || {}

  // Get state from Zustand store
  const deleting = useAIMHEIStore((state) => state.deleting)
  const sharing = useAIMHEIStore((state) => state.sharing)
  const setDeleting = useAIMHEIStore((state) => state.setDeleting)
  const setSharing = useAIMHEIStore((state) => state.setSharing)

  // Local error state (not in store as it's component-specific feedback)
  const [error, setError] = useState<string | null>(null)

  /**
   * Delete a report
   */
  const deleteReport = useCallback(
    async (reportId: number): Promise<boolean> => {
      setDeleting(true)
      setError(null)

      try {
        const authToken = token || localStorage.getItem("auth_token")

        const response = await fetch(`${apiUrl}/api/aimhei-reports/${reportId}`, {
          method: "DELETE",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || "Failed to delete report")
        }

        if (onDelete) {
          onDelete(reportId)
        }

        if (onSuccess) {
          onSuccess("Report deleted successfully")
        }

        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete report"
        setError(errorMsg)

        if (onError) {
          onError(errorMsg)
        }

        return false
      } finally {
        setDeleting(false)
      }
    },
    [apiUrl, token, onDelete, onError, onSuccess]
  )

  /**
   * Share a report via email
   */
  const shareReport = useCallback(
    async (reportId: number, recipientEmail: string): Promise<boolean> => {
      setSharing(true)
      setError(null)

      try {
        const authToken = token || localStorage.getItem("auth_token")

        const response = await fetch(`${apiUrl}/api/aimhei-reports/${reportId}/share`, {
          method: "POST",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient_email: recipientEmail,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || "Failed to share report")
        }

        if (onShare) {
          onShare(reportId)
        }

        if (onSuccess) {
          onSuccess("Report shared successfully")
        }

        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to share report"
        setError(errorMsg)

        if (onError) {
          onError(errorMsg)
        }

        return false
      } finally {
        setSharing(false)
      }
    },
    [apiUrl, token, onShare, onError, onSuccess]
  )

  /**
   * Download a report as PDF
   */
  const downloadReport = useCallback(
    async (reportId: number): Promise<void> => {
      try {
        const authToken = token || localStorage.getItem("auth_token")

        const response = await fetch(`${apiUrl}/api/aimhei-reports/${reportId}/download`, {
          method: "GET",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error("Failed to download report")
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `aimhei-report-${reportId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        if (onSuccess) {
          onSuccess("Report downloaded successfully")
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to download report"
        setError(errorMsg)

        if (onError) {
          onError(errorMsg)
        }
      }
    },
    [apiUrl, token, onError, onSuccess]
  )

  /**
   * View a report (navigation callback)
   */
  const viewReport = useCallback(
    (reportId: number): void => {
      if (onView) {
        onView(reportId)
      }
    },
    [onView]
  )

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    setDeleting(false)
    setSharing(false)
    setError(null)
  }, [setDeleting, setSharing])

  return {
    // State
    deleting,
    sharing,
    error,

    // Actions
    deleteReport,
    shareReport,
    downloadReport,
    viewReport,

    // Reset
    resetState,
  }
}
