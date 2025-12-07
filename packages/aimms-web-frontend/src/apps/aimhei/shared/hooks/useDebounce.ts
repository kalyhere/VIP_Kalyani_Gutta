/**
 * useDebounce Hook
 * Debounces a value to reduce frequent updates
 */

import { useState, useEffect } from "react"

/**
 * Custom hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("")
 * const debouncedSearch = useDebounce(searchTerm, 500)
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   if (debouncedSearch) {
 *     performSearch(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
