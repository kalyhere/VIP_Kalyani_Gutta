import {
  useMCCStore,
  selectAttemptedFieldsArray,
  selectGeneratedFieldsMap,
} from "../../../stores/mccStore"

interface UseCellOperationsProps {
  isValidVariableFormat: (content: string) => boolean
}

export const useCellOperations = ({ isValidVariableFormat }: UseCellOperationsProps) => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)
  const attemptedFieldsArray = useMCCStore(selectAttemptedFieldsArray)
  const generatedFieldsMap = useMCCStore(selectGeneratedFieldsMap)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setGeneratedFields = useMCCStore((state) => state.setGeneratedFields)
  const setAttemptedFields = useMCCStore((state) => state.setAttemptedFields)
  const setErrorMessage = useMCCStore((state) => state.setErrorMessage)
  const handleCellChange = (
    tableId: string,
    rowId: string,
    cellId: string,
    content: string,
    newImageUrls?: string[]
  ) => {
    // If the content includes a variable and it's valid, remove from attemptedFields
    if (content.includes("{") && isValidVariableFormat(content)) {
      setAttemptedFields((prev) => {
        const next = new Set(prev)
        next.delete(cellId)
        return next
      })
      // Only clear error message if this cell had an error
      if (attemptedFieldsArray.includes(cellId)) {
        setErrorMessage(null)
      }
    }

    setCurrentCase((prevCase) => {
      if (!prevCase) return null

      // Find the specific indices first to avoid multiple traversals
      const sectionIndex = prevCase.sections.findIndex((section) =>
        section.tables.some((t) => t.id === tableId)
      )
      if (sectionIndex === -1) return prevCase

      const tableIndex = prevCase.sections[sectionIndex].tables.findIndex((t) => t.id === tableId)
      if (tableIndex === -1) return prevCase

      const rowIndex = prevCase.sections[sectionIndex].tables[tableIndex].rows.findIndex(
        (r) => r.id === rowId
      )
      if (rowIndex === -1) return prevCase

      const cellIndex = prevCase.sections[sectionIndex].tables[tableIndex].rows[
        rowIndex
      ].cells.findIndex((c) => c.id === cellId)
      if (cellIndex === -1) return prevCase

      const cell =
        prevCase.sections[sectionIndex].tables[tableIndex].rows[rowIndex].cells[cellIndex]
      const { isAIGenerated } = cell

      // Create new objects only for the path that needs updating
      const newSections = [...prevCase.sections]
      const newTables = [...newSections[sectionIndex].tables]
      const newRows = [...newTables[tableIndex].rows]
      const newCells = [...newRows[rowIndex].cells]

      // Update only the specific cell
      newCells[cellIndex] = {
        ...newCells[cellIndex],
        content,
        ...(newCells[cellIndex].isAIGenerated && {
          isAIGenerated: false,
          originalVariable: undefined,
        }),
        ...(newImageUrls && { imageUrls: newImageUrls }),
      }

      // Update only the necessary parts of the state tree
      newRows[rowIndex] = { ...newRows[rowIndex], cells: newCells }
      newTables[tableIndex] = { ...newTables[tableIndex], rows: newRows }
      newSections[sectionIndex] = { ...newSections[sectionIndex], tables: newTables }

      // If the cell was AI-generated, we need to update the generatedFields map
      if (isAIGenerated) {
        setGeneratedFields((prev) => {
          const next = new Map(prev)
          next.delete(cellId)
          return next
        })
      }

      return {
        ...prevCase,
        sections: newSections,
      }
    })

    // If content is cleared or new images are added, remove from generated fields
    if (content === "" || newImageUrls) {
      setGeneratedFields((prev) => {
        const next = new Map(prev)
        next.delete(cellId)
        return next
      })
    }
  }

  const handleClearField = (tableId: string, rowId: string, cellId: string) => {
    setCurrentCase((prevCase) => {
      if (!prevCase) return null
      return {
        ...prevCase,
        sections: prevCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => ({
            ...table,
            rows: table.rows.map((row) => ({
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id === cellId) {
                  // If cell has an original variable, restore it
                  if (cell.originalVariable) {
                    return {
                      ...cell,
                      content: `{${cell.originalVariable}}`,
                      isAIGenerated: false,
                      originalVariable: undefined,
                      imageUrls: undefined,
                    }
                  }
                  // Otherwise just clear the content
                  return {
                    ...cell,
                    content: "",
                    isAIGenerated: false,
                    originalVariable: undefined,
                    imageUrls: undefined,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })

    // Remove from generated fields map
    setGeneratedFields((prev) => {
      const next = new Map(prev)
      next.delete(cellId)
      return next
    })
  }

  const handleImageDrop = (cellId: string, imageUrl: string) => {
    setCurrentCase((prevCase) => {
      if (!prevCase) return null
      return {
        ...prevCase,
        sections: prevCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => ({
            ...table,
            rows: table.rows.map((row) => ({
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id === cellId) {
                  return {
                    ...cell,
                    content: "",
                    imageUrls: [imageUrl],
                    isAIGenerated: false,
                    originalVariable: undefined,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })

    // Remove from generated fields map
    setGeneratedFields((prev) => {
      const next = new Map(prev)
      next.delete(cellId)
      return next
    })
  }

  const handleRemoveImage = (cellId: string, imageIndex: number) => {
    setCurrentCase((prevCase) => {
      if (!prevCase) return null
      return {
        ...prevCase,
        sections: prevCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => ({
            ...table,
            rows: table.rows.map((row) => ({
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id === cellId) {
                  const updatedImageUrls = cell.imageUrls?.filter(
                    (_, index) => index !== imageIndex
                  )
                  return {
                    ...cell,
                    imageUrls: updatedImageUrls?.length ? updatedImageUrls : undefined,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })
  }

  return {
    handleCellChange,
    handleClearField,
    handleImageDrop,
    handleRemoveImage,
  }
}
