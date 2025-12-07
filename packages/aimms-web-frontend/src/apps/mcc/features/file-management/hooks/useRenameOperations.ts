import { useMCCStore } from "../../../stores/mccStore"

export const useRenameOperations = () => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)
  const editingName = useMCCStore((state) => state.editingName)
  const newName = useMCCStore((state) => state.newName)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setEditingName = useMCCStore((state) => state.setEditingName)
  const setNewName = useMCCStore((state) => state.setNewName)

  const handleStartRename = (
    type: "case" | "section" | "table",
    id: string,
    currentName: string
  ) => {
    setEditingName({ type, id, name: currentName })
    setNewName(currentName)
  }

  const handleFinishRename = () => {
    if (!editingName || !newName.trim()) {
      setEditingName(null)
      setNewName("")
      return
    }

    if (editingName.type === "case" && currentCase) {
      setCurrentCase({
        ...currentCase,
        name: newName.trim(),
      })
    } else if (editingName.type === "section" && currentCase) {
      setCurrentCase({
        ...currentCase,
        sections: currentCase.sections.map((section) =>
          section.id === editingName.id ? { ...section, title: newName.trim() } : section
        ),
      })
    } else if (editingName.type === "table" && currentCase) {
      setCurrentCase({
        ...currentCase,
        sections: currentCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) =>
            table.id === editingName.id ? { ...table, title: newName.trim() } : table
          ),
        })),
      })
    }

    setEditingName(null)
    setNewName("")
  }

  return {
    editingName,
    newName,
    setNewName,
    handleStartRename,
    handleFinishRename,
  }
}
