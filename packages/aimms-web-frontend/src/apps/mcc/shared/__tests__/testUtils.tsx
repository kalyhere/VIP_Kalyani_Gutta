/**
 * Test Utilities for MCC
 * Provides factory functions and test wrappers for Zustand store testing
 */

import React, { ReactNode } from "react"
import { renderHook, RenderHookOptions } from "@testing-library/react"
import { useMCCStore } from "../../stores/mccStore"
import { Case, Section, Table, TableRow, TableCell } from "../types"

// ===== Factory Functions =====

export const createMockCase = (overrides?: Partial<Case>): Case => ({
  id: `case-${Date.now()}`,
  name: "Test Case",
  sections: [],
  lastModified: new Date().toISOString(),
  ...overrides,
})

export const createMockSection = (overrides?: Partial<Section>): Section => ({
  id: `section-${Date.now()}`,
  title: "Test Section",
  tables: [],
  ...overrides,
})

export const createMockTable = (overrides?: Partial<Table>): Table => ({
  id: `table-${Date.now()}`,
  title: "Test Table",
  columns: 2,
  rows: [],
  hasHeader: false,
  ...overrides,
})

export const createMockTableRow = (
  cellCount: number = 2,
  overrides?: Partial<TableRow>,
): TableRow => ({
  id: `row-${Date.now()}`,
  cells: Array.from({ length: cellCount }, (_, i) => createMockTableCell({ id: `cell-${Date.now()}-${i}` }),
  ),
  ...overrides,
})

export const createMockTableCell = (overrides?: Partial<TableCell>): TableCell => ({
  id: `cell-${Date.now()}`,
  content: "",
  isHeader: false,
  isLocked: false,
  ...overrides,
})

// ===== Store Wrapper for Component Tests =====

interface StoreWrapperProps {
  children: ReactNode
  initialState?: Partial<ReturnType<typeof useMCCStore.getState>>
}

/**
 * Wrapper component that provides MCC store context for testing
 */
export const StoreWrapper: React.FC<StoreWrapperProps> = ({ children, initialState }) => {
  // Initialize store with test state
  if (initialState) {
    const currentState = useMCCStore.getState()
    useMCCStore.setState({ ...currentState, ...initialState })
  }

  return <>{children}</>
}

/**
 * Custom render hook with store wrapper
 */
export const renderHookWithStore = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & {
    initialState?: Partial<ReturnType<typeof useMCCStore.getState>>
  }
) => {
  const { initialState, ...renderOptions } = options || {}

  return renderHook(hook, {
    wrapper: ({ children }) => <StoreWrapper initialState={initialState}>{children}</StoreWrapper>,
    ...renderOptions,
  })
}

// ===== Store Reset Helper =====

/**
 * Reset store to initial state between tests
 */
export const resetStore = () => {
  useMCCStore.getState().reset()
}

// ===== Common Test Data =====

export const mockCaseWithSections: Case = createMockCase({
  id: "case-1",
  name: "Complete Test Case",
  sections: [
    createMockSection({
      id: "section-1",
      title: "Patient Demographics",
      tables: [
        createMockTable({
          id: "table-1",
          title: "Basic Information",
          columns: 2,
          rows: [
            createMockTableRow(2, {
              id: "row-1",
              cells: [
                createMockTableCell({ id: "cell-1-1", content: "Name", isHeader: true }),
                createMockTableCell({ id: "cell-1-2", content: "{patient_name}" }),
              ],
            }),
            createMockTableRow(2, {
              id: "row-2",
              cells: [
                createMockTableCell({ id: "cell-2-1", content: "Age", isHeader: true }),
                createMockTableCell({ id: "cell-2-2", content: "{patient_age}" }),
              ],
            }),
          ],
          hasHeader: false,
        }),
      ],
    }),
    createMockSection({
      id: "section-2",
      title: "Medical History",
      tables: [],
    }),
  ],
})

export const mockEmptyCase: Case = createMockCase({
  id: "empty-case",
  name: "Empty Case",
  sections: [],
})

// ===== Mock Functions =====

export const createMockFileInputEvent = (jsonContent: object): Event => {
  const file = new File([JSON.stringify(jsonContent)], "test.json", { type: "application/json" })
  const event = {
    target: {
      files: [file],
      value: "",
    },
  } as unknown as Event
  return event
}

// ===== Async Utilities =====

/**
 * Wait for store update to complete
 */
export const waitForStoreUpdate = async (
  predicate: () => boolean,
  timeout: number = 1000
): Promise<void> => {
  const startTime = Date.now()
  while (!predicate() && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  if (!predicate()) {
    throw new Error("Store update timeout")
  }
}

// ===== Assertion Helpers =====

/**
 * Assert that a case exists in the store
 */
export const expectCaseInStore = (caseId: string): void => {
  const { cases } = useMCCStore.getState()
  const foundCase = cases.find((c) => c.id === caseId)
  if (!foundCase) {
    throw new Error(`Case ${caseId} not found in store`)
  }
}

/**
 * Assert that current case has a section
 */
export const expectSectionInCurrentCase = (sectionId: string): void => {
  const { currentCase } = useMCCStore.getState()
  if (!currentCase) {
    throw new Error("No current case in store")
  }
  const foundSection = currentCase.sections.find((s) => s.id === sectionId)
  if (!foundSection) {
    throw new Error(`Section ${sectionId} not found in current case`)
  }
}

/**
 * Assert that a section has a table
 */
export const expectTableInSection = (sectionId: string, tableId: string): void => {
  const { currentCase } = useMCCStore.getState()
  if (!currentCase) {
    throw new Error("No current case in store")
  }
  const section = currentCase.sections.find((s) => s.id === sectionId)
  if (!section) {
    throw new Error(`Section ${sectionId} not found`)
  }
  const foundTable = section.tables.find((t) => t.id === tableId)
  if (!foundTable) {
    throw new Error(`Table ${tableId} not found in section ${sectionId}`)
  }
}
