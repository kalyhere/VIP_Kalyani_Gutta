import React, { useEffect, Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Box, CircularProgress, GlobalStyles } from "@mui/material"
import { useAuthStore } from "./stores/authStore"
import { NotificationDisplay } from "./components/NotificationDisplay"
import { CustomLoginPage } from "./components/CustomLoginPage"
import { ProtectedRoute } from "./components/ProtectedRouteNew"
import { CustomLayout } from "./components/CustomLayout"
import { LoadingFallback } from "./components/LoadingFallback"
import { LazyLoadErrorBoundary } from "./components/LazyLoadErrorBoundary"

// Eager load apps to avoid loading flash in admin panel
import { FormBuilder } from "./apps/mcc"
import { ModernAIMHEI } from "./apps/aimhei"
import { SutureAnalysis } from "./apps/suture-analysis"
import { VirtualPatient } from "./apps/virtual-patient"
import { Debrief } from "./apps/debrief"
const StudentDashboard = lazy(() => import("./pages/student").then((m) => ({ default: m.StudentDashboard })),
)
const FacultyDashboard = lazy(() => import("./pages/faculty").then((m) => ({ default: m.FacultyDashboard })),
)
const EnhancedAdminDashboard = lazy(() => import("./pages/admin").then((m) => ({ default: m.EnhancedAdminDashboard })),
)
const ClassManagementPage = lazy(() => import("./pages/admin/pages").then((m) => ({ default: m.ClassManagementPage })),
)
const ReportHistory = lazy(() => import("./features/reports").then((m) => ({ default: m.ReportHistory })),
)
const ReportDetailWrapper = lazy(() => import("./components/ReportDetailWrapper").then((m) => ({ default: m.ReportDetailWrapper })),
)
const ReportRouteProtection = lazy(() => import("./components/ReportRouteProtection").then((m) => ({ default: m.ReportRouteProtection })),
)
const SharedReportView = lazy(() => import("./pages/shared").then((m) => ({ default: m.SharedReportView })),
)
const InviteUsers = lazy(() => import("./pages/admin/pages").then((m) => ({ default: m.InviteUsers })),
)
const ManageUsers = lazy(() => import("./pages/admin/pages").then((m) => ({ default: m.ManageUsers })),
)
const ManageVirtualPatientCases = lazy(() => import("./pages/admin/pages").then((m) => ({ default: m.ManageVirtualPatientCases })),
)
const Register = lazy(() => import("./pages/Register/Register").then((m) => ({ default: m.Register })),
)

// Component to handle root route redirection
const RootRedirect = () => {
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null

  // Wait for authentication to complete
  if (isLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  // If no identity after loading is complete, redirect to login
  if (!identity || !user) {
    return <Navigate to="/login" replace />
  }

  // Check if user data is properly loaded (not just empty object)
  if (!identity.role || identity.role === undefined) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  // Role-based routing
  if (identity.role === "faculty") {
    return <Navigate to="/faculty-dashboard" replace />
  }

  if (identity.role === "student") {
    return <Navigate to="/student-dashboard" replace />
  }

  if (identity.role === "admin") {
    return <Navigate to="/admin-dashboard" replace />
  }

  // Default fallback for unknown roles
  console.warn("RootRedirect: No specific route matched for identity:", identity)
  return <Navigate to="/login" replace />
}

// App routes component that needs access to auth store
const AppRoutes = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Login route */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <CustomLoginPage />}
          />

          {/* Public shared report route (no auth required) */}
          <Route path="/shared-report/:token" element={<SharedReportView />} />

          {/* Public registration routes (no auth required) */}
          <Route path="/register/student" element={<Register role="student" />} />
          <Route path="/register/faculty" element={<Register role="faculty" />} />
          <Route path="/register/admin" element={<Register role="admin" />} />

          {/* Protected routes with layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <CustomLayout>
                  <Routes>
                    {/* Root redirect */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Dashboard routes */}
                    <Route
                      path="/faculty-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                          <FacultyDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["student", "admin"]}>
                          <StudentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <EnhancedAdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* App routes */}
                    <Route
                      path="/aimms-web"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <ClassManagementPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/invite-users"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                          <InviteUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/manage-users"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <ManageUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/virtual-patient-cases"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ManageVirtualPatientCases />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/report-history"
                      element={
                        <ProtectedRoute allowedRoles={["student", "faculty", "admin"]}>
                          <ReportHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/:reportId"
                      element={
                        <ReportRouteProtection>
                          <ReportDetailWrapper />
                        </ReportRouteProtection>
                      }
                    />
                    <Route
                      path="/virtual-patient"
                      element={
                        <ProtectedRoute allowedRoles={["student", "faculty", "admin"]}>
                          <VirtualPatient />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mcc"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <FormBuilder />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/aimhei"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <ModernAIMHEI />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/suture"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <SutureAnalysis />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/debrief"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Debrief />
                        </ProtectedRoute>
                      }
                    />

                    {/* Unauthorized route */}
                    <Route
                      path="/unauthorized"
                      element={
                        <Box sx={{ p: 4, textAlign: "center" }}>
                          <h2>Access Denied</h2>
                          <p>You don't have permission to access this resource.</p>
                        </Box>
                      }
                    />

                    {/* 404 route */}
                    <Route
                      path="*"
                      element={
                        <Box sx={{ p: 4, textAlign: "center" }}>
                          <h2>Page Not Found</h2>
                          <p>The page you're looking for doesn't exist.</p>
                        </Box>
                      }
                    />
                  </Routes>
                </CustomLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </LazyLoadErrorBoundary>
  )
}

const printStyles = {
  "@media print": {
    '.MuiAppBar-root, .MuiDrawer-root, .custom-sidebar, .page-header, nav[role="navigation"], aside, nav':
      {
        display: "none !important",
      },
    'main, [role="main"]': {
      marginLeft: "0 !important",
      marginTop: "0 !important",
      paddingTop: "0 !important",
      width: "100% !important",
      maxWidth: "100% !important",
    },
    body: {
      margin: "0 !important",
      padding: "0 !important",
    },
    "button, .MuiIconButton-root, .MuiFab-root, .report-action-bar": {
      display: "none !important",
    },
    ".MuiTableSortLabel-root": {
      display: "inline-flex !important",
    },
    ".MuiChip-root": {
      display: "none !important",
    },
    '.MuiTextField-root, .MuiOutlinedInput-root, input[type="search"], input[type="text"]': {
      display: "none !important",
    },
    ".MuiPaper-root, .MuiCard-root": {
      boxShadow: "none !important",
      border: "1px solid #e0e0e0 !important",
    },
    table: {
      pageBreakInside: "auto !important",
    },
    tr: {
      pageBreakInside: "avoid !important",
      pageBreakAfter: "auto !important",
    },
    thead: {
      display: "table-header-group !important",
    },
    ".MuiCollapse-root, .MuiCollapse-entered, .MuiCollapse-wrapper": {
      height: "auto !important",
      overflow: "visible !important",
    },
    ".MuiAccordionDetails-root": {
      display: "block !important",
    },
    ".MuiContainer-root": {
      maxWidth: "100% !important",
      paddingLeft: "8px !important",
      paddingRight: "8px !important",
    },
    ".MuiTableContainer-root": {
      maxHeight: "none !important",
      overflow: "visible !important",
    },
    ".MuiPaper-root": {
      maxWidth: "100% !important",
    },
    "*": {
      overflow: "visible !important",
    },
  },
}

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <GlobalStyles styles={printStyles} />
      <NotificationDisplay />
      <AppRoutes />
    </BrowserRouter>
  )
}
