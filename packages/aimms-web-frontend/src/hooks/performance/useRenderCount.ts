import { useRef, useEffect } from "react"

/**
 * Development hook to track component render counts
 * Useful for identifying components that re-render unnecessarily
 *
 * @param componentName - Name of the component to track
 * @example
 * function MyComponent() {
 *   useRenderCount('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    if (process.env.NODE_ENV === "development") {
      console.log(`[Render Count] ${componentName}: ${renderCount.current}`)
    }
  })
}
