/**
 * Integration tests for useResetOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useResetOperations } from "../../hooks/useResetOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import {
  resetStore,
  createMockCase,
  createMockSection,
  createMockTable,
  createMockTableRow,
  createMockTableCell,
} from "../../../../shared/__tests__/testUtils"

describe("useResetOperations", () => {
  beforeEach(() => {
    resetStore()
  })

  it("should reset AI-generated content for a specific table", () => {
    const { result } = renderHook(() => useResetOperations())

    // Create cells with AI-generated content
    const aiCell1 = createMockTableCell({
      id: "cell-1",
      content: "AI Generated Content 1",
      isAIGenerated: true,
      originalVariable: "var1",
    })
    const regularCell = createMockTableCell({
      id: "cell-2",
      content: "Regular Content",
    })
    const aiCell2 = createMockTableCell({
      id: "cell-3",
      content: "AI Generated Content 2",
      isAIGenerated: true,
      originalVariable: "var2",
    })

    const row = createMockTableRow(3, { id: "row-1", cells: [aiCell1, regularCell, aiCell2] })
    const table1 = createMockTable({ id: "table-1", rows: [row] })
    const table2 = createMockTable({ id: "table-2", rows: [row] })
    const section = createMockSection({ id: "section-1", tables: [table1, table2] })
    const mockCase = createMockCase({ sections: [section] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      useMCCStore.getState().setGeneratedFields(
        new Map([
          ["cell-1", "AI Generated Content 1"],
          ["cell-3", "AI Generated Content 2"],
        ])
      )
    })

    act(() => {
      result.current.handleResetAll("table-1")
    })

    const { currentCase } = useMCCStore.getState()
    const { generatedFieldsMap } = useMCCStore.getState()

    // Verify table 1 cells were reset
    const table1Updated = currentCase?.sections[0].tables[0]
    expect(table1Updated?.rows[0].cells[0].content).toBe("{var1}")
    expect(table1Updated?.rows[0].cells[0].isAIGenerated).toBe(false)
    expect(table1Updated?.rows[0].cells[1].content).toBe("Regular Content") // Unchanged
    expect(table1Updated?.rows[0].cells[2].content).toBe("{var2}")
    expect(table1Updated?.rows[0].cells[2].isAIGenerated).toBe(false)

    // Verify table 2 cells were NOT reset
    const table2Updated = currentCase?.sections[0].tables[1]
    expect(table2Updated?.rows[0].cells[0].content).toBe("AI Generated Content 1")
    expect(table2Updated?.rows[0].cells[0].isAIGenerated).toBe(true)

    // Verify the generated fields for table 1 were removed
    expect(generatedFieldsMap["cell-1"]).toBeUndefined()
    expect(generatedFieldsMap["cell-3"]).toBeUndefined()
  })

  it("should reset all AI-generated content across all tables", () => {
    const { result } = renderHook(() => useResetOperations())

    // Create cells with AI-generated content
    const aiCell1 = createMockTableCell({
      id: "cell-1",
      content: "AI Generated Content 1",
      isAIGenerated: true,
      originalVariable: "var1",
    })
    const regularCell = createMockTableCell({
      id: "cell-2",
      content: "Regular Content",
    })
    const aiCell2 = createMockTableCell({
      id: "cell-3",
      content: "AI Generated Content 2",
      isAIGenerated: true,
      originalVariable: "var2",
    })

    const row1 = createMockTableRow(3, { id: "row-1", cells: [aiCell1, regularCell, aiCell2] })
    const table1 = createMockTable({ id: "table-1", rows: [row1] })

    const aiCell3 = createMockTableCell({
      id: "cell-4",
      content: "AI Generated Content 3",
      isAIGenerated: true,
      originalVariable: "var3",
    })
    const row2 = createMockTableRow(1, { id: "row-2", cells: [aiCell3] })
    const table2 = createMockTable({ id: "table-2", rows: [row2] })

    const section = createMockSection({ id: "section-1", tables: [table1, table2] })
    const mockCase = createMockCase({ sections: [section] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      useMCCStore.getState().setGeneratedFields(
        new Map([
          ["cell-1", "AI Generated Content 1"],
          ["cell-3", "AI Generated Content 2"],
          ["cell-4", "AI Generated Content 3"],
        ])
      )
    })

    act(() => {
      result.current.handleFormResetAll()
    })

    const { currentCase } = useMCCStore.getState()
    const { generatedFieldsMap } = useMCCStore.getState()

    // Verify table 1 cells were reset
    const table1Updated = currentCase?.sections[0].tables[0]
    expect(table1Updated?.rows[0].cells[0].content).toBe("{var1}")
    expect(table1Updated?.rows[0].cells[0].isAIGenerated).toBe(false)
    expect(table1Updated?.rows[0].cells[1].content).toBe("Regular Content") // Unchanged
    expect(table1Updated?.rows[0].cells[2].content).toBe("{var2}")
    expect(table1Updated?.rows[0].cells[2].isAIGenerated).toBe(false)

    // Verify table 2 cells were also reset
    const table2Updated = currentCase?.sections[0].tables[1]
    expect(table2Updated?.rows[0].cells[0].content).toBe("{var3}")
    expect(table2Updated?.rows[0].cells[0].isAIGenerated).toBe(false)

    // Check that generatedFields was cleared
    expect(Object.keys(generatedFieldsMap).length).toBe(0)
  })

  it("should handle null currentCase when resetting a table", () => {
    const { result } = renderHook(() => useResetOperations())

    act(() => {
      result.current.handleResetAll("table-1")
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase).toBeNull()
  })

  it("should handle null currentCase when resetting all tables", () => {
    const { result } = renderHook(() => useResetOperations())

    act(() => {
      result.current.handleFormResetAll()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase).toBeNull()

    // Check that generatedFields was cleared
    const { generatedFieldsMap } = useMCCStore.getState()
    expect(Object.keys(generatedFieldsMap).length).toBe(0)
  })

  it("should not modify non-AI-generated cells", () => {
    const { result } = renderHook(() => useResetOperations())

    const headerCell = createMockTableCell({
      id: "cell-1",
      content: "Header 1",
      isHeader: true,
    })
    const regularCell = createMockTableCell({
      id: "cell-2",
      content: "Regular Content",
    })
    const aiCell = createMockTableCell({
      id: "cell-3",
      content: "AI Generated",
      isAIGenerated: true,
      originalVariable: "var1",
    })

    const row = createMockTableRow(3, { id: "row-1", cells: [headerCell, regularCell, aiCell] })
    const table = createMockTable({ id: "table-1", rows: [row] })
    const section = createMockSection({ id: "section-1", tables: [table] })
    const mockCase = createMockCase({ sections: [section] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
    })

    act(() => {
      result.current.handleResetAll("table-1")
    })

    const { currentCase } = useMCCStore.getState()
    const table1 = currentCase?.sections[0].tables[0]

    // Verify regular cells were not modified
    expect(table1?.rows[0].cells[0].content).toBe("Header 1") // Header unchanged
    expect(table1?.rows[0].cells[1].content).toBe("Regular Content") // Regular content unchanged

    // Verify AI cell was reset
    expect(table1?.rows[0].cells[2].content).toBe("{var1}")
    expect(table1?.rows[0].cells[2].isAIGenerated).toBe(false)
  })
})
