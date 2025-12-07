import { renderHook, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import dayjs from "dayjs"
import { useAssignmentFlow } from "./useAssignmentFlow"

describe("useAssignmentFlow", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    expect(result.current.activeStep).toBe(0)
    expect(result.current.selectedCaseForAssignment).toBeNull()
    expect(result.current.selectedStudents).toEqual([])
    expect(result.current.viewerContent).toBeNull()
  })

  it("should handle case selection", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    const mockCase = {
      id: 1,
      title: "Test Case",
      content: JSON.stringify({ sections: [] }),
    }

    act(() => {
      result.current.handleCaseSelect(mockCase as any)
    })

    expect(result.current.activeStep).toBe(1)
    expect(result.current.selectedCaseForAssignment).toEqual(mockCase)
    expect(result.current.viewerContent).toEqual({ sections: [] })
  })

  it("should handle student toggle", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    act(() => {
      result.current.handleStudentToggle(1)
    })

    expect(result.current.selectedStudents).toEqual([1])

    act(() => {
      result.current.handleStudentToggle(2)
    })

    expect(result.current.selectedStudents).toEqual([1, 2])

    act(() => {
      result.current.handleStudentToggle(1)
    })

    expect(result.current.selectedStudents).toEqual([2])
  })

  it("should handle select all students", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    const allStudentIds = [1, 2, 3, 4]

    act(() => {
      result.current.handleSelectAllStudents(allStudentIds)
    })

    expect(result.current.selectedStudents).toEqual(allStudentIds)

    act(() => {
      result.current.handleSelectAllStudents(allStudentIds)
    })

    expect(result.current.selectedStudents).toEqual([])
  })

  it("should reset flow", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    // Set some state
    act(() => {
      result.current.handleCaseSelect({ id: 1, content: "{}" } as any)
      result.current.handleStudentToggle(1)
    })

    expect(result.current.activeStep).toBe(1)
    expect(result.current.selectedStudents).toEqual([1])

    // Reset
    act(() => {
      result.current.resetFlow()
    })

    expect(result.current.activeStep).toBe(0)
    expect(result.current.selectedCaseForAssignment).toBeNull()
    expect(result.current.selectedStudents).toEqual([])
    expect(result.current.viewerContent).toBeNull()
  })

  it("should not toggle student if not in assignableIds", () => {
    const { result } = renderHook(() => useAssignmentFlow())

    act(() => {
      result.current.handleStudentToggle(5, [1, 2, 3])
    })

    expect(result.current.selectedStudents).toEqual([])
  })
})
