import { useMCCStore } from "../../../stores/mccStore"
import { TableSection, TableRow } from "../../../shared/types"

export const useTableOperations = () => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)
  const newTableData = useMCCStore((state) => state.newTableData)
  const tableToDelete = useMCCStore((state) => state.tableToDelete)
  const deleteTableConfirmationOpen = useMCCStore((state) => state.deleteTableConfirmationOpen)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setNewTableData = useMCCStore((state) => state.setNewTableData)
  const setTableToDelete = useMCCStore((state) => state.setTableToDelete)
  const setDeleteTableConfirmationOpen = useMCCStore(
    (state) => state.setDeleteTableConfirmationOpen
  )

  const handleAddTable = (selectedSectionId: string, onSuccess?: () => void) => {
    if (!currentCase || !selectedSectionId || !newTableData.title.trim()) return

    const newTable: TableSection = {
      id: `table-${Date.now()}`,
      title: newTableData.title,
      hasHeader: newTableData.hasHeader,
      columns: newTableData.columns,
      rows: [],
    }

    // Create header row if needed
    if (newTableData.hasHeader) {
      const headerRow: TableRow = {
        id: `row-${Date.now()}-header`,
        cells: Array(newTableData.columns)
          .fill(null)
          .map((_, index) => ({
            id: `cell-${Date.now()}-header-${index}`,
            content: "",
            isHeader: true,
            isLocked: false,
          })),
      }
      newTable.rows.push(headerRow)
    }

    // Create data rows
    for (let i = 0; i < newTableData.rows; i++) {
      const row: TableRow = {
        id: `row-${Date.now()}-${i}`,
        cells: Array(newTableData.columns)
          .fill(null)
          .map((_, index) => ({
            id: `cell-${Date.now()}-${i}-${index}`,
            content: "",
            isHeader: false,
            isLocked: false,
          })),
      }
      newTable.rows.push(row)
    }

    setCurrentCase({
      ...currentCase,
      sections: currentCase.sections.map((section) =>
        section.id === selectedSectionId
          ? { ...section, tables: [...section.tables, newTable] }
          : section,
      ),
    })

    setNewTableData({
      title: "",
      rows: 2,
      columns: 2,
      hasHeader: false,
    })

    // Call the success callback if provided
    onSuccess?.()
  }

  const handleDeleteTable = (sectionId: string, tableId: string) => {
    setTableToDelete({ sectionId, tableId })
    setDeleteTableConfirmationOpen(true)
  }

  const confirmDeleteTable = () => {
    if (!currentCase || !tableToDelete) return
    setCurrentCase({
      ...currentCase,
      sections: currentCase.sections.map((section) =>
        section.id === tableToDelete.sectionId
          ? {
              ...section,
              tables: section.tables.filter((table) => table.id !== tableToDelete.tableId),
            }
          : section,
      ),
    })
    setDeleteTableConfirmationOpen(false)
    setTableToDelete(null)
  }

  const handleAddRow = (tableId: string) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null

      // Find the table first to check row count
      const table = currentCase.sections.flatMap((s) => s.tables).find((t) => t.id === tableId)

      if (!table || table.rows.length >= 10) return currentCase

      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              const newRow: TableRow = {
                id: `row-${Date.now()}`,
                cells: Array(table.columns)
                  .fill(null)
                  .map((_, index) => ({
                    id: `cell-${Date.now()}-${index}`,
                    content: "",
                    isHeader: false,
                    isLocked: false,
                  })),
              }
              return {
                ...table,
                rows: [...table.rows, newRow],
              }
            }
            return table
          }),
        })),
      }
    })
  }

  const handleDeleteRow = (tableId: string, rowId: string) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null
      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              return {
                ...table,
                rows: table.rows.filter((row) => row.id !== rowId),
              }
            }
            return table
          }),
        })),
      }
    })
  }

  const handleAddColumn = (tableId: string) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null
      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              return {
                ...table,
                columns: table.columns + 1,
                rows: table.rows.map((row) => ({
                  ...row,
                  cells: [
                    ...row.cells,
                    {
                      id: `cell-${Date.now()}-${row.id}`,
                      content: "",
                      isHeader: row.cells[0]?.isHeader || false,
                      isLocked: false,
                    },
                  ],
                })),
              }
            }
            return table
          }),
        })),
      }
    })
  }

  const handleDeleteColumn = (tableId: string, columnIndex: number) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null
      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              return {
                ...table,
                columns: table.columns - 1,
                rows: table.rows.map((row) => ({
                  ...row,
                  cells: row.cells.filter((_, index) => index !== columnIndex),
                })),
              }
            }
            return table
          }),
        })),
      }
    })
  }

  const handleInsertRow = (tableId: string, afterRowId: string) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null
      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              const rowIndex = table.rows.findIndex((row) => row.id === afterRowId)
              if (rowIndex === -1) return table

              const newRow: TableRow = {
                id: `row-${Date.now()}`,
                cells: Array(table.columns)
                  .fill(null)
                  .map((_, index) => ({
                    id: `cell-${Date.now()}-${index}`,
                    content: "",
                    isHeader: false,
                    isLocked: false,
                  })),
              }

              const newRows = [...table.rows]
              newRows.splice(rowIndex + 1, 0, newRow)

              return {
                ...table,
                rows: newRows,
              }
            }
            return table
          }),
        })),
      }
    })
  }

  const handleInsertColumn = (tableId: string, afterColumnIndex: number) => {
    setCurrentCase((currentCase) => {
      if (!currentCase) return null
      return {
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              return {
                ...table,
                columns: table.columns + 1,
                rows: table.rows.map((row) => {
                  const newCells = [...row.cells]
                  newCells.splice(afterColumnIndex + 1, 0, {
                    id: `cell-${Date.now()}-${row.id}`,
                    content: "",
                    isHeader: row.cells[0]?.isHeader || false,
                    isLocked: false,
                  })
                  return { ...row, cells: newCells }
                }),
              }
            }
            return table
          }),
        })),
      }
    })
  }

  return {
    newTableData,
    setNewTableData,
    handleAddTable,
    handleDeleteTable,
    handleAddRow,
    handleDeleteRow,
    handleAddColumn,
    handleDeleteColumn,
    handleInsertRow,
    handleInsertColumn,
    tableToDelete,
    setTableToDelete,
    deleteTableConfirmationOpen,
    setDeleteTableConfirmationOpen,
    confirmDeleteTable,
  }
}
