import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useCriteriaUpload } from "../useCriteriaUpload"

// Mock File.text() since JSDOM doesn't fully support it
global.File.prototype.text = vi.fn(function (this: File) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsText(this)
  })
})

describe("useCriteriaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCriteriaUpload())

    expect(result.current.useCustomCriteria).toBe(false)
    expect(result.current.criteriaFile).toBeNull()
    expect(result.current.isCriteriaDragOver).toBe(false)
    expect(result.current.criteriaFileInputRef.current).toBeNull()
  })

  it("should toggle useCustomCriteria", () => {
    const { result } = renderHook(() => useCriteriaUpload())

    act(() => {
      result.current.setUseCustomCriteria(true)
    })

    expect(result.current.useCustomCriteria).toBe(true)
  })

  it("should validate JSON file successfully", async () => {
    const onValidationSuccess = vi.fn()
    const validCriteria = {
      "Information Section": {},
      "Skill Section": {},
    }
    const file = new File([JSON.stringify(validCriteria)], "criteria.json", {
      type: "application/json",
    })

    const { result } = renderHook(() => useCriteriaUpload({ onValidationSuccess }))

    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleCriteriaFileChange(event)
    })

    await waitFor(
      () => {
        expect(onValidationSuccess).toHaveBeenCalledWith("Custom criteria loaded: criteria.json")
      },
      { timeout: 3000 },
    )

    expect(result.current.criteriaFile).toBe(file)
  })

  it("should reject non-JSON files", async () => {
    const onValidationError = vi.fn()
    const file = new File(["test"], "test.txt", { type: "text/plain" })

    const { result } = renderHook(() => useCriteriaUpload({ onValidationError }))

    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleCriteriaFileChange(event)
    })

    expect(onValidationError).toHaveBeenCalledWith("Please upload a JSON file")
    expect(result.current.criteriaFile).toBeNull()
  })

  it("should reject invalid JSON structure", async () => {
    const onValidationError = vi.fn()
    const invalidCriteria = { "Invalid Section": {} }
    const file = new File([JSON.stringify(invalidCriteria)], "criteria.json", {
      type: "application/json",
    })

    const { result } = renderHook(() => useCriteriaUpload({ onValidationError }))

    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      await result.current.handleCriteriaFileChange(event)
    })

    await waitFor(
      () => {
        expect(onValidationError).toHaveBeenCalledWith(
          "Invalid criteria file: missing 'Information Section'"
        )
      },
      { timeout: 3000 },
    )

    expect(result.current.criteriaFile).toBeNull()
  })

  it("should handle drag over", () => {
    const { result } = renderHook(() => useCriteriaUpload())

    const event = {
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent

    act(() => {
      result.current.handleCriteriaDragOver(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(result.current.isCriteriaDragOver).toBe(true)
  })

  it("should handle drag leave", () => {
    const { result } = renderHook(() => useCriteriaUpload())

    const event = {
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent

    act(() => {
      result.current.handleCriteriaDragLeave(event)
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(result.current.isCriteriaDragOver).toBe(false)
  })

  it("should remove criteria file", () => {
    const { result } = renderHook(() => useCriteriaUpload())

    act(() => {
      result.current.removeCriteriaFile()
    })

    expect(result.current.criteriaFile).toBeNull()
  })
})
