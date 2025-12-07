/**
 * Performance Optimization Helper Utilities
 * Common patterns and helpers for React performance optimization
 */

/**
 * Shallow comparison function for React.memo
 * Use this for components with simple props
 */
export function shallowEqual<T extends Record<string, unknown>>(obj1: T, obj2: T): boolean {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false
    }
  }

  return true
}

/**
 * Deep comparison function for complex props
 * Use sparingly as deep comparisons can be expensive
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false

  const keys1 = Object.keys(obj1 as object)
  const keys2 = Object.keys(obj2 as object)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (
      !deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])
    ) {
      return false
    }
  }

  return true
}

/**
 * Debounce function for expensive operations
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for frequent events
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastResult: ReturnType<T>

  return function executedFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      inThrottle = true
      lastResult = func(...args) as ReturnType<T>

      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoization helper for expensive computations
 * Creates a cache for function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T
}
