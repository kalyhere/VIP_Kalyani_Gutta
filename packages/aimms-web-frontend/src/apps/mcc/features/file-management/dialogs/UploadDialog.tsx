import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import SaveIcon from "@mui/icons-material/Save"

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  uploadedCasesCount: number
  existingCasesCount: number
  onMerge: () => void
  onReplace: () => void
}

const UploadDialog = ({
  open,
  onClose,
  uploadedCasesCount,
  existingCasesCount,
  onMerge,
  onReplace,
}: UploadDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Upload Medical Cases</DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          You are about to upload
          {" "}
          {uploadedCasesCount}
{' '}
new case(s).
</Typography>
        <Typography variant="body1" gutterBottom>
          You currently have
          {" "}
          {existingCasesCount}
{' '}
existing case(s).
</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Choose how you would like to proceed:
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="outlined" onClick={onMerge} startIcon={<AddIcon />}>
        Merge with Existing
      </Button>
      <Button variant="contained" onClick={onReplace} color="primary" startIcon={<SaveIcon />}>
        Replace All
      </Button>
    </DialogActions>
  </Dialog>
)

export default UploadDialog
