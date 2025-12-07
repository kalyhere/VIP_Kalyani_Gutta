import React from "react"
import { Box, Button, CircularProgress, Alert, Fade } from "@mui/material"
import {
  UploadFile as UploadFileIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material"
import { useDebriefStore } from "../../../stores"
import { useFileUpload } from "../hooks/useFileUpload"

export const UploadActions: React.FC = () => {
  const selectedFile = useDebriefStore((state) => state.selectedFile)
  const uploading = useDebriefStore((state) => state.uploading)
  const uploadSuccess = useDebriefStore((state) => state.uploadSuccess)
  const generating = useDebriefStore((state) => state.generating)

  const { handleUploadFile, handleGenerateReport } = useFileUpload()

  if (!selectedFile) return null

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "stretch", sm: "center" },
        mb: 3,
      }}>
      {!uploadSuccess && (
        <Button
          variant="outlined"
          onClick={handleUploadFile}
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          sx={{ borderRadius: 2 }}>
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
      )}

      {uploadSuccess && (
        <>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AssessmentIcon />}
            onClick={handleGenerateReport}
            disabled={generating}
            sx={{ borderRadius: 2 }}>
            {generating ? "Generating Report..." : "Generate Report"}
          </Button>
          <Fade in>
            <Alert severity="success" sx={{ borderRadius: 2, flex: 1 }}>
              File uploaded successfully! Ready to generate report.
            </Alert>
          </Fade>
        </>
      )}
    </Box>
  )
}
