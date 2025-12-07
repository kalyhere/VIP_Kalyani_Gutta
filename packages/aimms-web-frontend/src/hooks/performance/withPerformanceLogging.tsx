import React, { ComponentType } from "react"

/**
 * Higher-Order Component that logs render performance metrics
 * Useful for profiling component render times in development
 *
 * @param WrappedComponent - Component to profile
 * @param componentName - Name for logging (defaults to component display name)
 * @example
 * const ProfiledComponent = withPerformanceLogging(MyComponent, 'MyComponent');
 */
export function withPerformanceLogging<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName?: string
): ComponentType<P> {
  const displayName =    componentName || WrappedComponent.displayName || WrappedComponent.name || "Component"

  const WithPerformanceLogging: ComponentType<P> = (props: P) => {
    const renderStartTime = performance.now()

    React.useEffect(() => {
      const renderEndTime = performance.now()
      const renderDuration = renderEndTime - renderStartTime

      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${displayName} rendered in ${renderDuration.toFixed(2)}ms`)
      }
    })

    return <WrappedComponent {...props} />
  }

  WithPerformanceLogging.displayName = `withPerformanceLogging(${displayName})`

  return WithPerformanceLogging
}
