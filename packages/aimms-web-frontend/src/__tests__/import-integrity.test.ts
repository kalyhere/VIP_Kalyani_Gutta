/**
 * Import Integrity Tests
 *
 * These tests ensure that refactoring doesn't break imports.
 * They verify that all critical modules can be imported successfully.
 */

import { describe, it, expect } from "vitest"

describe("Import Integrity - Critical Modules", () => {
  describe("Main Components", () => {
    it("MCC FormBuilder can be imported", async () => {
      const module = await import("../apps/mcc")
      expect(module.FormBuilder).toBeTruthy()
    }, 30000)

    it("VirtualPatient can be imported", async () => {
      const module = await import("../apps/virtual-patient/VirtualPatient")
      expect(module.default || module).toBeTruthy()
    })

    it("Debrief can be imported", async () => {
      const module = await import("../apps/debrief")
      expect(module.Debrief).toBeDefined()
    }, 60000) // Increase timeout as debrief has heavy initialization
  })

  describe("Dashboard Components", () => {
    it("StudentDashboard can be imported", async () => {
      const { StudentDashboard } = await import("@/pages/student")
      expect(StudentDashboard).toBeDefined()
    }, 10000) // Increase timeout for complex component imports

    it("FacultyDashboard can be imported", async () => {
      const { FacultyDashboard } = await import("@/pages/faculty")
      expect(FacultyDashboard).toBeDefined()
    })

    it("EnhancedAdminDashboard can be imported", async () => {
      const { EnhancedAdminDashboard } = await import("@/pages/admin")
      expect(EnhancedAdminDashboard).toBeDefined()
    })
  })

  describe("Type Definitions", () => {
    it("medical-cases types are available", async () => {
      const { DifficultyLevel } = await import("../types/medical-cases")

      expect(DifficultyLevel).toBeDefined()
      expect(DifficultyLevel.Beginner).toBe("Beginner")
      expect(DifficultyLevel.Intermediate).toBe("Intermediate")
      expect(DifficultyLevel.Advanced).toBe("Advanced")
    })

    it("assignment status types are available", async () => {
      const { ASSIGNMENT_STATUS_LABELS } = await import("../constants/assignmentStatus")

      expect(ASSIGNMENT_STATUS_LABELS).toBeDefined()
      expect(ASSIGNMENT_STATUS_LABELS.not_started).toBeDefined()
      expect(ASSIGNMENT_STATUS_LABELS.completed).toBeDefined()
    })
  })

  describe("Critical Utilities", () => {
    it("MCC validation utilities work", async () => {
      const { isValidVariableFormat } = await import("../apps/mcc/shared/utils/validation")

      // Valid variables (any non-empty content in braces)
      expect(isValidVariableFormat("{valid_variable}")).toBe(true)
      expect(isValidVariableFormat("{CamelCase}")).toBe(true)
      expect(isValidVariableFormat("{with space}")).toBe(true)

      // Invalid: empty variables
      expect(isValidVariableFormat("{}")).toBe(false)
      expect(isValidVariableFormat("{   }")).toBe(false)

      // Invalid: unmatched braces
      expect(isValidVariableFormat("{unmatched")).toBe(false)
      expect(isValidVariableFormat("unmatched}")).toBe(false)

      // Strings without variables are valid
      expect(isValidVariableFormat("invalid")).toBe(true)
    })

    it("MCC table utilities work", async () => {
      const { hasUnfilledVariables } = await import("../apps/mcc/shared/utils/tableUtils")

      expect(hasUnfilledVariables).toBeDefined()
      expect(typeof hasUnfilledVariables).toBe("function")
    })
  })

  describe("Service Layer", () => {
    it("admin API client can be imported", async () => {
      const { adminApiClient } = await import("../services/adminApiClient")
      expect(adminApiClient).toBeDefined()
    })

    it("faculty service can be imported", async () => {
      const module = await import("../services/facultyService")
      expect(module.getFacultyStats).toBeDefined()
      expect(module.bulkAssignCase).toBeDefined()
    })
  })

  describe("Store Providers", () => {
    it("authStore exports correctly", async () => {
      const { useAuthStore } = await import("../stores/authStore")
      expect(useAuthStore).toBeDefined()
      expect(typeof useAuthStore).toBe("function")
    })
  })
})

describe("Module Structure Integrity", () => {
  it("MCC module has proper structure", async () => {
    // Check that MCC hooks are available
    const aiGenModule = await import("../apps/mcc/features/ai-generation/hooks/useAIGeneration")
    const cellOpsModule = await import("../apps/mcc/features/table-operations/hooks/useCellOperations")
    const tableOpsModule = await import("../apps/mcc/features/table-operations/hooks/useTableOperations")

    expect(aiGenModule.useAIGeneration).toBeDefined()
    expect(cellOpsModule.useCellOperations).toBeDefined()
    expect(tableOpsModule.useTableOperations).toBeDefined()
  })

  it("MCC components are available", async () => {
    const editableCellModule = await import("../apps/mcc/features/table-operations/components/EditableCell")
    const tableActionsModule = await import("../apps/mcc/features/table-operations/components/TableActions")

    expect(editableCellModule.default).toBeDefined()
    expect(tableActionsModule.default).toBeDefined()
  })

  it("Report components are available", async () => {
    const reportDetailModule = await import("../features/reports/components/ReportDetail")

    expect(reportDetailModule.default || reportDetailModule.ReportDetail).toBeDefined()
  })
})
