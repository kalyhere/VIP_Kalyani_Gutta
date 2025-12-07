import React from "react"
import { Container } from "@mui/material"
import { useDebriefStore } from "./stores"
import { useHealthCheck } from "./shared/hooks"
import {
  DebriefHeader,
  HealthStatus,
  ErrorDisplay,
  LoadingScreen,
} from "./shared/components"
import {
  FileUploadPanel,
  FilePreview,
  UploadActions,
} from "./features/file-upload"
import {
  ReportSummary,
  FullReportDialog,
} from "./features/report-display"

export const Debrief: React.FC = () => {
  const loading = useDebriefStore((state) => state.loading)
  const healthData = useDebriefStore((state) => state.healthData)
  const error = useDebriefStore((state) => state.error)
  const setError = useDebriefStore((state) => state.setError)

  const { fetchHealthStatus } = useHealthCheck()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <DebriefHeader onRefresh={fetchHealthStatus} />
      <HealthStatus healthData={healthData} />
      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
      <FileUploadPanel />
      <UploadActions />
      <FilePreview />
      <ReportSummary />
      <FullReportDialog />
    </Container>
  )
}

export default Debrief
