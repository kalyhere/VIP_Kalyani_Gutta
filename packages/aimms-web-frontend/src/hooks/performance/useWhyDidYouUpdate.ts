import { useEffect, useRef } from "react"

/**
 * Development hook to debug why a component re-rendered
 * Logs which props changed between renders
 *
 * @param name - Name of the component for logging
 * @param props - Props object to track
 * @example
 * function MyComponent(props) {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   return <div>...</div>;
 * }
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, unknown>): void {
  const previousProps = useRef<Record<string, unknown>>()

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: Record<string, { from: unknown; to: unknown }> = {}

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          }
        }
      })

      if (Object.keys(changedProps).length > 0) {
        console.log("[Why Did You Update]", name, changedProps)
      }
    }

    previousProps.current = props
  })
}
