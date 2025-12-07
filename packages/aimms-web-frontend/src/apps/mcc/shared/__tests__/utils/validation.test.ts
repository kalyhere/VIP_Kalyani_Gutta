import { describe, it, expect } from "vitest"
import { isValidVariableFormat, getVariableFormatError } from "@/lib/validation"

describe("validation", () => {
  describe("isValidVariableFormat", () => {
    it("returns true for valid variable format with single variable", () => {
      expect(isValidVariableFormat("{variable_name}")).toBe(true)
    })

    it("returns true for valid variable format with multiple variables", () => {
      expect(isValidVariableFormat("Text with {variable1} and {variable2}")).toBe(true)
    })

    it("returns true for valid variable format with special characters", () => {
      expect(isValidVariableFormat("{variable-name_123}")).toBe(true)
    })

    it("returns true for text without variables", () => {
      expect(isValidVariableFormat("Plain text without variables")).toBe(true)
    })

    it("returns false for unmatched opening brace", () => {
      expect(isValidVariableFormat("{variable")).toBe(false)
    })

    it("returns false for unmatched closing brace", () => {
      expect(isValidVariableFormat("variable}")).toBe(false)
    })

    it("returns false for empty variable name", () => {
      expect(isValidVariableFormat("{}")).toBe(false)
    })

    it("returns false for mismatched number of braces", () => {
      expect(isValidVariableFormat("{var1} and {var2")).toBe(false)
    })

    it("returns true for variable with whitespace that is trimmed", () => {
      expect(isValidVariableFormat("{ variable_name }")).toBe(true)
    })
  })

  describe("getVariableFormatError", () => {
    it("returns null for valid variable format with single variable", () => {
      expect(getVariableFormatError("{variable_name}")).toBeNull()
    })

    it("returns null for valid variable format with multiple variables", () => {
      expect(getVariableFormatError("Text with {variable1} and {variable2}")).toBeNull()
    })

    it("returns null for text without variables", () => {
      expect(getVariableFormatError("Plain text without variables")).toBeNull()
    })

    it("returns error message for unmatched braces", () => {
      expect(getVariableFormatError("{variable")).toBe(
        "Unmatched braces - please ensure all { have matching }"
      )
    })

    it("handles empty variable name", () => {
      expect(getVariableFormatError("{}")).toBeNull()
    })

    it("returns error message for mismatched number of braces", () => {
      expect(getVariableFormatError("{var1} and {var2")).toBe(
        "Unmatched braces - please ensure all { have matching }"
      )
    })

    it("returns null for variable with whitespace that is trimmed", () => {
      expect(getVariableFormatError("{ variable_name }")).toBeNull()
    })

    it("returns error for unmatched closing brace", () => {
      expect(getVariableFormatError("variable}")).toBe(
        "Unmatched braces - please ensure all { have matching }"
      )
    })

    it("handles multiple errors and returns the first one", () => {
      expect(getVariableFormatError("{var1} and {} and {var3")).toBe(
        "Unmatched braces - please ensure all { have matching }"
      )
    })
  })
})
