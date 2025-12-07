/**
 * FolderManagementMenu Component
 * Unified menu for folder CRUD operations
 */

import React, { useState } from "react"
import {
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Divider,
  alpha,
  useTheme,
} from "@mui/material"
import {
  CreateNewFolder as CreateIcon,
  Edit as RenameIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
} from "@mui/icons-material"
import { FlexCenterVertical } from "@/components/styled"

interface FolderManagementMenuProps {
  anchorEl: HTMLElement | null
  selectedFolder: string | null
  availableFolders: string[]
  onClose: () => void
  onCreate: (folderName: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (folderName: string) => void
}

export const FolderManagementMenu: React.FC<FolderManagementMenuProps> = ({
  anchorEl,
  selectedFolder,
  availableFolders,
  onClose,
  onCreate,
  onRename,
  onDelete,
}) => {
  const theme = useTheme()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renameValue, setRenameValue] = useState("")

  const handleCreateClick = () => {
    onClose()
    setNewFolderName("")
    setCreateDialogOpen(true)
  }

  const handleRenameClick = () => {
    if (!selectedFolder) return
    onClose()
    setRenameValue(selectedFolder)
    setRenameDialogOpen(true)
  }

  const handleDeleteClick = () => {
    if (!selectedFolder) return
    onClose()
    onDelete(selectedFolder)
  }

  const handleCreateConfirm = () => {
    if (newFolderName.trim()) {
      onCreate(newFolderName.trim())
      setCreateDialogOpen(false)
      setNewFolderName("")
    }
  }

  const handleRenameConfirm = () => {
    if (renameValue.trim() && selectedFolder && renameValue.trim() !== selectedFolder) {
      onRename(selectedFolder, renameValue.trim())
      setRenameDialogOpen(false)
      setRenameValue("")
    }
  }

  const canRename = selectedFolder && selectedFolder !== ""
  const canDelete = selectedFolder && selectedFolder !== ""

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.15)}`,
          },
        }}>
        <MenuItem onClick={handleCreateClick}>
          <ListItemIcon>
            <CreateIcon fontSize="small" sx={{ color: "#F9A825" }} />
          </ListItemIcon>
          <ListItemText>Create Folder</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleRenameClick} disabled={!canRename}>
          <ListItemIcon>
            <RenameIcon
              fontSize="small"
              sx={{ color: canRename ? theme.palette.secondary.main : theme.palette.text.disabled }}
            />
          </ListItemIcon>
          <ListItemText>Rename Folder</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} disabled={!canDelete}>
          <ListItemIcon>
            <DeleteIcon
              fontSize="small"
              sx={{ color: canDelete ? theme.palette.primary.main : theme.palette.text.disabled }}
            />
          </ListItemIcon>
          <ListItemText>Delete Folder</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <FlexCenterVertical gap={1}>
            <FolderIcon sx={{ color: theme.palette.secondary.light }} />
            Create New Folder
          </FlexCenterVertical>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleCreateConfirm()
            }}
            sx={{ mt: 2 }}
            error={availableFolders.includes(newFolderName.trim())}
            helperText={
              availableFolders.includes(newFolderName.trim())
                ? "A folder with this name already exists"
                : ""
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateConfirm}
            disabled={!newFolderName.trim() || availableFolders.includes(newFolderName.trim())}
            sx={{
              bgcolor: theme.palette.secondary.light,
              "&:hover": { bgcolor: theme.palette.secondary.main },
              textTransform: "none",
            }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <FlexCenterVertical gap={1}>
            <RenameIcon sx={{ color: theme.palette.secondary.main }} />
            Rename Folder
          </FlexCenterVertical>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Renaming:
              {" "}
              <strong>{selectedFolder}</strong>
            </Typography>
          </Box>
          <TextField
            autoFocus
            fullWidth
            label="New Folder Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleRenameConfirm()
            }}
            error={
              availableFolders.includes(renameValue.trim()) && renameValue.trim() !== selectedFolder
            }
            helperText={
              availableFolders.includes(renameValue.trim()) && renameValue.trim() !== selectedFolder
                ? "A folder with this name already exists"
                : ""
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameDialogOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenameConfirm}
            disabled={
              !renameValue.trim() ||
              renameValue.trim() === selectedFolder ||
              (availableFolders.includes(renameValue.trim())
                && renameValue.trim() !== selectedFolder)
            }
            sx={{
              bgcolor: theme.palette.secondary.main,
              "&:hover": { bgcolor: theme.palette.secondary.light },
              textTransform: "none",
            }}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
