import React from "react"
import { Menu, MenuItem } from "@mui/material"
import CreateIcon from "@mui/icons-material/Create"
import RefreshIcon from "@mui/icons-material/Refresh"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

interface FormActionsMenuProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  hasUnfilledVariables: boolean
  hasGeneratedContent: boolean
  onFillEmpty: () => void
  onRegenerateAll: () => void
  onResetAll: () => void
}

const FormActionsMenu = ({
  anchorEl,
  onClose,
  hasUnfilledVariables,
  hasGeneratedContent,
  onFillEmpty,
  onRegenerateAll,
  onResetAll,
}: FormActionsMenuProps) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    {[
      hasUnfilledVariables && (
        <MenuItem
          key="fill"
          onClick={() => {
            onFillEmpty()
            onClose()
          }}>
          <CreateIcon sx={{ mr: 1 }} fontSize="small" />
          Fill Variables
        </MenuItem>
      ),
      hasGeneratedContent && (
        <MenuItem
          key="regenerate"
          onClick={() => {
            onRegenerateAll()
            onClose()
          }}>
          <RefreshIcon sx={{ mr: 1 }} fontSize="small" />
          Regenerate All
        </MenuItem>
      ),
      hasGeneratedContent && (
        <MenuItem
          key="reset"
          onClick={() => {
            onResetAll()
            onClose()
          }}>
          <ArrowBackIcon sx={{ mr: 1 }} fontSize="small" />
          Reset to Variables
        </MenuItem>
      ),
    ].filter(Boolean)}
  </Menu>
)

export default FormActionsMenu
