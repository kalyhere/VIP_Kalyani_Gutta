import { TableSection, TableDialogData } from "../../types"
import { isValidVariableFormat } from "./validation"

export const hasUnfilledVariables = (table?: TableSection): boolean => {
  if (!table) return false
  return table.rows.some((row) =>
    row.cells.some(
    (cell) =>
        !cell.isAIGenerated && cell.content.includes("{") && isValidVariableFormat(cell.content)
    )
  )
}

export const hasGeneratedContent = (table?: TableSection): boolean => {
  if (!table) return false
  return table.rows.some((row) => row.cells.some((cell) => cell.isAIGenerated))
}

export const isTableDataValid = (data: TableDialogData): boolean => {
  const rows = typeof data.rows === "number" ? data.rows : 0
  const columns = typeof data.columns === "number" ? data.columns : 0
  return data.title.trim() !== "" && rows >= 1 && rows <= 10 && columns >= 1 && columns <= 10
}
