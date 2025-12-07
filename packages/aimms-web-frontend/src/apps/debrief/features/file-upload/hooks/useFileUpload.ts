import { useCallback } from "react"
import { useDebriefStore } from "../../../stores"
import debriefService from "../../../../../services/debriefApi"
import { parseReport } from "../../report-display/utils/reportParser"

export const useFileUpload = () => {
  const selectedFile = useDebriefStore((state) => state.selectedFile)
  const startUpload = useDebriefStore((state) => state.startUpload)
  const completeUpload = useDebriefStore((state) => state.completeUpload)
  const failUpload = useDebriefStore((state) => state.failUpload)
  const startReportGeneration = useDebriefStore((state) => state.startReportGeneration)
  const completeReportGeneration = useDebriefStore((state) => state.completeReportGeneration)
  const failReportGeneration = useDebriefStore((state) => state.failReportGeneration)

  const handleUploadFile = useCallback(async () => {
    if (!selectedFile) return

    startUpload()

    try {
      await debriefService.uploadTranscript(selectedFile)
      completeUpload()
    } catch (err) {
      console.error("Error uploading file:", err)
      failUpload("Failed to upload file. Please try again.")
    }
  }, [selectedFile, startUpload, completeUpload, failUpload])

  const handleGenerateReport = useCallback(async () => {
    if (!selectedFile) return

    startReportGeneration()

    try {
      console.log("Starting report generation...")
      const response = await debriefService.generateReport()

      // Parse the report for summary view
      const parsed = parseReport(response.report)

      completeReportGeneration(response.report, parsed)
    } catch (err) {
      console.error("Error generating report:", err)
      failReportGeneration("Failed to generate report. Please try again.")
    }
  }, [selectedFile, startReportGeneration, completeReportGeneration, failReportGeneration])

  return {
    handleUploadFile,
    handleGenerateReport,
  }
}
