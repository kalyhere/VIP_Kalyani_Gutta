/**
 * Auth Store (Zustand)
 * Replaces AuthContext for state management
 */

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { User, UserIdentity } from "@/types/auth"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  getIdentity: () => UserIdentity | null
  getPermissions: () => string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: true,

        // Actions
        login: async (username: string, password: string) => {
          set({ isLoading: true })
          try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                username,
                password,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.detail || "Login failed")
            }

            const data = await response.json()

            // Store token
            localStorage.setItem("auth_token", data.access_token)

            // Verify token and get user data
            const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            })

            if (!verifyResponse.ok) {
              throw new Error("Failed to verify token and get user data")
            }

            const userData = await verifyResponse.json()

            // Store user data
            const userInfo: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
            }
            localStorage.setItem("user", JSON.stringify(userInfo))

            set({
              user: userInfo,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        logout: async () => {
          localStorage.removeItem("auth_token")
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        },

        checkAuth: async () => {
          const token = localStorage.getItem("auth_token")

          if (!token) {
            set({ isAuthenticated: false, isLoading: false, user: null })
            return false
          }

          set({ isLoading: true })

          try {
            const response = await fetch(`${API_URL}/api/auth/verify`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (!response.ok) {
              throw new Error("Token verification failed")
            }

            const data = await response.json()
            const userInfo: User = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role,
            }
            localStorage.setItem("user", JSON.stringify(userInfo))

            set({
              user: userInfo,
              isAuthenticated: true,
              isLoading: false,
            })

            return true
          } catch (error) {
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user")
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
            return false
          }
        },

        getIdentity: () => {
          const { user } = get()
          if (!user) return null
          return {
            ...user,
            fullName: user.name || user.email,
          }
        },

        getPermissions: () => {
          const { user } = get()
          return user?.role || null
        },

        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
          })
        },

        setLoading: (loading) => {
          set({ isLoading: loading })
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
)
