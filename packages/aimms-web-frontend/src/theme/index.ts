/**
 * Main MUI Theme Export
 *
 * Combines all theme configuration modules into a single theme object.
 * This is the centralized design system for the AIMMS Web application.
 *
 * Usage:
 * import { theme } from '@/theme'
 * <ThemeProvider theme={theme}>...</ThemeProvider>
 */

import { createTheme } from '@mui/material/styles'
import { palette, customPalette } from './palette'
import { typography } from './typography'
import { components } from './components'

// Create base theme with palette and typography
const baseTheme = createTheme({
  palette,
  typography,
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  spacing: 8, // Default 8px base unit
  shape: {
    borderRadius: 4, // Reduced from 8 for sharper, more professional look
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
})

// Create final theme with component overrides
// Component overrides need access to the base theme
export const theme = createTheme(baseTheme, {
  components: components,
  palette: {
    ...baseTheme.palette,
    ...customPalette,
  },
})

// Export individual modules for direct access if needed
export { palette, typography, components }

// Default export is the complete theme
export default theme
