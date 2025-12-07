import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material"

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Delete Case",
  message = "Are you sure you want to delete this case? This action cannot be undone.",
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description">
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" autoFocus>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
)
