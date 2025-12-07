import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"

interface DownloadDialogProps {
  open: boolean
  onClose: () => void
  fileName: string
  onFileNameChange: (value: string) => void
  onDownload: () => void
  downloadType: "cases" | "format"
}

const DownloadDialog = ({
  open,
  onClose,
  fileName,
  onFileNameChange,
  onDownload,
  downloadType,
}: DownloadDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      {downloadType === "cases" ? "Download Medical Cases" : "Download Format"}
    </DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <TextField
          autoFocus
          fullWidth
          label="File Name"
          name="download-filename"
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          helperText=".json will be added automatically"
          InputProps={{
            endAdornment: <Box sx={{ color: "text.secondary" }}>.json</Box>,
          }}
        />
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        variant="contained"
        onClick={onDownload}
        disabled={!fileName.trim()}
        startIcon={<SaveIcon />}>
        Download
      </Button>
    </DialogActions>
  </Dialog>
)

export default DownloadDialog
