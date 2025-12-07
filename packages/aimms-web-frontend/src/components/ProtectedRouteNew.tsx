import React, { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { Box, CircularProgress } from "@mui/material"
import { useAuthStore } from "../stores/authStore"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated || !identity) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(identity.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
