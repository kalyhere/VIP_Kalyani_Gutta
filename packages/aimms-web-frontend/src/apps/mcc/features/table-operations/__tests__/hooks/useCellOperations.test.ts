/**
 * Integration tests for useCellOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCellOperations } from "../../hooks/useCellOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import {
  resetStore,
  createMockCase,
  createMockSection,
  createMockTable,
  createMockTableRow,
  createMockTableCell,
} from "../../../../shared/__tests__/testUtils"

describe("useCellOperations", () => {
  const isValidVariableFormat = (content: string) => /^\{[^}]+\}$/.test(content.trim())

  beforeEach(() => {
    resetStore()
  })

  describe("handleCellChange", () => {
    it("should update cell content", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleCellChange("table-1", "row-1", "cell-1", "New Content")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.content).toBe("New Content")
    })

    it("should remove cell from attemptedFields if content is valid variable format", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        useMCCStore.getState().setAttemptedFields(new Set(["cell-1"]))
      })

      act(() => {
        result.current.handleCellChange("table-1", "row-1", "cell-1", "{patient_name}")
      })

      const { attemptedFieldsArray } = useMCCStore.getState()
      expect(attemptedFieldsArray).not.toContain("cell-1")
    })

    it("should clear AI generation flags when manually editing AI-generated cell", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({
        id: "cell-1",
        content: "AI Generated",
        isAIGenerated: true,
      })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleCellChange("table-1", "row-1", "cell-1", "Manual Edit")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.isAIGenerated).toBe(false)
      expect(updatedCell?.originalVariable).toBeUndefined()
    })

    it("should update image URLs when provided", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      const imageUrls = ["http://example.com/image1.jpg", "http://example.com/image2.jpg"]

      act(() => {
        result.current.handleCellChange("table-1", "row-1", "cell-1", "Content", imageUrls)
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.imageUrls).toEqual(imageUrls)
    })
  })

  describe("handleClearField", () => {
    it("should clear cell content", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "Some Content" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleClearField("table-1", "row-1", "cell-1")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.content).toBe("")
      expect(updatedCell?.isAIGenerated).toBe(false)
      expect(updatedCell?.originalVariable).toBeUndefined()
      expect(updatedCell?.imageUrls).toBeUndefined()
    })

    it("should restore original variable if present", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({
        id: "cell-1",
        content: "AI Generated Content",
        originalVariable: "patient_name",
        isAIGenerated: true,
      })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleClearField("table-1", "row-1", "cell-1")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.content).toBe("{patient_name}")
      expect(updatedCell?.isAIGenerated).toBe(false)
      expect(updatedCell?.originalVariable).toBeUndefined()
    })

    it("should remove cell from generatedFields map", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "Content", isAIGenerated: true })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        useMCCStore.getState().setGeneratedFields(new Map([["cell-1", "generated value"]]))
      })

      act(() => {
        result.current.handleClearField("table-1", "row-1", "cell-1")
      })

      const { generatedFieldsMap } = useMCCStore.getState()
      expect(generatedFieldsMap["cell-1"]).toBeUndefined()
    })
  })

  describe("handleImageDrop", () => {
    it("should add image URL to cell and clear content", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "Some Text" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleImageDrop("cell-1", "http://example.com/image.jpg")
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.content).toBe("")
      expect(updatedCell?.imageUrls).toEqual(["http://example.com/image.jpg"])
      expect(updatedCell?.isAIGenerated).toBe(false)
      expect(updatedCell?.originalVariable).toBeUndefined()
    })

    it("should remove cell from generatedFields map", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({ id: "cell-1", content: "" })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        useMCCStore.getState().setGeneratedFields(new Map([["cell-1", "generated"]]))
      })

      act(() => {
        result.current.handleImageDrop("cell-1", "http://example.com/image.jpg")
      })

      const { generatedFieldsMap } = useMCCStore.getState()
      expect(generatedFieldsMap["cell-1"]).toBeUndefined()
    })
  })

  describe("handleRemoveImage", () => {
    it("should remove specific image from cell", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({
        id: "cell-1",
        content: "",
        imageUrls: ["http://example.com/img1.jpg", "http://example.com/img2.jpg"],
      })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleRemoveImage("cell-1", 0)
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.imageUrls).toEqual(["http://example.com/img2.jpg"])
    })

    it("should clear imageUrls if last image is removed", () => {
      const { result } = renderHook(() => useCellOperations({ isValidVariableFormat }))

      const cell = createMockTableCell({
        id: "cell-1",
        content: "",
        imageUrls: ["http://example.com/img1.jpg"],
      })
      const row = createMockTableRow(2, { id: "row-1", cells: [cell] })
      const table = createMockTable({ id: "table-1", rows: [row] })
      const section = createMockSection({ id: "section-1", tables: [table] })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.handleRemoveImage("cell-1", 0)
      })

      const { currentCase } = useMCCStore.getState()
      const updatedCell = currentCase?.sections[0].tables[0].rows[0].cells[0]
      expect(updatedCell?.imageUrls).toBeUndefined()
    })
  })
})
