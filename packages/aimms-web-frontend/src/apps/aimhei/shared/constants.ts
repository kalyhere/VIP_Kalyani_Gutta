/**
 * AIMHEI Constants
 * Shared constants for typography, spacing, and animations
 */

// Typography system
export const typography = {
  h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 },
  h2: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.35 },
  body1: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: "0.6875rem", fontWeight: 500, lineHeight: 1.4 },
}

// Spacing system
export const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
  xxl: 4,
}

// Animation variants - simplified and refined
export const fadeVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } },
}
