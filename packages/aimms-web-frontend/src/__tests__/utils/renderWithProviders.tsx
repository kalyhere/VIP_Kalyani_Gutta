/**
 * Test Render Utilities
 * Custom render function that wraps components with necessary providers
 */

import React, { ReactElement } from "react"
import { render, RenderOptions, RenderResult } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { User } from "@/types/auth"
import { mockStudentUser, mockFacultyUser, mockAdminUser } from "./testFixtures"

// ============================================================================
// TYPES
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Initial route for BrowserRouter
   * @default "/"
   */
  initialRoute?: string

  /**
   * Mock authenticated user
   * If provided, localStorage will be set with user data
   */
  mockUser?: User

  /**
   * Mock auth token
   * If provided, localStorage will be set with token
   */
  mockAuthToken?: string

  /**
   * Whether to include BrowserRouter
   * @default true
   */
  withRouter?: boolean
}

// ============================================================================
// ALL PROVIDERS WRAPPER
// ============================================================================

interface AllProvidersProps {
  children: React.ReactNode
  initialRoute?: string
  withRouter?: boolean
}

function AllProviders({ children, initialRoute = "/", withRouter = true }: AllProvidersProps) {
  // Set initial route for tests
  if (withRouter && initialRoute !== "/") {
    window.history.pushState({}, "Test page", initialRoute)
  }

  // Wrap with router if needed
  if (!withRouter) return <>{children}</>
  return <BrowserRouter>{children}</BrowserRouter>
}

// ============================================================================
// CUSTOM RENDER FUNCTION
// ============================================================================

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/__tests__/utils/renderWithProviders'
 * import { mockStudentUser } from '@/__tests__/utils/testFixtures'
 *
 * // Render with authenticated user
 * renderWithProviders(<MyComponent />, {
 *   mockUser: mockStudentUser,
 *   mockAuthToken: 'test-token',
 * })
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialRoute = "/",
    mockUser,
    mockAuthToken,
    withRouter = true,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  // Setup localStorage mocks if user/token provided
  if (mockUser) {
    localStorage.setItem("user", JSON.stringify(mockUser))
    localStorage.setItem("auth_token", mockAuthToken || "test-token")
    // Set Zustand store state
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    })
  } else if (mockAuthToken) {
    localStorage.setItem("auth_token", mockAuthToken)
  }

  // Create wrapper component
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders initialRoute={initialRoute} withRouter={withRouter}>
      {children}
    </AllProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ============================================================================
// AUTHENTICATED RENDER HELPERS
// ============================================================================

/**
 * Render component as authenticated student
 */
export function renderAsStudent(ui: ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    mockUser: mockStudentUser,
    mockAuthToken: "student-token",
    ...options,
  })
}

/**
 * Render component as authenticated faculty
 */
export function renderAsFaculty(ui: ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    mockUser: mockFacultyUser,
    mockAuthToken: "faculty-token",
    ...options,
  })
}

/**
 * Render component as authenticated admin
 */
export function renderAsAdmin(ui: ReactElement, options: CustomRenderOptions = {}) {
  return renderWithProviders(ui, {
    mockUser: mockAdminUser,
    mockAuthToken: "admin-token",
    ...options,
  })
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react"
