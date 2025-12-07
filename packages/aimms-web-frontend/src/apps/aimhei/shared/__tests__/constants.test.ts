import { describe, it, expect } from "vitest"
import { typography, spacing, fadeVariants } from "../constants"

describe("constants", () => {
  describe("typography", () => {
    it("should have h1 style defined", () => {
      expect(typography.h1).toEqual({
        fontSize: "2rem",
        fontWeight: 700,
        lineHeight: 1.25,
      })
    })

    it("should have h2 style defined", () => {
      expect(typography.h2).toEqual({
        fontSize: "1.5rem",
        fontWeight: 600,
        lineHeight: 1.3,
      })
    })

    it("should have h3 style defined", () => {
      expect(typography.h3).toEqual({
        fontSize: "1.25rem",
        fontWeight: 600,
        lineHeight: 1.35,
      })
    })

    it("should have body1 style defined", () => {
      expect(typography.body1).toEqual({
        fontSize: "0.875rem",
        fontWeight: 400,
        lineHeight: 1.5,
      })
    })

    it("should have body2 style defined", () => {
      expect(typography.body2).toEqual({
        fontSize: "0.75rem",
        fontWeight: 400,
        lineHeight: 1.4,
      })
    })

    it("should have caption style defined", () => {
      expect(typography.caption).toEqual({
        fontSize: "0.6875rem",
        fontWeight: 500,
        lineHeight: 1.4,
      })
    })
  })

  describe("spacing", () => {
    it("should have all spacing values defined", () => {
      expect(spacing).toEqual({
        xs: 0.5,
        sm: 1,
        md: 1.5,
        lg: 2,
        xl: 3,
        xxl: 4,
      })
    })

    it("should have xs spacing", () => {
      expect(spacing.xs).toBe(0.5)
    })

    it("should have sm spacing", () => {
      expect(spacing.sm).toBe(1)
    })

    it("should have md spacing", () => {
      expect(spacing.md).toBe(1.5)
    })

    it("should have lg spacing", () => {
      expect(spacing.lg).toBe(2)
    })

    it("should have xl spacing", () => {
      expect(spacing.xl).toBe(3)
    })

    it("should have xxl spacing", () => {
      expect(spacing.xxl).toBe(4)
    })
  })

  describe("fadeVariants", () => {
    it("should have hidden state defined", () => {
      expect(fadeVariants.hidden).toEqual({
        opacity: 0,
        y: 8,
      })
    })

    it("should have visible state defined with transition", () => {
      expect(fadeVariants.visible).toEqual({
        opacity: 1,
        y: 0,
        transition: { duration: 0.2, ease: "easeOut" },
      })
    })

    it("should have exit state defined with transition", () => {
      expect(fadeVariants.exit).toEqual({
        opacity: 0,
        y: -8,
        transition: { duration: 0.15, ease: "easeIn" },
      })
    })

    it("should have all three animation states", () => {
      expect(Object.keys(fadeVariants)).toEqual(
        expect.arrayContaining(["hidden", "visible", "exit"])
      )
    })
  })
})
