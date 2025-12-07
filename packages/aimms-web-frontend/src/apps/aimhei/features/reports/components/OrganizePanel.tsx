/**
 * OrganizePanel Component
 * Third panel for organizing reports into folders - appears when Organize mode is active
 */

import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Chip,
  Divider,
  alpha,
  Paper,
  InputAdornment,
  useTheme,
} from "@mui/material"
import { FlexCenterVertical, FlexColumn } from "@/components/styled"
import CloseIcon from "@mui/icons-material/Close"
import FolderIcon from "@mui/icons-material/Folder"
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder"
import AddIcon from "@mui/icons-material/Add"
import ArchiveIcon from "@mui/icons-material/Archive"
import UnarchiveIcon from "@mui/icons-material/Unarchive"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"

interface OrganizePanelProps {
  selectedCount: number
  availableFolders: string[]
  onAddToFolder: (folderName: string) => void
  onArchive: () => void
  onUnarchive: () => void
  onClose: () => void
}

export const OrganizePanel: React.FC<OrganizePanelProps> = ({
  selectedCount,
  availableFolders,
  onAddToFolder,
  onArchive,
  onUnarchive,
  onClose,
}) => {
  const theme = useTheme()
  const [newFolderName, setNewFolderName] = useState("")
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddToFolder(newFolderName.trim())
      setNewFolderName("")
      setShowNewFolderInput(false)
    }
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        width: 320,
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
      }}>
      <FlexColumn sx={{ height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            bgcolor: alpha(theme.palette.secondary.light, 0.03),
          }}>
          <FlexCenterVertical justifyContent="space-between">
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "1rem" }}>
            Organize Reports
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {selectedCount} report{selectedCount !== 1 ? "s" : ""} selected
          </Typography>
        </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
          </FlexCenterVertical>
        </Box>

      {/* Quick Actions */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: "0.75rem",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>
          Quick Actions
        </Typography>
        <FlexColumn gap={1}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ArchiveIcon />}
            onClick={onArchive}
            disabled={selectedCount === 0}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: theme.palette.text.primary,
              borderColor: alpha(theme.palette.divider, 0.5),
              "&:hover": {
                borderColor: theme.palette.text.disabled,
                bgcolor: alpha(theme.palette.background.paper, 0.3),
              },
            }}>
            Archive Selected
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UnarchiveIcon />}
            onClick={onUnarchive}
            disabled={selectedCount === 0}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: theme.palette.text.primary,
              borderColor: alpha(theme.palette.divider, 0.5),
              "&:hover": {
                borderColor: theme.palette.text.disabled,
                bgcolor: alpha(theme.palette.background.paper, 0.3),
              },
            }}>
            Unarchive Selected
          </Button>
        </FlexColumn>
      </Box>

        {/* Folders Section */}
        <FlexColumn sx={{ flex: 1, overflow: "hidden" }}>
          <Box sx={{ p: 2, pb: 1.5 }}>
            <FlexCenterVertical justifyContent="space-between">
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: "0.75rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
            Add to Folder
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            sx={{
              color: theme.palette.secondary.main,
              "&:hover": {
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
              },
            }}>
            <CreateNewFolderIcon fontSize="small" />
          </IconButton>
            </FlexCenterVertical>
          </Box>

        {/* New Folder Input */}
        {showNewFolderInput && (
          <Box sx={{ px: 2, pb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="New folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder()
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FolderIcon sx={{ fontSize: "1rem", color: theme.palette.secondary.main }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || selectedCount === 0}
                      sx={{
                        color: theme.palette.secondary.main,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        },
                      }}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, mt: 0.5, display: "block" }}>
              Enter folder name and click + to add selected reports
            </Typography>
          </Box>
        )}

        {/* Existing Folders List */}
        <List
          dense
          sx={{
            flex: 1,
            overflow: "auto",
            px: 1,
          }}>
          {availableFolders.length === 0 ? (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <CreateNewFolderIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.divider,
                  mb: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                No folders yet
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                Click the folder icon above to create your first folder
              </Typography>
            </Box>
          ) : (
            availableFolders.map((folder) => (
              <ListItem key={folder} disablePadding>
                <ListItemButton
                  onClick={() => onAddToFolder(folder)}
                  disabled={selectedCount === 0}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    },
                    "&.Mui-disabled": {
                      opacity: 0.5,
                    },
                  }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <FolderIcon
                      sx={{
                        fontSize: "1.2rem",
                        color: theme.palette.secondary.main,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      sx: {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    }}
                  />
                  {selectedCount > 0 && (
                    <CheckCircleIcon
                      sx={{
                        fontSize: "1rem",
                        color: alpha(theme.palette.secondary.light, 0.3),
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
        </FlexColumn>

      {/* Help Text */}
      <Box
        sx={{
          p: 2,
          pt: 1.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, display: "block", lineHeight: 1.4 }}>
          💡
          {" "}
          <strong>Tip:</strong>
{' '}
Click report cards to select them, then click a folder to add
          them to that folder.
</Typography>
      </Box>
      </FlexColumn>
    </Paper>
  )
}
