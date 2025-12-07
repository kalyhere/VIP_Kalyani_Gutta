import React from "react"
import { Menu, MenuItem, Divider } from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import UploadIcon from "@mui/icons-material/Upload"
import CloseIcon from "@mui/icons-material/Close"

interface MainMenuProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  onDownloadFormat: () => void
  onUploadFormat: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearAll: () => void
}

const MainMenu = ({
  anchorEl,
  onClose,
  onDownloadFormat,
  onUploadFormat,
  onClearAll,
}: MainMenuProps) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    <MenuItem onClick={onDownloadFormat}>
      <SaveIcon sx={{ mr: 1 }} fontSize="small" />
      Download Format
    </MenuItem>
    <MenuItem component="label">
      <UploadIcon sx={{ mr: 1 }} fontSize="small" />
      Upload Format
      <input type="file" hidden accept=".json" onChange={onUploadFormat} />
    </MenuItem>
    <Divider />
    <MenuItem onClick={onClearAll} sx={{ color: "error.main" }}>
      <CloseIcon sx={{ mr: 1 }} fontSize="small" />
      Clear All
    </MenuItem>
  </Menu>
)

export default MainMenu
