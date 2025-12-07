import React, { Profiler, ProfilerOnRenderCallback, ReactNode } from "react"

interface PerformanceProfilerProps {
  id: string
  children: ReactNode
  logToConsole?: boolean
  onRender?: ProfilerOnRenderCallback
}

/**
 * React Profiler wrapper component for monitoring component performance
 * Can be used in both development and production
 *
 * @example
 * <PerformanceProfiler id="Dashboard" logToConsole={true}>
 *   <Dashboard />
 * </PerformanceProfiler>
 */
export function PerformanceProfiler({
  id,
  children,
  logToConsole = true,
  onRender,
}: PerformanceProfilerProps): JSX.Element {
  const handleRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    // Log to console if enabled
    if (logToConsole && process.env.NODE_ENV === "development") {
      console.log(`[Profiler] ${profilerId}`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        startTime: `${startTime.toFixed(2)}ms`,
        commitTime: `${commitTime.toFixed(2)}ms`,
        interactions: interactions.size,
      })
    }

    // Call custom onRender callback if provided
    if (onRender) {
      onRender(profilerId, phase, actualDuration, baseDuration, startTime, commitTime, interactions)
    }
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  )
}
