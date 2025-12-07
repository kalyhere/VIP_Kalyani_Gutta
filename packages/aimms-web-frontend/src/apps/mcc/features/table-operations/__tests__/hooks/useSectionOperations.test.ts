/**
 * Integration tests for useSectionOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSectionOperations } from "../../hooks/useSectionOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import {
  resetStore,
  createMockCase,
  createMockSection,
} from "../../../../shared/__tests__/testUtils"

describe("useSectionOperations", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("Initial State", () => {
    it("should initialize with empty section title", () => {
      const { result } = renderHook(() => useSectionOperations())

      expect(result.current.newSectionTitle).toBe("")
      expect(result.current.isAddingSectionDialog).toBe(false)
      expect(result.current.deleteSectionConfirmationOpen).toBe(false)
    })
  })

  describe("handleAddSection", () => {
    it("should add a new section to current case", () => {
      const { result } = renderHook(() => useSectionOperations())

      // Set up a current case
      const mockCase = createMockCase({ id: "case-1", name: "Test Case" })
      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      // Set section title
      act(() => {
        result.current.setNewSectionTitle("New Section")
      })

      // Add section
      act(() => {
        result.current.handleAddSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections).toHaveLength(1)
      expect(currentCase?.sections[0].title).toBe("New Section")
      expect(currentCase?.sections[0].tables).toEqual([])
    })

    it("should reset section title and dialog state after adding", () => {
      const { result } = renderHook(() => useSectionOperations())

      const mockCase = createMockCase()
      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setIsAddingSectionDialog(true)
        result.current.setNewSectionTitle("New Section")
      })

      act(() => {
        result.current.handleAddSection()
      })

      expect(result.current.newSectionTitle).toBe("")
      expect(result.current.isAddingSectionDialog).toBe(false)
    })

    it("should not add section if title is empty", () => {
      const { result } = renderHook(() => useSectionOperations())

      const mockCase = createMockCase()
      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.setNewSectionTitle("   ") // whitespace only
      })

      act(() => {
        result.current.handleAddSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections).toHaveLength(0)
    })

    it("should not add section if no current case", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setNewSectionTitle("New Section")
      })

      act(() => {
        result.current.handleAddSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase).toBeNull()
    })
  })

  describe("handleDeleteSection", () => {
    it("should set section to delete and open confirmation dialog", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.handleDeleteSection("section-1")
      })

      expect(result.current.sectionToDelete).toBe("section-1")
      expect(result.current.deleteSectionConfirmationOpen).toBe(true)
    })
  })

  describe("confirmDeleteSection", () => {
    it("should delete the section from current case", () => {
      const { result } = renderHook(() => useSectionOperations())

      const section1 = createMockSection({ id: "section-1", title: "Section 1" })
      const section2 = createMockSection({ id: "section-2", title: "Section 2" })
      const mockCase = createMockCase({ sections: [section1, section2] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.handleDeleteSection("section-1")
      })

      act(() => {
        result.current.confirmDeleteSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections).toHaveLength(1)
      expect(currentCase?.sections[0].id).toBe("section-2")
    })

    it("should close confirmation dialog and clear section to delete", () => {
      const { result } = renderHook(() => useSectionOperations())

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
        result.current.handleDeleteSection("section-1")
      })

      act(() => {
        result.current.confirmDeleteSection()
      })

      expect(result.current.deleteSectionConfirmationOpen).toBe(false)
      expect(result.current.sectionToDelete).toBeNull()
    })

    it("should not delete if no current case", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setSectionToDelete("section-1")
      })

      act(() => {
        result.current.confirmDeleteSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase).toBeNull()
    })

    it("should not delete if no section to delete", () => {
      const { result } = renderHook(() => useSectionOperations())

      const section = createMockSection({ id: "section-1" })
      const mockCase = createMockCase({ sections: [section] })

      act(() => {
        useMCCStore.getState().setCurrentCase(mockCase)
      })

      act(() => {
        result.current.confirmDeleteSection()
      })

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections).toHaveLength(1)
    })
  })

  describe("State Management", () => {
    it("should toggle isAddingSectionDialog", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setIsAddingSectionDialog(true)
      })

      expect(result.current.isAddingSectionDialog).toBe(true)

      act(() => {
        result.current.setIsAddingSectionDialog(false)
      })

      expect(result.current.isAddingSectionDialog).toBe(false)
    })

    it("should update newSectionTitle", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setNewSectionTitle("Test Section")
      })

      expect(result.current.newSectionTitle).toBe("Test Section")
    })

    it("should update deleteSectionConfirmationOpen", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setDeleteSectionConfirmationOpen(true)
      })

      expect(result.current.deleteSectionConfirmationOpen).toBe(true)

      act(() => {
        result.current.setDeleteSectionConfirmationOpen(false)
      })

      expect(result.current.deleteSectionConfirmationOpen).toBe(false)
    })

    it("should update sectionToDelete", () => {
      const { result } = renderHook(() => useSectionOperations())

      act(() => {
        result.current.setSectionToDelete("section-2")
      })

      expect(result.current.sectionToDelete).toBe("section-2")

      act(() => {
        result.current.setSectionToDelete(null)
      })

      expect(result.current.sectionToDelete).toBeNull()
    })
  })
})
