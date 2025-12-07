/**
 * UA Brand Colors - Single Source of Truth
 *
 * University of Arizona official brand colors.
 * Use these throughout the application for consistency.
 *
 * Usage:
 * import { uaColors } from '@lib/colors'
 * sx={{ bgcolor: uaColors.arizonaRed }}
 */

export const uaColors = {
  // Primary Brand Colors
  arizonaRed: "#AB0520",
  arizonaBlue: "#0C234B",

  // Secondary Colors
  midnight: "#001C48",
  azurite: "#1E5288",
  oasis: "#378DBD",
  chili: "#8B0015",

  // Neutral Colors
  white: "#FFFFFF",
  warmGray: "#F4EDE5",
  coolGray: "#E2E9EB",
  neutral: "#757575",

  // Legacy colors (consider deprecating)
  sage: "#1B5E20",
  warm: "#F57C00",

  // Slate scale for backgrounds/borders
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },

  // Suture classification colors
  suture: {
    good: "#0C234B", // Arizona Blue for good sutures
    loose: "#1E5288", // Azurite for loose sutures
    tight: "#AB0520", // Arizona Red for tight sutures
  },

  // Legacy suture color aliases (backwards compatibility)
  goodSuture: "#0C234B",
  looseSuture: "#1E5288",
  tightSuture: "#AB0520",
} as const

export type UAColor = keyof typeof uaColors
export type UAColorValue = (typeof uaColors)[UAColor]

/**
 * Get color with alpha transparency
 * @param color - UA color key
 * @param alpha - Alpha value (0-1)
 */
export function withAlpha(color: string, alpha: number): string {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
