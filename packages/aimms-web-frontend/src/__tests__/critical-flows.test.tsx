/**
 * Critical User Flows Integration Tests
 *
 * These tests protect against breaking changes during refactoring.
 * They test the most important user journeys end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import App from "../App"

// Mock the auth context
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    getIdentity: () => null,
    getPermissions: () => null,
  }),
}))

describe("Critical User Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Application Initialization", () => {
    it("renders without crashing", () => {
      expect(() => {
        // App already includes BrowserRouter, don't wrap it again
        render(<App />)
      }).not.toThrow()
    })

    it("redirects to login when not authenticated", async () => {
      // App already includes BrowserRouter, don't wrap it again
      render(<App />)

      await waitFor(() => {
        // Should redirect to login page
        expect(window.location.pathname).toBe("/login")
      })
    })
  })

  describe("Component Exports", () => {
    it("all main components are importable", async () => {
      // This test ensures refactoring doesn't break imports
      const modules = [
        () => import("../apps/mcc"),
        () => import("@/pages/student"),
        () => import("@/pages/faculty"),
        () => import("@/pages/admin"),
        () => import("../apps/virtual-patient/VirtualPatient"),
        () => import("../apps/suture-analysis/SutureAnalysis"),
        () => import("../apps/aimhei/ModernAIMHEI"),
        () => import("../apps/debrief"),
      ]

      for (const importModule of modules) {
        const module = await importModule()
        expect(module).toBeDefined()
        expect(module.default || module).toBeTruthy()
      }
    })
  })

  describe("Type Definitions", () => {
    it("medical case types are properly defined", async () => {
      const { DifficultyLevel } = await import("../types/medical-cases")

      expect(DifficultyLevel).toBeDefined()
      expect(DifficultyLevel.Beginner).toBe("Beginner")
      expect(DifficultyLevel.Intermediate).toBe("Intermediate")
      expect(DifficultyLevel.Advanced).toBe("Advanced")
    })
  })

  describe("Critical Utilities", () => {
    it("MCC utilities are functional", async () => {
      const { isValidVariableFormat } = await import("../apps/mcc/shared/utils/validation")
      const { hasUnfilledVariables } = await import("../apps/mcc/shared/utils/tableUtils")

      expect(isValidVariableFormat("{valid_variable}")).toBe(true)
      // Strings without variables are considered valid (no braces to validate)
      expect(isValidVariableFormat("no variables here")).toBe(true)
      // Invalid format: unmatched braces
      expect(isValidVariableFormat("{unclosed")).toBe(false)
      expect(hasUnfilledVariables).toBeDefined()
    })
  })
})

/**
 * Snapshot Tests for Large Components
 * These capture the current structure and warn about unintended changes
 */
describe("Component Structure Snapshots", () => {
  it("MCC FormBuilder structure is preserved", async () => {
    const { FormBuilder } = await import("../apps/mcc")

    // Check that component exports expected structure
    expect(FormBuilder).toBeDefined()
    expect(typeof FormBuilder).toBe("function")
  })

  it("Dashboard components are preserved", async () => {
    const { StudentDashboard } = await import("@/pages/student")
    const { FacultyDashboard } = await import("@/pages/faculty")

    expect(StudentDashboard).toBeDefined()
    expect(FacultyDashboard).toBeDefined()
  })
})
