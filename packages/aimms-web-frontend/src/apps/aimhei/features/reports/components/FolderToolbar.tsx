import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Autocomplete,
  Chip,
  alpha,
  Divider,
  useTheme,
} from "@mui/material"
import { FlexCenterVertical, FlexRow } from "@/components/styled"
import {
  CreateNewFolder as CreateNewFolderIcon,
  FolderOpen as FolderOpenIcon,
  DriveFileMove as OrganizeIcon,
  FileDownload as ExportIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  UploadFile as UploadFileIcon,
} from "@mui/icons-material"
import { useState } from "react"
import { UAAdvancedSearchField, UASelect } from "@/components/StyledFormComponents"
import { DateRange } from "@/components/UADateRangePicker"
import { FolderManagementMenu } from "./FolderManagementMenu"
import { useAIMHEIStore } from "../../../stores/aimheiStore"

interface FolderToolbarProps {
  // Callbacks only - state comes from Zustand
  onSelectFolder: (folder: string | null) => void
  onCreateFolder?: (folderName: string) => void
  onRenameFolder?: (oldName: string, newName: string) => void
  onDeleteFolder?: (folderName: string) => void
  onSearchChange?: (term: string) => void
  onSearchFieldChange?: (field: string) => void
  onModelFilterChange?: (filter: string) => void
  onDateRangeChange?: (range: DateRange) => void
  onRefresh?: () => void
  onToggleOrganizeMode: () => void
  onExitOrganizeMode: () => void
  onMoveToFolder?: (folder: string) => void
  onExport?: () => void
}

