import { Navigate } from "react-router-dom"
import { useAuthStore } from "../stores/authStore"

interface ReportRouteProtectionProps {
  children: React.ReactNode
}

export const ReportRouteProtection: React.FC<ReportRouteProtectionProps> = ({ children }) => {
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null

  // Show loading state while identity is being fetched
  if (isLoading) {
    return null
  }

  // If there's no identity, redirect to login
  if (!identity) {
    return <Navigate to="/login" replace />
  }

  // All authenticated users can access reports
  return <>{children}</>
}
