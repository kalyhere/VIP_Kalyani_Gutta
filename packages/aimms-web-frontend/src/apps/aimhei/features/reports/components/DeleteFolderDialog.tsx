/**
 * DeleteFolderDialog Component
 * Dialog for deleting a folder and managing reports within it
 */

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  alpha,
  useTheme,
} from "@mui/material"
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Folder as FolderIcon,
  Assessment as ReportIcon,
} from "@mui/icons-material"
import { FlexCenterVertical, FlexColumn } from "@/components/styled"
import { StandaloneReport } from "./ReportHistoryPanel"

interface DeleteFolderDialogProps {
  open: boolean
  folderName: string
  reportsInFolder: StandaloneReport[]
  availableFolders: string[]
  onClose: () => void
  onConfirm: (reportMappings: { reportId: number; destinationFolder: string }[]) => void
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  open,
  folderName,
  reportsInFolder,
  availableFolders,
  onClose,
  onConfirm,
}) => {
  const theme = useTheme()
  const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set())
  const [reportDestinations, setReportDestinations] = useState<Record<number, string>>({})
  const [defaultDestination, setDefaultDestination] = useState<string>("Unorganized")

  // Filter out the folder being deleted from available destinations
  const destinationOptions = useMemo(
    () => ["Unorganized", ...availableFolders.filter((f) => f !== folderName)],
    [availableFolders, folderName]
  )

  // Helper to get a valid destination for a report
  const getValidDestination = (reportId: number): string => {
    const destination = reportDestinations[reportId] || defaultDestination
    // If destination is not in options, default to "Unorganized"
    return destinationOptions.includes(destination) ? destination : "Unorganized"
  }

  const handleSelectAll = () => {
    if (!reportsInFolder) return
    if (selectedReportIds.size === reportsInFolder.length) {
      setSelectedReportIds(new Set())
    } else {
      setSelectedReportIds(new Set(reportsInFolder.map((r) => r.report_id)))
    }
  }

  const handleToggleReport = (reportId: number) => {
    const newSelection = new Set(selectedReportIds)
    if (newSelection.has(reportId)) {
      newSelection.delete(reportId)
    } else {
      newSelection.add(reportId)
    }
    setSelectedReportIds(newSelection)
  }

  const handleSetDestination = (reportId: number, destination: string) => {
    setReportDestinations((prev) => ({
      ...prev,
      [reportId]: destination,
    }))
  }

  const handleApplyDefaultToSelected = () => {
    const newDestinations = { ...reportDestinations }
    selectedReportIds.forEach((id) => {
      newDestinations[id] = defaultDestination
    })
    setReportDestinations(newDestinations)
  }

  const handleConfirm = () => {
    if (!reportsInFolder) return
    // Build report mappings - use valid destinations only
    const mappings = reportsInFolder.map((report) => ({
      reportId: report.report_id,
      destinationFolder: getValidDestination(report.report_id),
    }))
    onConfirm(mappings)
  }

  const allSelected =
    reportsInFolder &&
    selectedReportIds.size === reportsInFolder.length &&
    reportsInFolder.length > 0
  const someSelected =
    reportsInFolder &&
    selectedReportIds.size > 0 &&
    selectedReportIds.size < reportsInFolder.length

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}>
      <DialogTitle
        sx={{
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
        <FlexCenterVertical gap={1.5}>
          <WarningIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Delete Folder "{folderName}"
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              {reportsInFolder?.length || 0} report{reportsInFolder?.length !== 1 ? "s" : ""} in this
              folder
            </Typography>
          </Box>
        </FlexCenterVertical>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {!reportsInFolder || reportsInFolder.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            This folder is empty and will be deleted permanently.
          </Alert>
        ) : (
          <>
            <Alert severity="warning" sx={{ my: 3 }}>
              Choose where to move the reports from this folder before deleting it.
            </Alert>

            {/* Default Destination Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 2 }}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Set Default Destination
                  </Typography>
                </Box>
                <FlexCenterVertical gap={2} sx={{ alignItems: "flex-end" }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Default folder</InputLabel>
                    <Select
                      value={defaultDestination}
                      label="Default folder"
                      onChange={(e) => setDefaultDestination(e.target.value)}>
                      {destinationOptions.map((folder) => (
                        <MenuItem key={folder} value={folder}>
                          <FlexCenterVertical gap={1}>
                            <FolderIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                            {folder}
                          </FlexCenterVertical>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={selectedReportIds.size === 0}
                    onClick={handleApplyDefaultToSelected}
                    sx={{
                      bgcolor: theme.palette.secondary.light,
                      "&:hover": { bgcolor: theme.palette.secondary.main },
                      textTransform: "none",
                    }}>
                    Apply to Selected ({selectedReportIds.size})
                  </Button>
                </FlexCenterVertical>
              </Box>
            </Box>

            {/* Reports List */}
            <Box sx={{ mb: 2 }}>
              <FlexCenterVertical justifyContent="space-between">
                <FlexCenterVertical
                  gap={1}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { opacity: 0.7 },
                  }}
                  onClick={handleSelectAll}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    size="small"
                    sx={{
                      color: alpha(theme.palette.secondary.light, 0.5),
                      "&.Mui-checked": { color: theme.palette.secondary.light },
                      "&.MuiCheckbox-indeterminate": { color: theme.palette.secondary.light },
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Select All
                  </Typography>
                </FlexCenterVertical>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {selectedReportIds.size} of{reportsInFolder?.length || 0} selected
                </Typography>
              </FlexCenterVertical>
            </Box>

            <List
              sx={{
                maxHeight: 400,
                overflow: "auto",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}>
              {reportsInFolder.map((report, index) => (
                <React.Fragment key={report.report_id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 1.5,
                      "&:hover": { bgcolor: alpha(theme.palette.divider, 0.5) },
                    }}>
                    <FlexCenterVertical gap={2} sx={{ width: "100%" }}>
                      <Checkbox
                        checked={selectedReportIds.has(report.report_id)}
                        onChange={() => handleToggleReport(report.report_id)}
                        size="small"
                        sx={{
                          color: alpha(theme.palette.secondary.light, 0.5),
                          "&.Mui-checked": { color: theme.palette.secondary.light },
                        }}
                      />
                      <ReportIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
                      <ListItemText
                        primary={
                          report.case_title || report.report_name || `Report ${report.report_id}`
                        }
                        secondary={`ID: ${report.report_id}`}
                        primaryTypographyProps={{
                          sx: { fontWeight: 500, fontSize: "0.875rem" },
                        }}
                        secondaryTypographyProps={{
                          sx: { fontSize: "0.75rem" },
                        }}
                        sx={{ flex: 1, minWidth: 0 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select
                          value={getValidDestination(report.report_id)}
                          onChange={(e) => handleSetDestination(report.report_id, e.target.value)}
                          displayEmpty
                          sx={{ fontSize: "0.875rem" }}>
                          {destinationOptions.map((folder) => (
                            <MenuItem key={folder} value={folder}>
                              <FlexCenterVertical gap={1}>
                                <FolderIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                                {folder}
                              </FlexCenterVertical>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </FlexCenterVertical>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            textTransform: "none",
            "&:hover": { bgcolor: alpha(theme.palette.divider, 0.5) },
          }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.background.paper,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: theme.palette.primary.dark },
          }}>
          Delete Folder
        </Button>
      </DialogActions>
    </Dialog>
  )
}
