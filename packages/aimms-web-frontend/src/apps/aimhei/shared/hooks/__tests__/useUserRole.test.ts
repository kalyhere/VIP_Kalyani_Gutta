import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useUserRole } from "../useUserRole"
import { api } from "@/services/api"
import { useAIMHEIStore } from "../../../stores/aimheiStore"

vi.mock("@/services/api")

describe("useUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset user role state in Zustand store
    useAIMHEIStore.setState({
      userRole: null,
      userRoleLoading: true,
    })
  })

  it("should detect admin role", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} }) // faculty stats succeeds

    const { result } = renderHook(() => useUserRole())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.userRole).toBe("admin")
    })
  })

  it("should detect student role", async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error("Unauthorized")) // faculty stats fails
      .mockResolvedValueOnce({ data: {} }) // student stats succeeds

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.userRole).toBe("student")
    })
  })

  it("should return null when both endpoints fail", async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockRejectedValueOnce(new Error("Unauthorized"))

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.userRole).toBeNull()
    })
  })

  it("should call onRoleDetected callback when role is detected", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: {} })

    const onRoleDetected = vi.fn()
    const { result } = renderHook(() => useUserRole(onRoleDetected))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(onRoleDetected).toHaveBeenCalledWith("admin")
    })
  })

  it("should start with loading true", () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useUserRole())

    expect(result.current.loading).toBe(true)
    expect(result.current.userRole).toBeNull()
  })
})
