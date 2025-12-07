/**
 * ReportActionsMenu Component
 * Context menu for report actions (Share, Delete)
 */

import React from "react"
import { Menu, MenuItem, Typography, alpha, Divider, useTheme } from "@mui/material"
import ShareIcon from "@mui/icons-material/Share"
import DeleteIcon from "@mui/icons-material/Delete"
import { FlexCenterVertical } from "@/components/styled"

const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

const typography = {
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
  },
}

export interface ReportActionsMenuProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  onShare: () => void
  onDelete: () => void
}

export const ReportActionsMenu: React.FC<ReportActionsMenuProps> = ({
  anchorEl,
  onClose,
  onShare,
  onDelete,
}) => {
  const theme = useTheme()
  return (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    sx={{
      "& .MuiPaper-root": {
        borderRadius: 2,
        minWidth: 160,
        boxShadow: `0 8px 24px ${alpha(theme.palette.text.disabled, 0.2)}`,
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
      },
    }}>
    <MenuItem
      onClick={onShare}
      sx={{
        color: theme.palette.secondary.main,
        py: spacing.sm,
        px: spacing.md,
        "&:hover": {
          bgcolor: alpha(theme.palette.secondary.main, 0.08),
        },
      }}>
      <FlexCenterVertical gap={spacing.sm}>
        <ShareIcon fontSize="small" />
        <Typography sx={{ ...typography.body2, fontWeight: 500 }}>Share Report</Typography>
      </FlexCenterVertical>
    </MenuItem>

    <Divider sx={{ my: 0.5 }} />
    <MenuItem
      onClick={onDelete}
      sx={{
        color: theme.palette.primary.main,
        py: spacing.sm,
        px: spacing.md,
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        },
      }}>
      <FlexCenterVertical gap={spacing.sm}>
        <DeleteIcon fontSize="small" />
        <Typography sx={{ ...typography.body2, fontWeight: 500 }}>Delete Report</Typography>
      </FlexCenterVertical>
    </MenuItem>
  </Menu>
  )
}
