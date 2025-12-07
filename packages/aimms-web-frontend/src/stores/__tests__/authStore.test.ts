/**
 * Auth Store Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useAuthStore } from "../authStore"
import type { User } from "@/types/auth"

// Mock fetch
global.fetch = vi.fn()

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  role: "admin",
}

describe("authStore", () => {
  let mockFetch: any

  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })

    // Clear localStorage
    localStorage.clear()

    // Reset fetch mock
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial State", () => {
    it("should have null user initially", () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

  describe("login", () => {
    it("should successfully log in a user", async () => {
      // Mock successful login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "test-token" }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const { login } = useAuthStore.getState()
      await login("test@example.com", "password")

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(localStorage.getItem("auth_token")).toBe("test-token")
    })

    it("should handle login failure", async () => {
      // Mock failed login response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Invalid credentials" }),
      })

      const { login } = useAuthStore.getState()

      await expect(login("test@example.com", "wrong-password")).rejects.toThrow(
        "Invalid credentials"
      )

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it("should call /auth/login and /auth/verify endpoints", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "test-token" }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const { login } = useAuthStore.getState()
      await login("test@example.com", "password")

      expect(fetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
      )

      expect(fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("/auth/verify"),
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
          },
        })
      )
    })
  })

  describe("logout", () => {
    it("should clear user state and remove token", async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      })
      localStorage.setItem("auth_token", "test-token")

      const { logout } = useAuthStore.getState()
      await logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(localStorage.getItem("auth_token")).toBeNull()
    })
  })

  describe("checkAuth", () => {
    it("should return false when no token exists", async () => {
      const { checkAuth } = useAuthStore.getState()
      const result = await checkAuth()

      expect(result).toBe(false)
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it("should authenticate user when valid token exists", async () => {
      localStorage.setItem("auth_token", "valid-token")

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const { checkAuth } = useAuthStore.getState()
      const result = await checkAuth()

      expect(result).toBe(true)
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it("should clear invalid token and return false", async () => {
      localStorage.setItem("auth_token", "invalid-token")

      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const { checkAuth } = useAuthStore.getState()
      const result = await checkAuth()

      expect(result).toBe(false)
      expect(localStorage.getItem("auth_token")).toBeNull()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("getIdentity", () => {
    it("should return null when no user", () => {
      const { getIdentity } = useAuthStore.getState()
      const identity = getIdentity()

      expect(identity).toBeNull()
    })

    it("should return user with fullName when user exists", () => {
      useAuthStore.setState({ user: mockUser })

      const { getIdentity } = useAuthStore.getState()
      const identity = getIdentity()

      expect(identity).toEqual({
        ...mockUser,
        fullName: "Test User",
      })
    })

    it("should use email as fullName when name is null", () => {
      const userWithoutName = { ...mockUser, name: null }
      useAuthStore.setState({ user: userWithoutName })

      const { getIdentity } = useAuthStore.getState()
      const identity = getIdentity()

      expect(identity?.fullName).toBe("test@example.com")
    })
  })

  describe("getPermissions", () => {
    it("should return null when no user", () => {
      const { getPermissions } = useAuthStore.getState()
      const permissions = getPermissions()

      expect(permissions).toBeNull()
    })

    it("should return user role when user exists", () => {
      useAuthStore.setState({ user: mockUser })

      const { getPermissions } = useAuthStore.getState()
      const permissions = getPermissions()

      expect(permissions).toBe("admin")
    })
  })

  describe("setUser", () => {
    it("should update user and authentication state", () => {
      const { setUser } = useAuthStore.getState()
      setUser(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it("should clear authentication when setting null user", () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })

      const { setUser } = useAuthStore.getState()
      setUser(null)

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("setLoading", () => {
    it("should update loading state", () => {
      const { setLoading } = useAuthStore.getState()
      setLoading(true)

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(true)

      setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe("Persist Middleware", () => {
    it("should persist user and isAuthenticated to localStorage", () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      })

      // Check that data is persisted
      const storedData = localStorage.getItem("auth-storage")
      expect(storedData).toBeTruthy()

      const parsed = JSON.parse(storedData!)
      expect(parsed.state.user).toEqual(mockUser)
      expect(parsed.state.isAuthenticated).toBe(true)
    })

    it("should not persist isLoading state", () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
      })

      const storedData = localStorage.getItem("auth-storage")
      const parsed = JSON.parse(storedData!)

      expect(parsed.state.isLoading).toBeUndefined()
    })
  })
})
