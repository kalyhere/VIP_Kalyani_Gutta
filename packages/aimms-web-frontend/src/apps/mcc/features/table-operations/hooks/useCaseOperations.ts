import { useEffect } from "react"
import { useMCCStore, Case } from "../../../stores/mccStore"
import defaultTemplate from "../../../shared/templates/mcc_demo_1.json"
import { DifficultyLevel } from "@/types/medical-cases"

export const useCaseOperations = () => {
  // Get state from store
  const cases = useMCCStore((state) => state.cases)
  const currentCase = useMCCStore((state) => state.currentCase)
  const isCreatingCase = useMCCStore((state) => state.isCreatingCase)
  const newCaseName = useMCCStore((state) => state.newCaseName)
  const caseToDelete = useMCCStore((state) => state.caseToDelete)
  const deleteConfirmationOpen = useMCCStore((state) => state.deleteConfirmationOpen)
  const clearAllConfirmationOpen = useMCCStore((state) => state.clearAllConfirmationOpen)

  // Get actions from store
  const setCases = useMCCStore((state) => state.setCases)
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setIsCreatingCase = useMCCStore((state) => state.setIsCreatingCase)
  const setNewCaseName = useMCCStore((state) => state.setNewCaseName)
  const setCaseToDelete = useMCCStore((state) => state.setCaseToDelete)
  const setDeleteConfirmationOpen = useMCCStore((state) => state.setDeleteConfirmationOpen)
  const setClearAllConfirmationOpen = useMCCStore((state) => state.setClearAllConfirmationOpen)

  // Load all cases from localStorage on mount
  useEffect(() => {
    const savedCases = localStorage.getItem("medicalCases")
    if (savedCases) {
      try {
        const parsedCases = JSON.parse(savedCases)
        // Ensure we're not modifying the case names
        const validatedCases = parsedCases.map((c: Case) => ({
          ...c,
          lastModified: c.lastModified || new Date().toISOString(),
        }))
        setCases(validatedCases)
      } catch (error) {
        console.error("Error loading saved cases:", error)
      }
    }
  }, [setCases])

  // Update cases list when current case changes
  useEffect(() => {
    if (currentCase) {
      setCases((prevCases) => {
        const caseIndex = prevCases.findIndex((c) => c.id === currentCase.id)
        const updatedCase = {
          ...currentCase,
          lastModified: new Date().toISOString(),
        }

        let updatedCases
        if (caseIndex >= 0) {
          updatedCases = [...prevCases]
          updatedCases[caseIndex] = updatedCase
        } else {
          updatedCases = [...prevCases, updatedCase]
        }

        localStorage.setItem("medicalCases", JSON.stringify(updatedCases))
        return updatedCases
      })
    }
  }, [currentCase, setCases])

  const handleCreateCase = (isTourActive: boolean = false) => {
    if (newCaseName.trim()) {
      // Create new case, using the default template only if the tour is active
      const newCase: Case = {
        id: `case-${Date.now()}`,
        title: newCaseName,
        name: newCaseName,
        description: "",
        difficulty: DifficultyLevel.Intermediate,
        sections: isTourActive
          ? defaultTemplate.sections.map((section) => ({
              ...section,
              // Keep original template IDs when using a template
              tables: section.tables.map((table) => ({
                ...table,
              })),
            }))
          : [],
        lastModified: new Date().toISOString(),
      }
      setCases((prevCases) => {
        const updatedCases = [...prevCases, newCase]
        localStorage.setItem("medicalCases", JSON.stringify(updatedCases))
        return updatedCases
      })
      setCurrentCase(newCase)
      setNewCaseName("")
      setIsCreatingCase(false)
    }
  }

  const handleBackToDashboard = () => {
    if (currentCase) {
      const updatedCase = {
        ...currentCase,
        lastModified: new Date().toISOString(),
      }
      setCases((prevCases) => {
        const updatedCases = prevCases.map((c) => (c.id === currentCase.id ? updatedCase : c))
        if (!prevCases.find((c) => c.id === currentCase.id)) {
          updatedCases.push(updatedCase)
        }
        localStorage.setItem("medicalCases", JSON.stringify(updatedCases))
        return updatedCases
      })
    }
    setCurrentCase(null)
    setIsCreatingCase(false)
  }

  const handleDeleteCase = (caseId: string) => {
    setCaseToDelete(caseId)
    setDeleteConfirmationOpen(true)
  }

  const confirmDelete = () => {
    if (caseToDelete) {
      setCases((prevCases) => {
        const updatedCases = prevCases.filter((c) => c.id !== caseToDelete)
        localStorage.setItem("medicalCases", JSON.stringify(updatedCases))
        return updatedCases
      })
    }
    setDeleteConfirmationOpen(false)
    setCaseToDelete(null)
  }

  const handleClearAll = () => {
    if (!currentCase) return
    setClearAllConfirmationOpen(true)
  }

  const confirmClearAll = () => {
    if (!currentCase) return
    setCurrentCase({
      ...currentCase,
      sections: [],
    })
    setClearAllConfirmationOpen(false)
  }

  return {
    cases,
    setCases,
    currentCase,
    setCurrentCase,
    isCreatingCase,
    setIsCreatingCase,
    newCaseName,
    setNewCaseName,
    caseToDelete,
    deleteConfirmationOpen,
    setDeleteConfirmationOpen,
    clearAllConfirmationOpen,
    setClearAllConfirmationOpen,
    handleCreateCase,
    handleBackToDashboard,
    handleDeleteCase,
    confirmDelete,
    handleClearAll,
    confirmClearAll,
    setCaseToDelete,
  }
}
