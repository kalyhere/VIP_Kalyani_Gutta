import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMenuOperations } from "../../hooks/useMenuOperations"

describe("useMenuOperations", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useMenuOperations())

    expect(result.current.fillMenuAnchorEl).toBeNull()
    expect(result.current.activeTableId).toBeNull()
    expect(result.current.formActionsAnchorEl).toBeNull()
    expect(result.current.menuAnchorEl).toBeNull()
    expect(result.current.temperature).toBe(0.7) // Store default is 0.7
  })

  it("should update fillMenuAnchorEl", () => {
    const { result } = renderHook(() => useMenuOperations())
    const mockElement = document.createElement("div")

    act(() => {
      result.current.setFillMenuAnchorEl(mockElement)
    })

    expect(result.current.fillMenuAnchorEl).toBe(mockElement)

    act(() => {
      result.current.setFillMenuAnchorEl(null)
    })

    expect(result.current.fillMenuAnchorEl).toBeNull()
  })

  it("should update activeTableId", () => {
    const { result } = renderHook(() => useMenuOperations())
    const mockTableId = "table-1"

    act(() => {
      result.current.setActiveTableId(mockTableId)
    })

    expect(result.current.activeTableId).toBe(mockTableId)

    act(() => {
      result.current.setActiveTableId(null)
    })

    expect(result.current.activeTableId).toBeNull()
  })

  it("should update formActionsAnchorEl", () => {
    const { result } = renderHook(() => useMenuOperations())
    const mockElement = document.createElement("div")

    act(() => {
      result.current.setFormActionsAnchorEl(mockElement)
    })

    expect(result.current.formActionsAnchorEl).toBe(mockElement)

    act(() => {
      result.current.setFormActionsAnchorEl(null)
    })

    expect(result.current.formActionsAnchorEl).toBeNull()
  })

  it("should update menuAnchorEl", () => {
    const { result } = renderHook(() => useMenuOperations())
    const mockElement = document.createElement("div")

    act(() => {
      result.current.setMenuAnchorEl(mockElement)
    })

    expect(result.current.menuAnchorEl).toBe(mockElement)

    act(() => {
      result.current.setMenuAnchorEl(null)
    })

    expect(result.current.menuAnchorEl).toBeNull()
  })

  it("should update temperature", () => {
    const { result } = renderHook(() => useMenuOperations())

    act(() => {
      result.current.setTemperature(0.7)
    })

    expect(result.current.temperature).toBe(0.7)

    act(() => {
      result.current.setTemperature(0)
    })

    expect(result.current.temperature).toBe(0)
  })
})
