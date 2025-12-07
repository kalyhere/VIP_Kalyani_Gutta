import { useMCCStore } from "../../../stores/mccStore"

export const useResetOperations = () => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setGeneratedFields = useMCCStore((state) => state.setGeneratedFields)
  const handleResetAll = (tableId: string) => {
    setCurrentCase((prevCase) => {
      if (!prevCase) return null
      return {
        ...prevCase,
        sections: prevCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => {
            if (table.id === tableId) {
              return {
                ...table,
                rows: table.rows.map((row) => ({
                  ...row,
                  cells: row.cells.map((cell) => {
                    if (cell.isAIGenerated) {
                      return {
                        ...cell,
                        content: `{${cell.originalVariable}}`,
                        isAIGenerated: false,
                      }
                    }
                    return cell
                  }),
                })),
              }
            }
            return table
          }),
        })),
      }
    })
    // Clear generated fields for this table
    setGeneratedFields((prev) => {
      const next = new Map(prev)
      const table = currentCase?.sections.flatMap((s) => s.tables).find((t) => t.id === tableId)
      if (table) {
        table.rows.forEach((row) => {
          row.cells.forEach((cell) => {
            next.delete(cell.id)
          })
        })
      }
      return next
    })
  }

  const handleFormResetAll = () => {
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
                if (cell.isAIGenerated) {
                  return {
                    ...cell,
                    content: `{${cell.originalVariable}}`,
                    isAIGenerated: false,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })
    setGeneratedFields(new Map())
  }

  return {
    handleResetAll,
    handleFormResetAll,
  }
}
