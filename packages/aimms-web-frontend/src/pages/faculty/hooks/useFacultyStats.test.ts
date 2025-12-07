import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useFacultyStats } from "./useFacultyStats"
import * as facultyService from "@/services/facultyService"

vi.mock("@/services/facultyService")

describe("useFacultyStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fetch faculty stats on mount", async () => {
    const mockStats = {
      id: 1,
      name: "Dr. Smith",
      email: "smith@test.com",
      totalClasses: 3,
      totalStudents: 50,
    }

    vi.mocked(facultyService.getFacultyStats).mockResolvedValue(mockStats as any)

    const { result } = renderHook(() => useFacultyStats())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.facultyData).toEqual(mockStats)
    expect(facultyService.getFacultyStats).toHaveBeenCalledOnce()
  })

  it("should handle errors when fetching stats", async () => {
    vi.mocked(facultyService.getFacultyStats).mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useFacultyStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe("Failed to load faculty stats. Please try again.")
    })
  })

  it("should return correct greeting based on time of day", () => {
    const { result } = renderHook(() => useFacultyStats())

    // Mock different times
    const originalDate = Date

    // Morning (8 AM)
    global.Date = class extends originalDate {
      getHours() {
        return 8
      }
    } as any
    expect(result.current.getGreeting()).toBe("Good morning")

    // Afternoon (2 PM)
    global.Date = class extends originalDate {
      getHours() {
        return 14
      }
    } as any
    expect(result.current.getGreeting()).toBe("Good afternoon")

    // Evening (8 PM)
    global.Date = class extends originalDate {
      getHours() {
        return 20
      }
    } as any
    expect(result.current.getGreeting()).toBe("Good evening")

    // Restore
    global.Date = originalDate
  })
})
