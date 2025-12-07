/**
 * DeleteConfirmationDialog Component
 * Modal dialog for confirming report deletion
 */

import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"

const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

const typography = {
  h3: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
  },
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
  },
}

export interface DeleteConfirmationDialogProps {
  open: boolean
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  deleting,
  onCancel,
  onConfirm,
}) => {
  const theme = useTheme()
  return (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="sm"
    fullWidth
    sx={{
      "& .MuiDialog-paper": {
        borderRadius: 3,
        boxShadow: `0 20px 60px ${alpha(theme.palette.text.disabled, 0.3)}`,
      },
    }}>
    <DialogTitle
      sx={{
        ...typography.h3,
        color: theme.palette.text.primary,
        pb: spacing.sm,
      }}>
      Delete Report?
    </DialogTitle>
    <DialogContent>
      <Typography
        sx={{
          ...typography.body1,
          color: theme.palette.text.secondary,
          lineHeight: 1.6,
        }}>
        Are you sure you want to delete this report? This action cannot be undone and will
        permanently remove all report data.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: spacing.lg, gap: spacing.sm }}>
      <Button
        onClick={onCancel}
        variant="outlined"
        sx={{
          color: theme.palette.text.secondary,
          borderColor: alpha(theme.palette.divider, 0.5),
          textTransform: "none",
          ...typography.body2,
          fontWeight: 500,
          borderRadius: 2,
          px: spacing.lg,
          "&:hover": {
            borderColor: theme.palette.text.disabled,
            bgcolor: alpha(theme.palette.background.paper, 0.3),
          },
        }}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        disabled={deleting}
        startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.background.paper,
          ...typography.body2,
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 2,
          px: spacing.lg,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
          },
          "&:disabled": {
            bgcolor: alpha(theme.palette.primary.main, 0.5),
            color: alpha(theme.palette.background.paper, 0.7),
          },
        }}>
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </DialogActions>
  </Dialog>
  )
}
