/**
 * Integration tests for useCaseOperations hook
 * Tests hook functionality with Zustand store
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useCaseOperations } from "../../hooks/useCaseOperations"
import { useMCCStore } from "../../../../stores/mccStore"
import { resetStore, createMockCase } from "../../../../shared/__tests__/testUtils"

describe("useCaseOperations", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    resetStore()
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty cases", () => {
      const { result } = renderHook(() => useCaseOperations())

      expect(result.current.cases).toEqual([])
      expect(result.current.currentCase).toBeNull()
      expect(result.current.isCreatingCase).toBe(false)
    })

    it("should load cases from localStorage on mount", () => {
      const mockCases = [createMockCase({ id: "case-1", name: "Saved Case" })]
      localStorageMock.setItem("medicalCases", JSON.stringify(mockCases))

      const { result } = renderHook(() => useCaseOperations())

      // Wait for useEffect to run
      expect(result.current.cases).toHaveLength(1)
      expect(result.current.cases[0].name).toBe("Saved Case")
    })
  })

  describe("handleCreateCase", () => {
    it("should create a new case with provided name", async () => {
      const { result } = renderHook(() => useCaseOperations())

      // Set the name first
      act(() => {
        result.current.setNewCaseName("New Test Case")
      })

      // Then create the case in a separate act block
      act(() => {
        result.current.handleCreateCase(false)
      })

      // Wait for useEffect to update cases array
      await waitFor(() => {
        expect(result.current.cases).toHaveLength(1)
      })

      expect(result.current.cases[0].name).toBe("New Test Case")
      expect(result.current.cases[0].sections).toEqual([])
      expect(result.current.currentCase?.name).toBe("New Test Case")
    })

    it("should create case with template when tour is active", async () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("Tour Case")
      })

      act(() => {
        result.current.handleCreateCase(true) // isTourActive = true
      })

      // Wait for useEffect to update cases array
      await waitFor(() => {
        expect(result.current.cases).toHaveLength(1)
      })

      expect(result.current.currentCase?.sections.length).toBeGreaterThan(0)
      expect(result.current.currentCase?.name).toBe("Tour Case")
    })

    it("should save case to localStorage", async () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("Test Case")
      })

      act(() => {
        result.current.handleCreateCase(false)
      })

      // Wait for useEffect to save to localStorage
      await waitFor(() => {
        const savedCases = JSON.parse(localStorageMock.getItem("medicalCases") || "[]")
        expect(savedCases).toHaveLength(1)
      })

      const savedCases = JSON.parse(localStorageMock.getItem("medicalCases") || "[]")
      expect(savedCases[0].name).toBe("Test Case")
    })

    it("should reset creation state after creating case", () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setIsCreatingCase(true)
        result.current.setNewCaseName("Test Case")
      })

      act(() => {
        result.current.handleCreateCase(false)
      })

      expect(result.current.newCaseName).toBe("")
      expect(result.current.isCreatingCase).toBe(false)
    })

    it("should not create case if name is empty", () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("   ") // whitespace only
        result.current.handleCreateCase(false)
      })

      expect(result.current.cases).toHaveLength(0)
      expect(result.current.currentCase).toBeNull()
    })
  })

  describe("handleBackToDashboard", () => {
    it("should clear current case", async () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("Test Case")
      })

      act(() => {
        result.current.handleCreateCase(false)
      })

      await waitFor(() => {
        expect(result.current.currentCase).not.toBeNull()
      })

      act(() => {
        result.current.handleBackToDashboard()
      })

      expect(result.current.currentCase).toBeNull()
    })

    it("should save current case before clearing", async () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("Test Case")
      })

      act(() => {
        result.current.handleCreateCase(false)
      })

      await waitFor(() => {
        expect(result.current.cases).toHaveLength(1)
      })

      const caseId = result.current.currentCase?.id

      act(() => {
        result.current.handleBackToDashboard()
      })

      // Case should still be in cases array
      expect(result.current.cases.find((c) => c.id === caseId)).toBeDefined()

      // And saved to localStorage
      const savedCases = JSON.parse(localStorageMock.getItem("medicalCases") || "[]")
      expect(savedCases.find((c: any) => c.id === caseId)).toBeDefined()
    })
  })

  describe("confirmDelete", () => {
    it("should delete the case", async () => {
      const { result } = renderHook(() => useCaseOperations())

      act(() => {
        result.current.setNewCaseName("Case to Delete")
      })

      act(() => {
        result.current.handleCreateCase(false)
      })

      await waitFor(() => {
        expect(result.current.cases).toHaveLength(1)
      })

      const caseId = result.current.cases[0].id

      act(() => {
        result.current.handleDeleteCase(caseId)
      })

      act(() => {
        result.current.confirmDelete()
      })

      expect(result.current.cases).toHaveLength(0)
      expect(result.current.deleteConfirmationOpen).toBe(false)
      expect(result.current.caseToDelete).toBeNull()
    })
  })
})
