/**
 * Integration tests for useTableOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTableOperations } from "../../hooks/useTableOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import {
  resetStore,
  createMockCase,
  createMockSection,
  createMockTable,
} from "../../../../shared/__tests__/testUtils"

describe("useTableOperations", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("Initial State", () => {
    it("should initialize with default table data", () => {
      const { result } = renderHook(() => useTableOperations())

      expect(result.current.newTableData).toEqual({
        title: "",
        rows: 2,
        columns: 2,
        hasHeader: false,
      })
      expect(result.current.deleteTableConfirmationOpen).toBe(false)
      expect(result.current.tableToDelete).toBeNull()
    })
  })

  describe("handleAddTable", () => {
    it("should add a new table to the section", () => {
      const { result } = renderHook(() => useTableOperations())

      const section = createMockSection({ id: "section-1", title: "Test Section" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewTableData({
          title: "New Table",
          rows: 3,
          columns: 4,
          hasHeader: false,
        })
      })

      act(() => {
        result.current.handleAddTable("section-1")
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections[0].tables).toHaveLength(1)
      expect(currentCase?.sections[0].tables[0].title).toBe("New Table")
      expect(currentCase?.sections[0].tables[0].columns).toBe(4)
      expect(currentCase?.sections[0].tables[0].rows).toHaveLength(3)
    })

    it("should add header row when hasHeader is true", () => {
      const { result } = renderHook(() => useTableOperations())

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewTableData({
          title: "Table with Header",
          rows: 2,
          columns: 3,
          hasHeader: true,
        })
      })

      act(() => {
        result.current.handleAddTable("section-1")
      })

      const { currentCase } = useMCCStore.getState()
      const table = currentCase?.sections[0].tables[0]

      // Should have header row + 2 data rows = 3 total
      expect(table?.rows).toHaveLength(3)
      // First row should be header
      expect(table?.rows[0].cells[0].isHeader).toBe(true)
      // Subsequent rows should not be headers
      expect(table?.rows[1].cells[0].isHeader).toBe(false)
    })

    it("should reset table data after adding", () => {
      const { result } = renderHook(() => useTableOperations())

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewTableData({
          title: "Test Table",
          rows: 5,
          columns: 3,
          hasHeader: true,
        })
      })

      act(() => {
        result.current.handleAddTable("section-1")
      })

      expect(result.current.newTableData).toEqual({
        title: "",
        rows: 2,
        columns: 2,
        hasHeader: false,
      })
    })

    it("should not add table if title is empty", () => {
      const { result } = renderHook(() => useTableOperations())

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewTableData({
          title: "   ", // whitespace only
          rows: 2,
          columns: 2,
          hasHeader: false,
        })
      })

      act(() => {
        result.current.handleAddTable("section-1")
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections[0].tables).toHaveLength(0)
    })

    it("should call onSuccess callback when provided", () => {
      const { result } = renderHook(() => useTableOperations())
      const onSuccess = vi.fn()

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewTableData({
          title: "Test Table",
          rows: 2,
          columns: 2,
          hasHeader: false,
        })
      })

      act(() => {
        result.current.handleAddTable("section-1", onSuccess)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe("confirmDeleteTable", () => {
    it("should delete the table from the section", () => {
      const { result } = renderHook(() => useTableOperations())

      const table1 = createMockTable({ id: "table-1", title: "Table 1" })
      const table2 = createMockTable({ id: "table-2", title: "Table 2" })
      const section = createMockSection({ id: "section-1", tables: [table1, table2] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.handleDeleteTable("section-1", "table-1")
      })

      act(() => {
        result.current.confirmDeleteTable()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections[0].tables).toHaveLength(1)
      expect(currentCase?.sections[0].tables[0].id).toBe("table-2")
    })
  })

  describe("handleAddRow", () => {
    it("should add a row to the table", () => {
      const { result } = renderHook(() => useTableOperations())

      const table = createMockTable({ id: "table-1", columns: 3, rows: [] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleAddRow("table-1")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedTable = currentCase?.sections[0].tables[0]

      expect(updatedTable?.rows).toHaveLength(1)
      expect(updatedTable?.rows[0].cells).toHaveLength(3)
    })

    it("should not add row if table already has 10 rows", () => {
      const { result } = renderHook(() => useTableOperations())

      // Create table with 10 rows
      const rows = Array.from({ length: 10 }, (_, i) => ({
        id: `row-${i}`,
        cells: [{ id: `cell-${i}`, content: "", isHeader: false, isLocked: false }],
      }))
      const table = createMockTable({ id: "table-1", rows })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleAddRow("table-1")
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections[0].tables[0].rows).toHaveLength(10)
    })
  })
})
