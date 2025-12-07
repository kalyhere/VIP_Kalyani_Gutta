/**
 * useUserRole Hook
 *
 * Fetches and manages user role detection using Zustand store
 */

import { useEffect } from "react"
import { api } from "@/services/api"
import { useAIMHEIStore, type UserRole } from "../../stores/aimheiStore"

export type { UserRole }

export interface UseUserRoleReturn {
  userRole: UserRole
  loading: boolean
}

/**
 * Hook for fetching and managing user role
 */
export const useUserRole = (onRoleDetected?: (role: UserRole) => void): UseUserRoleReturn => {
  const userRole = useAIMHEIStore((state) => state.userRole)
  const loading = useAIMHEIStore((state) => state.userRoleLoading)
  const setUserRole = useAIMHEIStore((state) => state.setUserRole)
  const setUserRoleLoading = useAIMHEIStore((state) => state.setUserRoleLoading)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Try to get user identity - first try admin/faculty endpoint, then student
        let role: UserRole = null

        try {
          await api.get("/api/users/faculty/stats")
          role = "admin" // Faculty stats endpoint is used by admin users
        } catch (facultyError) {
          try {
            await api.get("/api/students/stats")
            role = "student"
          } catch (studentError) {
            console.warn("Unable to determine user role from available endpoints")
            setUserRoleLoading(false)
            return
          }
        }

        setUserRole(role)

        if (onRoleDetected) {
          onRoleDetected(role)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setUserRoleLoading(false)
      }
    }

    // Only fetch if not already loaded
    if (loading && userRole === null) {
      fetchUserRole()
    }
  }, [loading, userRole, setUserRole, setUserRoleLoading, onRoleDetected])

  return { userRole, loading }
}
