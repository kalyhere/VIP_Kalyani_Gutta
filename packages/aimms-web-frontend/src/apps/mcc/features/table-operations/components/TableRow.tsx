import React from "react"
import { Box, IconButton } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import EditableCell from "./EditableCell"

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

interface TableRow {
  id: string
  cells: TableCell[]
}

interface TableRowProps {
  row: TableRow
  tableId: string
  isHeader: boolean
  onCellChange: (tableId: string, rowId: string, cellId: string, content: string) => void
  onDeleteRow: (tableId: string, rowId: string) => void
  attemptedFields: Set<string>
  isValidVariableFormat: (content: string) => boolean
  onRemoveImage?: (cellId: string) => void
  onOpenGoogleCloud?: (cellId: string) => void
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  tableId,
  isHeader,
  onCellChange,
  onDeleteRow,
  attemptedFields,
  isValidVariableFormat,
  onRemoveImage,
  onOpenGoogleCloud,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      borderBottom: "1px solid rgba(224, 224, 224, 1)",
      "&:last-child": {
        borderBottom: "none",
      },
    }}>
    <Box
      sx={{
        display: "flex",
        flex: 1,
        "& > *": {
          flex: 1,
          p: 1,
          borderRight: "1px solid rgba(224, 224, 224, 1)",
          "&:last-child": {
            borderRight: "none",
          },
        },
      }}>
      {row.cells.map((cell) => (
        <Box key={cell.id} sx={{ position: "relative" }}>
          <EditableCell
            cell={cell}
            tableId={tableId}
            rowId={row.id}
            onCellChange={onCellChange}
            attemptedFields={attemptedFields}
            isValidVariableFormat={isValidVariableFormat}
            onRemoveImage={onRemoveImage}
            onOpenGoogleCloud={onOpenGoogleCloud}
          />
          {cell.isAIGenerated && (
            <AutoAwesomeIcon
              data-testid="AutoAwesomeIcon"
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                fontSize: "1rem",
                color: "primary.main",
              }}
            />
          )}
        </Box>
      ))}
    </Box>
    {!isHeader && (
      <IconButton
        size="small"
        aria-label="Delete Row"
        onClick={() => onDeleteRow(tableId, row.id)}
        sx={{
          ml: 1,
          color: "rgba(0, 0, 0, 0.54)",
          "&:hover": {
            color: "error.main",
          },
        }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    )}
  </Box>
)

export default TableRow
