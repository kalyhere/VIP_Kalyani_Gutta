import React from "react"
import { Menu, MenuItem } from "@mui/material"
import CreateIcon from "@mui/icons-material/Create"
import RefreshIcon from "@mui/icons-material/Refresh"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

interface FillMenuProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  hasUnfilledVariables: boolean
  hasGeneratedContent: boolean
  onFillEmpty: () => void
  onRegenerateAll: () => void
  onResetAll: () => void
}

const FillMenu = ({
  anchorEl,
  onClose,
  hasUnfilledVariables,
  hasGeneratedContent,
  onFillEmpty,
  onRegenerateAll,
  onResetAll,
}: FillMenuProps) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    {hasUnfilledVariables && (
      <MenuItem onClick={onFillEmpty}>
        <CreateIcon sx={{ mr: 1 }} fontSize="small" />
        Fill Variables
      </MenuItem>
    )}
    {hasGeneratedContent && (
      <MenuItem onClick={onRegenerateAll}>
        <RefreshIcon sx={{ mr: 1 }} fontSize="small" />
        Regenerate All
      </MenuItem>
    )}
    {hasGeneratedContent && (
      <MenuItem onClick={onResetAll}>
        <ArrowBackIcon sx={{ mr: 1 }} fontSize="small" />
        Reset to Variables
      </MenuItem>
    )}
  </Menu>
)

export default FillMenu
