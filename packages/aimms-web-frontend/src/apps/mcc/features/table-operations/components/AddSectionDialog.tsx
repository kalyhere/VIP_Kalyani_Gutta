import React from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material"

interface AddSectionDialogProps {
  open: boolean
  onClose: () => void
  newSectionTitle: string
  onTitleChange: (value: string) => void
  onAdd: () => void
}

const AddSectionDialog = ({
  open,
  onClose,
  newSectionTitle,
  onTitleChange,
  onAdd,
}: AddSectionDialogProps) => (
  <Dialog open={open} onClose={onClose} keepMounted>
    <DialogTitle>Add New Section</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Section Title"
        name="new-section-title"
        fullWidth
        value={newSectionTitle}
        onChange={(e) => onTitleChange(e.target.value)}
      />
    </DialogContent>
    <DialogActions sx={{ m: 1 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onAdd} variant="contained">
        Add
      </Button>
    </DialogActions>
  </Dialog>
)

export default AddSectionDialog
