import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material"
import { useDebriefStore } from "../../../stores"

export const FullReportDialog: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const showDetails = useDebriefStore((state) => state.showDetails)
  const report = useDebriefStore((state) => state.report)
  const parsedReport = useDebriefStore((state) => state.parsedReport)
  const setShowDetails = useDebriefStore((state) => state.setShowDetails)

  const handleDownload = () => {
    if (!report) return

    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `debrief-report-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatReport = (rawReport: string) => {
    return rawReport
      .replace(/\[TotalScore\]/g, `${parsedReport?.totalScore || 21}`)
      .replace(/\[SummaryReport\]/g, "Summary Report")
      .replace(/\[Evaluator\]/g, parsedReport?.evaluator || "AIDSET")
      .replace(/\[Instructor\]/g, parsedReport?.instructor || "Not mentioned")
      .replace(/\[Course\]/g, parsedReport?.course || "Simulation Training")
      .replace(/\[Date\]/g, parsedReport?.date || new Date().toLocaleDateString())
      .replace(/\[Location\]/g, parsedReport?.location || "ASTEC")
      .replace(/\[Class Size\]/g, parsedReport?.classSize || "Not mentioned")
      .replace(/\[Context\]/g, parsedReport?.context || "Not mentioned")
      .replace(/\[Score1\]/g, String(parsedReport?.scores?.[0]?.score || 3))
      .replace(/\[Score2\]/g, String(parsedReport?.scores?.[1]?.score || 3))
      .replace(/\[Score3\]/g, String(parsedReport?.scores?.[2]?.score || 3))
      .replace(/\[Score4\]/g, String(parsedReport?.scores?.[3]?.score || 3))
      .replace(/\[Score5\]/g, String(parsedReport?.scores?.[4]?.score || 3))
      .replace(/\[Score6\]/g, String(parsedReport?.scores?.[5]?.score || 3))
      .replace(/\[Score7\]/g, String(parsedReport?.scores?.[6]?.score || 3))
  }

  return (
    <Dialog
      open={showDetails}
      onClose={() => setShowDetails(false)}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" } as any}>
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.secondary.dark,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          📋 Full Evaluation Report
        </Typography>
        <IconButton onClick={() => setShowDetails(false)} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {report && (
          <Paper sx={{ p: 3, m: 2, borderRadius: 2, backgroundColor: alpha("#000", 0.02) }}>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                lineHeight: 1.6,
                fontSize: "0.9rem",
              }}>
              {formatReport(report)}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: alpha(theme.palette.secondary.main, 0.05) }}>
        <Button startIcon={<FileDownloadIcon />} onClick={handleDownload} sx={{ borderRadius: 2 }}>
          Download Report
        </Button>
        <Button onClick={() => setShowDetails(false)} sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
