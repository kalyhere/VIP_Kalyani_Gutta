/**
 * Integration tests for useRenameOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRenameOperations } from "../../hooks/useRenameOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import {
  resetStore,
  createMockCase,
  createMockSection,
  createMockTable,
} from "../../../../shared/__tests__/testUtils"

describe("useRenameOperations", () => {
  beforeEach(() => {
    resetStore()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useRenameOperations())

    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should handle starting rename for a case", () => {
    const { result } = renderHook(() => useRenameOperations())

    act(() => {
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    expect(result.current.editingName).toEqual({ type: "case", id: "case-1", name: "Test Case" })
    expect(result.current.newName).toBe("Test Case")
  })

  it("should handle starting rename for a section", () => {
    const { result } = renderHook(() => useRenameOperations())

    act(() => {
      result.current.handleStartRename("section", "section-1", "Test Section")
    })

    expect(result.current.editingName).toEqual({
      type: "section",
      id: "section-1",
      name: "Test Section",
    })
    expect(result.current.newName).toBe("Test Section")
  })

  it("should handle starting rename for a table", () => {
    const { result } = renderHook(() => useRenameOperations())

    act(() => {
      result.current.handleStartRename("table", "table-1", "Test Table")
    })

    expect(result.current.editingName).toEqual({ type: "table", id: "table-1", name: "Test Table" })
    expect(result.current.newName).toBe("Test Table")
  })

  it("should handle updating the new name", () => {
    const { result } = renderHook(() => useRenameOperations())

    act(() => {
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    act(() => {
      result.current.setNewName("Updated Case Name")
    })

    expect(result.current.newName).toBe("Updated Case Name")
  })

  it("should handle finishing rename for a case", () => {
    const { result } = renderHook(() => useRenameOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    act(() => {
      result.current.setNewName("Updated Case Name")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.name).toBe("Updated Case Name")
    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should handle finishing rename for a section", () => {
    const { result } = renderHook(() => useRenameOperations())
    const section = createMockSection({ id: "section-1", title: "Test Section" })
    const mockCase = createMockCase({ sections: [section] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartRename("section", "section-1", "Test Section")
    })

    act(() => {
      result.current.setNewName("Updated Section Name")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.sections[0].title).toBe("Updated Section Name")
    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should handle finishing rename for a table", () => {
    const { result } = renderHook(() => useRenameOperations())
    const table = createMockTable({ id: "table-1", title: "Test Table" })
    const section = createMockSection({ id: "section-1", tables: [table] })
    const mockCase = createMockCase({ sections: [section] })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartRename("table", "table-1", "Test Table")
    })

    act(() => {
      result.current.setNewName("Updated Table Name")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.sections[0].tables[0].title).toBe("Updated Table Name")
    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should not update when finishing rename with empty name", () => {
    const { result } = renderHook(() => useRenameOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    act(() => {
      result.current.setNewName("  ")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.name).toBe("Test Case") // Should not change
    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should not update when finishing rename with no editing in progress", () => {
    const { result } = renderHook(() => useRenameOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.name).toBe("Test Case") // Should not change
  })

  it("should handle case when currentCase is null", () => {
    const { result } = renderHook(() => useRenameOperations())

    act(() => {
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    act(() => {
      result.current.setNewName("Updated Case Name")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase).toBeNull()
    expect(result.current.editingName).toBeNull()
    expect(result.current.newName).toBe("")
  })

  it("should trim whitespace from names", () => {
    const { result } = renderHook(() => useRenameOperations())
    const mockCase = createMockCase({ id: "case-1", name: "Test Case" })

    act(() => {
      useMCCStore.getState().setCurrentCase(mockCase)
      result.current.handleStartRename("case", "case-1", "Test Case")
    })

    act(() => {
      result.current.setNewName("  Updated Case Name  ")
    })

    act(() => {
      result.current.handleFinishRename()
    })

    const { currentCase } = useMCCStore.getState()
    expect(currentCase?.name).toBe("Updated Case Name")
  })
})
