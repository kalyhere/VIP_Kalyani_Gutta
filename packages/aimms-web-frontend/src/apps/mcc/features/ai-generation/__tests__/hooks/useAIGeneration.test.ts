import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useAIGeneration } from "../../hooks/useAIGeneration"
import { Case } from "../../../shared/types"

// Mock modules
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Generated content" } }],
        }),
      },
    },
  })),
}))

vi.mock("../../utils/validation", () => ({
  isValidVariableFormat: () => true,
}))

vi.mock("../../constants/prompts", () => ({
  SYSTEM_PROMPTS: { MEDICAL_CASE_GENERATOR: "Test system prompt" },
  USER_PROMPTS: {
    GENERATE: "Generate",
    REGENERATE: "Regenerate",
    REGENERATE_CONTEXT: "Context",
  },
}))

vi.mock("import.meta.env", () => ({
  VITE_OPENAI_API_KEY: "test-api-key",
}))

describe("useAIGeneration", () => {
  // Mock case data
  const mockCase: Case = {
    id: "case-1",
    name: "Test Case",
    lastModified: new Date().toISOString(),
    sections: [
      {
        id: "section-1",
        title: "Patient Information",
        tables: [
          {
            id: "table-1",
            title: "Demographics",
            hasHeader: true,
            columns: 2,
            rows: [
              {
                id: "row-1",
                cells: [
                  { id: "cell-1", content: "Name", isHeader: true },
                  { id: "cell-2", content: "Age", isHeader: true },
                ],
              },
              {
                id: "row-2",
                cells: [
                  { id: "cell-3", content: "John Doe", isHeader: false, isAIGenerated: false },
                  { id: "cell-4", content: "{patient_age}", isHeader: false, isAIGenerated: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  }

  // Mock state setters
  const setCurrentCase = vi.fn()
  const setGeneratedFields = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with isGenerating set to false", () => {
    const { result } = renderHook(() =>
      useAIGeneration({
      currentCase: mockCase,
      setCurrentCase,
      setGeneratedFields,
      temperature: 0.7,
    })
    )

    expect(result.current.isGenerating).toBe(false)
    expect(typeof result.current.generateFieldContent).toBe("function")
    expect(typeof result.current.regenerateField).toBe("function")
    expect(typeof result.current.regenerateTable).toBe("function")
    expect(typeof result.current.regenerateForm).toBe("function")
  })
})
