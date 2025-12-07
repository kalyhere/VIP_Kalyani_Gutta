/**
 * Unit tests for useDebounce hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "../useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300))

    expect(result.current).toBe("initial")
  })

  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 300 },
    })

    expect(result.current).toBe("initial")

    // Update the value
    rerender({ value: "updated", delay: 300 })

    // Value should not update immediately
    expect(result.current).toBe("initial")

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      vi.advanceTimersByTime(299)
    })

    // Value should still be initial
    expect(result.current).toBe("initial")

    // Fast-forward the remaining 1ms
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Value should now be updated
    expect(result.current).toBe("updated")
  })

  it("should cancel previous timeout when value changes rapidly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "initial" },
    })

    // Rapid updates
    rerender({ value: "update1" })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "update2" })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "update3" })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Only 300ms total has passed, but we've had 3 updates
    // Value should still be initial because each update resets the timer
    expect(result.current).toBe("initial")

    // Fast-forward the full delay from the last update
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Now it should be the last value
    expect(result.current).toBe("update3")
  })

  it("should handle custom delay", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    })

    rerender({ value: "updated", delay: 500 })

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(result.current).toBe("initial")

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe("updated")
  })

  it("should work with different data types", () => {
    // Test with number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      }
    )

    rerenderNumber({ value: 42 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(numberResult.current).toBe(42)

    // Test with object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: { name: "initial" } },
      }
    )

    const newObj = { name: "updated" }
    rerenderObject({ value: newObj })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(objectResult.current).toEqual(newObj)
  })

  it("should handle default delay of 300ms", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "updated" })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("updated")
  })
})
