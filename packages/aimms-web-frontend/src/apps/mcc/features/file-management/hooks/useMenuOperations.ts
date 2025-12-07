import { useMCCStore } from "../../../stores/mccStore"

export const useMenuOperations = () => {
  // Get state from store
  const fillMenuAnchorEl = useMCCStore((state) => state.fillMenuAnchorEl)
  const activeTableId = useMCCStore((state) => state.activeTableId)
  const formActionsAnchorEl = useMCCStore((state) => state.formActionsAnchorEl)
  const menuAnchorEl = useMCCStore((state) => state.menuAnchorEl)
  const temperature = useMCCStore((state) => state.temperature)

  // Get actions from store
  const setFillMenuAnchorEl = useMCCStore((state) => state.setFillMenuAnchorEl)
  const setActiveTableId = useMCCStore((state) => state.setActiveTableId)
  const setFormActionsAnchorEl = useMCCStore((state) => state.setFormActionsAnchorEl)
  const setMenuAnchorEl = useMCCStore((state) => state.setMenuAnchorEl)
  const setTemperature = useMCCStore((state) => state.setTemperature)

  return {
    fillMenuAnchorEl,
    setFillMenuAnchorEl,
    activeTableId,
    setActiveTableId,
    formActionsAnchorEl,
    setFormActionsAnchorEl,
    menuAnchorEl,
    setMenuAnchorEl,
    temperature,
    setTemperature,
  }
}
