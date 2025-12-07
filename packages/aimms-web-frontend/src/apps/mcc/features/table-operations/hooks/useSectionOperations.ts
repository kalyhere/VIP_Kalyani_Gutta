import { useMCCStore } from "../../../stores/mccStore"
import { Section } from "../../../shared/types"

export const useSectionOperations = () => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)
  const newSectionTitle = useMCCStore((state) => state.newSectionTitle)
  const isAddingSectionDialog = useMCCStore((state) => state.isAddingSectionDialog)
  const sectionToDelete = useMCCStore((state) => state.sectionToDelete)
  const deleteSectionConfirmationOpen = useMCCStore((state) => state.deleteSectionConfirmationOpen)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setNewSectionTitle = useMCCStore((state) => state.setNewSectionTitle)
  const setIsAddingSectionDialog = useMCCStore((state) => state.setIsAddingSectionDialog)
  const setSectionToDelete = useMCCStore((state) => state.setSectionToDelete)
  const setDeleteSectionConfirmationOpen = useMCCStore(
    (state) => state.setDeleteSectionConfirmationOpen,
  )

  const handleAddSection = () => {
    if (!currentCase || !newSectionTitle.trim()) return

    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: newSectionTitle,
      tables: [],
    }
    setCurrentCase({
      ...currentCase,
      sections: [...currentCase.sections, newSection],
    })
    setNewSectionTitle("")
    setIsAddingSectionDialog(false)
  }

  const handleDeleteSection = (sectionId: string) => {
    setSectionToDelete(sectionId)
    setDeleteSectionConfirmationOpen(true)
  }

  const confirmDeleteSection = () => {
    if (!currentCase || !sectionToDelete) return
    setCurrentCase({
      ...currentCase,
      sections: currentCase.sections.filter((section) => section.id !== sectionToDelete),
    })
    setDeleteSectionConfirmationOpen(false)
    setSectionToDelete(null)
  }

  return {
    newSectionTitle,
    setNewSectionTitle,
    isAddingSectionDialog,
    setIsAddingSectionDialog,
    handleAddSection,
    handleDeleteSection,
    sectionToDelete,
    setSectionToDelete,
    deleteSectionConfirmationOpen,
    setDeleteSectionConfirmationOpen,
    confirmDeleteSection,
  }
}
