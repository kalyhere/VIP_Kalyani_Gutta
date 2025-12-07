import React from "react"
import { Box, Typography, TextField, IconButton, Button, Paper } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import TableRowComponent from "./TableRow"
import TableActions from "./TableActions"

interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrl?: string
}

interface TableRow {
  id: string
  cells: TableCell[]
}

interface Table {
  id: string
  title: string
  hasHeader: boolean
  columns: number
  rows: TableRow[]
}

interface Section {
  id: string
  title: string
  tables: Table[]
}

interface TableSectionProps {
  section: Section
  onDeleteSection: (sectionId: string) => void
  onAddTable: (sectionId: string) => void
  onDeleteTable: (tableId: string) => void
  onCellChange: (tableId: string, rowId: string, cellId: string, content: string) => void
  onAddRow: (tableId: string) => void
  onDeleteRow: (tableId: string, rowId: string) => void
  onAddColumn: (tableId: string) => void
  onDeleteColumn: (tableId: string, columnIndex: number) => void
  onSectionTitleChange: (sectionId: string, title: string) => void
  attemptedFields: Set<string>
  isValidVariableFormat: (content: string) => boolean
  hasUnfilledVariables?: (table: Table) => boolean
  hasGeneratedContent?: (table: Table) => boolean
  handleFillEmpty?: (tableId: string) => void
  handleRegenerateAll?: (tableId: string) => void
  handleResetAll?: (tableId: string) => void
  isGenerating?: boolean
}

const TableSection: React.FC<TableSectionProps> = ({
  section,
  onDeleteSection,
  onAddTable,
  onDeleteTable,
  onCellChange,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn,
  onSectionTitleChange,
  attemptedFields,
  isValidVariableFormat,
  hasUnfilledVariables = () => false,
  hasGeneratedContent = () => false,
  handleFillEmpty = () => {},
  handleRegenerateAll = () => {},
  handleResetAll = () => {},
  isGenerating = false,
}) => {
  const [sectionTitle, setSectionTitle] = React.useState(section.title)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSectionTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    if (sectionTitle !== section.title) {
      onSectionTitleChange(section.id, sectionTitle)
    }
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TextField
          value={sectionTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          variant="standard"
          InputProps={{
            sx: {
              fontSize: "1.25rem",
              fontWeight: "bold",
            },
          }}
        />
        <IconButton
          aria-label="Delete Section"
          onClick={() => onDeleteSection(section.id)}
          sx={{
            ml: 1,
            color: "rgba(0, 0, 0, 0.54)",
            "&:hover": {
              color: "error.main",
            },
          }}>
          <DeleteIcon />
        </IconButton>
      </Box>

      {section.tables.length > 0 ? (
        section.tables.map((table) => (
          <Paper key={table.id} sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {table.title}
            </Typography>

            <Box sx={{ mb: 2 }}>
              {table.rows.map((row, rowIndex) => (
                <TableRowComponent
                  key={row.id}
                  row={row}
                  tableId={table.id}
                  isHeader={rowIndex === 0 && table.hasHeader}
                  onCellChange={onCellChange}
                  onDeleteRow={onDeleteRow}
                  attemptedFields={attemptedFields}
                  isValidVariableFormat={isValidVariableFormat}
                />
              ))}
            </Box>

            <TableActions
              table={table}
              isGenerating={isGenerating}
              onDeleteTable={onDeleteTable}
              onAddRow={onAddRow}
              onDeleteRow={onDeleteRow}
              onAddColumn={onAddColumn}
              onDeleteColumn={onDeleteColumn}
              hasUnfilledVariables={hasUnfilledVariables}
              hasGeneratedContent={hasGeneratedContent}
              handleFillEmpty={handleFillEmpty}
              handleRegenerateAll={handleRegenerateAll}
              handleResetAll={handleResetAll}
            />
          </Paper>
        ))
      ) : (
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2, mb: 2 }}>
          No tables in this section. Add a table to get started.
        </Typography>
      )}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onAddTable(section.id)}
        aria-label="Add Table"
        sx={{ mt: 1 }}>
        Add Table
      </Button>
    </Box>
  )
}

export default TableSection
