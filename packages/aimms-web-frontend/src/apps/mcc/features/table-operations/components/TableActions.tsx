import React from "react"
import { Box, Button, IconButton, Menu, MenuItem, Typography } from "@mui/material"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import CloseIcon from "@mui/icons-material/Close"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import CreateIcon from "@mui/icons-material/Create"
import RefreshIcon from "@mui/icons-material/Refresh"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

interface TableSection {
  id: string
  title: string
  hasHeader: boolean
  columns: number
  rows: TableRow[]
}

interface TableRow {
  id: string
  cells: TableCell[]
}

interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrl?: string
  isLocked?: boolean
  imageUrls?: string[]
}

interface TableActionsProps {
  table: TableSection
  isGenerating: boolean
  onDeleteTable: (tableId: string) => void
  onAddRow: (tableId: string) => void
  onDeleteRow: (tableId: string, rowId: string) => void
  onAddColumn: (tableId: string) => void
  onDeleteColumn: (tableId: string, columnIndex: number) => void
  hasUnfilledVariables: (table: TableSection) => boolean
  hasGeneratedContent: (table: TableSection) => boolean
  handleFillEmpty: (tableId: string) => void
  handleRegenerateAll: (tableId: string) => void
  handleResetAll: (tableId: string) => void
}

const TableActions = ({
  table,
  isGenerating,
  onDeleteTable,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  hasUnfilledVariables,
  hasGeneratedContent,
  handleFillEmpty,
  handleRegenerateAll,
  handleResetAll,
}: TableActionsProps) => {
  const [fillMenuAnchorEl, setFillMenuAnchorEl] = React.useState<null | HTMLElement>(null)

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {(hasUnfilledVariables(table) || hasGeneratedContent(table)) && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          onClick={(e) => {
            setFillMenuAnchorEl(e.currentTarget)
          }}
          disabled={isGenerating}>
          AI Actions
        </Button>
      )}
      <IconButton
        size="small"
        onClick={() => onDeleteTable(table.id)}
        sx={{
          color: "rgba(0, 0, 0, 0.54)",
          "&:hover": {
            color: "error.main",
          },
        }}>
        <CloseIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={fillMenuAnchorEl}
        open={Boolean(fillMenuAnchorEl)}
        onClose={() => setFillMenuAnchorEl(null)}>
        {[
          hasUnfilledVariables(table) && (
            <MenuItem
              key="fill"
              onClick={() => {
                handleFillEmpty(table.id)
                setFillMenuAnchorEl(null)
              }}>
              <CreateIcon sx={{ mr: 1 }} fontSize="small" />
              Fill Variables
            </MenuItem>
          ),
          hasGeneratedContent(table) && (
            <MenuItem
              key="regenerate"
              onClick={() => {
                handleRegenerateAll(table.id)
                setFillMenuAnchorEl(null)
              }}>
              <RefreshIcon sx={{ mr: 1 }} fontSize="small" />
              Regenerate All
            </MenuItem>
          ),
          hasGeneratedContent(table) && (
            <MenuItem
              key="reset"
              onClick={() => {
                handleResetAll(table.id)
                setFillMenuAnchorEl(null)
              }}>
              <ArrowBackIcon sx={{ mr: 1 }} fontSize="small" />
              Reset to Variables
            </MenuItem>
          ),
        ].filter(Boolean)}
      </Menu>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          mt: 2,
          gap: 2,
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Rows:
            {" "}
            {table.rows.length}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onAddRow(table.id)}
            disabled={table.rows.length >= 25}
            sx={{
              "&:hover": { color: "primary.main" },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              const lastRow = table.rows[table.rows.length - 1]
              if (lastRow && !lastRow.cells[0]?.isHeader) {
                onDeleteRow(table.id, lastRow.id)
              }
            }}
            disabled={table.rows.length <= 1 || (table.hasHeader && table.rows.length <= 2)}
            sx={{
              "&:hover": { color: "error.main" },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Columns:
            {" "}
            {table.columns}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onAddColumn(table.id)}
            disabled={table.columns >= 10}
            sx={{
              "&:hover": { color: "primary.main" },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDeleteColumn(table.id, table.columns - 1)}
            disabled={table.columns <= 1}
            sx={{
              "&:hover": { color: "error.main" },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default TableActions
