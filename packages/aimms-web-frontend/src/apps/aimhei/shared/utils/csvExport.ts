/**
 * CSV Export Utility
 * Handles exporting AIMHEI reports to CSV/Excel format
 */

import { adminApiClient } from "@services/adminApiClient"

export interface ExportResult {
  success: boolean
  message: string
  severity: "success" | "error"
}

/**
 * Export selected reports to CSV/Excel
 */
export async function exportReportsToCSV(reportIds: Set<number>): Promise<ExportResult> {
  if (reportIds.size === 0) {
    return {
      success: false,
      message: "Please select at least one report to export",
      severity: "error",
    }
  }

  try {
    const reportIdsArray = Array.from(reportIds)
    const blob = await adminApiClient.exportReportsCSV(reportIdsArray)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aimhei_reports_${reportIdsArray.length}_selected.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return {
      success: true,
      message: `Successfully exported ${reportIds.size} report${reportIds.size > 1 ? "s" : ""}`,
      severity: "success",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to export reports",
      severity: "error",
    }
  }
}