export function FolderToolbar({
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSearchChange,
  onSearchFieldChange,
  onModelFilterChange,
  onDateRangeChange,
  onRefresh,
  onToggleOrganizeMode,
  onExitOrganizeMode,
  onMoveToFolder,
  onExport,
}: FolderToolbarProps) {
  const theme = useTheme()
  // Read state from Zustand
  const availableFolders = useAIMHEIStore((state) => state.availableFolders)
  const selectedFolder = useAIMHEIStore((state) => state.selectedFolder)
  const folderCounts = useAIMHEIStore((state) => state.folderCounts)
  const unorganizedCount = useAIMHEIStore((state) => state.unorganizedCount)
  const actualTotalReports = useAIMHEIStore((state) => state.actualTotalReports)
  const searchTerm = useAIMHEIStore((state) => state.reportsFilters.searchTerm)
  const searchField = useAIMHEIStore((state) => state.reportsFilters.searchField)
  const modelFilter = useAIMHEIStore((state) => state.reportsFilters.modelFilter)
  const dateRange = useAIMHEIStore((state) => state.reportsFilters.dateRange)
  const organizeMode = useAIMHEIStore((state) => state.bulkOperationMode)
  const selectedReportIds = useAIMHEIStore((state) => state.bulkSelectedReportIds)
  const exportMode = useAIMHEIStore((state) => state.exportMode)

  const [folderMenuAnchor, setFolderMenuAnchor] = useState<HTMLElement | null>(null)
  const [moveToFolder, setMoveToFolder] = useState<string | null>(null)

  const handleMoveReports = () => {
    if (moveToFolder && onMoveToFolder) {
      onMoveToFolder(moveToFolder)
      setMoveToFolder(null)
    }
  }

  const folderOptions = ["All Reports", "Unorganized", ...availableFolders].map((folder) => {
    let count = 0
    if (folder === "All Reports") {
      count = actualTotalReports
    } else if (folder === "Unorganized") {
      count = unorganizedCount
    } else {
      count = folderCounts[folder] || 0
    }
    return { folder, count }
  })

  return (
    <Box
      sx={{
        mb: 2,
        px: 2,
        py: 1.25,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        border: `1px solid ${theme.palette.divider}`,
        flexWrap: "wrap",
        position: "relative",
      }}>
      <FlexCenterVertical gap={2}>
        {/* LEFT SECTION: Folder Selection */}
        <FlexCenterVertical gap={0.75}>
        <Autocomplete
          size="small"
          value={
            folderOptions.find((opt) => {
              if (selectedFolder === null) {
                return opt.folder === "All Reports"
              }
              if (selectedFolder === "") {
                return opt.folder === "Unorganized"
              }
              return opt.folder === selectedFolder
            }) || folderOptions[0]
          }
          onChange={(_, newValue) => {
            // newValue is an object from folderOptions
            if (!newValue) {
              onSelectFolder(null)
            } else if (typeof newValue === "string") {
              if (newValue === "All Reports") {
                onSelectFolder(null)
              } else if (newValue === "Unorganized") {
                onSelectFolder("")
              } else {
                onSelectFolder(newValue)
              }
            } else {
              // It's an object with { folder, count }
              if (newValue.folder === "All Reports") {
                onSelectFolder(null)
              } else if (newValue.folder === "Unorganized") {
                onSelectFolder("")
              } else {
                onSelectFolder(newValue.folder)
              }
            }
          }}
          options={folderOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option
            return option.folder
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === "string" && typeof value === "string") {
              return option === value
            }
            return option.folder === value.folder
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Folder"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <FolderOpenIcon
                      sx={{ color: theme.palette.secondary.main, fontSize: 18, ml: 0.5, mr: 0.5 }}
                    />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  fontSize: "0.875rem",
                  "& fieldset": {
                    borderColor: alpha(theme.palette.secondary.main, 0.4),
                    borderWidth: 1.5,
                  },
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    "& fieldset": {
                      borderColor: alpha(theme.palette.secondary.main, 0.6),
                    },
                  },
                  "&.Mui-focused": {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.08)}, 0 0 0 2px ${alpha(theme.palette.secondary.main, 0.12)}`,
                    "& fieldset": {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2,
                    },
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: theme.palette.text.primary,
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props
            const opt = typeof option === "string" ? { folder: option, count: 0 } : option
            return (
              <li key={key} {...otherProps}>
                <FlexCenterVertical justifyContent="space-between" sx={{ width: "100%" }}>
                  <Typography variant="body2">{opt.folder}</Typography>
                  <Chip
                    label={opt.count}
                    size="small"
                    sx={{
                      ml: 1,
                      minWidth: 30,
                      height: 20,
                      fontSize: "0.75rem",
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                    }}
                  />
                </FlexCenterVertical>
              </li>
            )
          }}
          sx={{ width: 220 }}
        />
        <IconButton
          size="small"
          onClick={(e) => setFolderMenuAnchor(e.currentTarget)}
          title="Manage folders"
          sx={{
            color: theme.palette.secondary.main,
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
            "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.15) },
          }}>
          <SettingsIcon fontSize="small" />
        </IconButton>
        </FlexCenterVertical>

      {/* Folder Management Menu */}
      <FolderManagementMenu
        anchorEl={folderMenuAnchor}
        selectedFolder={selectedFolder}
        availableFolders={availableFolders}
        onClose={() => setFolderMenuAnchor(null)}
        onCreate={(name) => onCreateFolder?.(name)}
        onRename={(oldName, newName) => onRenameFolder?.(oldName, newName)}
        onDelete={(name) => onDeleteFolder?.(name)}
      />

      {/* Spacer */}
      <Box sx={{ flex: "1 1 auto" }} />

      {/* Export Mode Controls */}
      {exportMode && !organizeMode && (
        <>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 600,
              fontSize: "0.875rem",
              minWidth: "fit-content",
            }}>
            Select reports below to export
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: "0.875rem",
              minWidth: "fit-content",
            }}>
            ({selectedReportIds.size} selected)
          </Typography>
        </>
      )}

      {/* Organize Mode Controls */}
      {organizeMode && (
        <>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 600,
              fontSize: "0.875rem",
              minWidth: "fit-content",
            }}>
            Select reports below to organize
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: "0.875rem",
              minWidth: "fit-content",
            }}>
            ({selectedReportIds.size} selected)
          </Typography>
          <Autocomplete
            size="small"
            value={moveToFolder}
            onChange={(_, newValue) => setMoveToFolder(newValue)}
            options={["Unorganized", ...availableFolders]}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Move to..."
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: theme.palette.background.paper,
                    fontSize: "0.875rem",
                  },
                }}
              />
            )}
            sx={{ width: 180 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleMoveReports}
            disabled={!moveToFolder || selectedReportIds.size === 0}
            sx={{
              bgcolor: theme.palette.secondary.light,
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              "&:hover": { bgcolor: theme.palette.secondary.main },
              "&:disabled": {
                bgcolor: alpha(theme.palette.divider, 0.3),
                color: theme.palette.text.disabled,
              },
            }}>
            Move
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onExitOrganizeMode}
            sx={{
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
              textTransform: "none",
              fontSize: "0.875rem",
              "&:hover": { borderColor: theme.palette.text.disabled },
            }}>
            Cancel
          </Button>
        </>
      )}

        {/* RIGHT SECTION: Actions */}
        <FlexCenterVertical gap={1} sx={{ ml: "auto" }}>
        {!organizeMode && (
          <Button
            variant="outlined"
            startIcon={<OrganizeIcon fontSize="small" />}
            onClick={onToggleOrganizeMode}
            size="small"
            sx={{
              color: theme.palette.secondary.main,
              borderColor: alpha(theme.palette.secondary.main, 0.5),
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              "&:hover": {
                borderColor: theme.palette.secondary.main,
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
              },
            }}>
            Organize
          </Button>
        )}

        {!organizeMode && onExport && (
          <Button
            variant="outlined"
            startIcon={<ExportIcon fontSize="small" />}
            onClick={onExport}
            size="small"
            sx={{
              color: theme.palette.secondary.main,
              borderColor: alpha(theme.palette.secondary.main, 0.5),
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              "&:hover": {
                borderColor: theme.palette.secondary.main,
                bgcolor: alpha(theme.palette.secondary.main, 0.08),
              },
            }}>
            Export
          </Button>
        )}
        </FlexCenterVertical>
      </FlexCenterVertical>
    </Box>
  )
}
