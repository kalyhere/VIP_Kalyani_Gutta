import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useFacultyClasses } from "./useFacultyClasses"
import * as facultyService from "@/services/facultyService"

vi.mock("@/services/facultyService")

describe("useFacultyClasses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch classes on mount", async () => {
    const mockClasses = [
      { id: 1, name: "Class 1", term: "Fall 2024" },
      { id: 2, name: "Class 2", term: "Fall 2024" },
    ]

    vi.mocked(facultyService.getFacultyClasses).mockResolvedValue(mockClasses as any)

    const { result } = renderHook(() => useFacultyClasses())

    expect(result.current.isLoadingClasses).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoadingClasses).toBe(false)
    })

    expect(result.current.classes).toEqual(mockClasses)
    expect(facultyService.getFacultyClasses).toHaveBeenCalledOnce()
  })

  it("should load class details when loadClassDetails is called", async () => {
    const mockClass = { id: 1, name: "Class 1", term: "Fall 2024" }
    const mockAssignments = [{ id: 1, studentId: 1, caseId: 1 }]
    const mockStudents = [{ id: 1, name: "Student 1", email: "student1@test.com" }]

    vi.mocked(facultyService.getFacultyClasses).mockResolvedValue([])
    vi.mocked(facultyService.getClassAssignments).mockResolvedValue(mockAssignments as any)
    vi.mocked(facultyService.getFacultyStudents).mockResolvedValue(mockStudents as any)

    const { result } = renderHook(() => useFacultyClasses())

    await waitFor(() => {
      expect(result.current.isLoadingClasses).toBe(false)
    })

    await result.current.loadClassDetails(mockClass as any)

    await waitFor(() => {
      expect(result.current.selectedClass).toEqual(mockClass)
      expect(result.current.students).toHaveLength(1)
      expect(result.current.assignments).toEqual(mockAssignments)
    })
  })

  it("should handle errors when fetching classes", async () => {
    vi.mocked(facultyService.getFacultyClasses).mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useFacultyClasses())

    await waitFor(() => {
      expect(result.current.isLoadingClasses).toBe(false)
      expect(result.current.error).toBe("Failed to load classes. Please try again.")
    })
  })
})
