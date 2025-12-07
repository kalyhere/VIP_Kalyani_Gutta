import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createTheme } from "@mui/material"
import { EVENTS, STATUS, CallBackProps, ACTIONS, Origin } from "react-joyride"
import { useTour } from "../../hooks/useTour"

const theme = createTheme()

type Case = {
  sections: {
    tables: {
      id: string
    }[]
  }[]
}

describe("useTour", () => {
  const mockCases: Case[] = [
    {
      sections: [
        {
          tables: [{ id: "table1" }],
        },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useTour([], theme))

    expect(result.current.runTour).toBe(false)
    expect(result.current.tourConfig.steps.length).toBeGreaterThan(0)
  })

  it("should start tour correctly", () => {
    const { result } = renderHook(() => useTour([], theme))

    act(() => {
      result.current.startTour()
    })

    expect(result.current.runTour).toBe(true)
  })

  it("should handle tour callbacks correctly", () => {
    const { result } = renderHook(() => useTour(mockCases, theme))

    // Start the tour first
    act(() => {
      result.current.startTour()
    })

    const mockCallbackData: CallBackProps = {
      action: ACTIONS.NEXT,
      controlled: false,
      index: 1,
      lifecycle: "complete",
      origin: null,
      size: 5,
      status: STATUS.RUNNING,
      step: result.current.tourConfig.steps[1],
      type: EVENTS.STEP_AFTER,
    }

    act(() => {
      result.current.tourConfig.callback(mockCallbackData)
    })

    // The callback should handle step progression internally
    expect(result.current.runTour).toBe(true)
  })

  it("should update step index when table is created during tour", () => {
    const { result, rerender } = renderHook(({ cases }) => useTour(cases, theme), {
      initialProps: { cases: [] as Case[] },
    })

    // Start tour
    act(() => {
      result.current.startTour()
    })

    // Simulate table creation
    act(() => {
      result.current.setIsTableJustCreated(true)
    })

    // Rerender with updated cases
    rerender({ cases: mockCases })

    // The effect should handle step progression internally
    expect(result.current.isTableJustCreated).toBe(false)
  })

  it("should have correct step configurations", () => {
    const { result } = renderHook(() => useTour([], theme))

    // Test first step configuration
    expect(result.current.tourConfig.steps[0]).toEqual({
      target: ".mcc-header",
      content: expect.any(String),
      placement: "center",
      disableBeacon: true,
    })

    // Test help button step configuration
    expect(result.current.tourConfig.steps[1]).toEqual({
      target: ".help-button",
      content: expect.any(String),
      placement: "bottom",
    })
  })

  it("should handle tour completion", () => {
    const { result } = renderHook(() => useTour(mockCases, theme))

    // Start the tour first
    act(() => {
      result.current.startTour()
    })

    const mockCallbackData: CallBackProps = {
      action: ACTIONS.CLOSE,
      controlled: false,
      index: result.current.tourConfig.steps.length - 1,
      lifecycle: "complete",
      origin: null,
      size: result.current.tourConfig.steps.length,
      status: STATUS.FINISHED,
      step: result.current.tourConfig.steps[result.current.tourConfig.steps.length - 1],
      type: EVENTS.TOUR_END,
    }

    act(() => {
      result.current.tourConfig.callback(mockCallbackData)
    })

    expect(result.current.runTour).toBe(false)
  })
})
