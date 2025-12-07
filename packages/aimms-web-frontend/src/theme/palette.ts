/**
 * MUI Theme Palette Configuration
 *
 * Converts UA brand colors to Material-UI semantic palette format.
 * Maintains @lib/colors as single source of truth for color values.
 */

import { PaletteOptions } from '@mui/material/styles'
import { uaColors } from '@lib/colors'

export const palette: PaletteOptions = {
  primary: {
    main: uaColors.arizonaRed,      // #AB0520
    dark: uaColors.chili,            // #8B0015
    light: uaColors.arizonaBlue,     // #0C234B (accent)
    contrastText: '#ffffff',
  },
  secondary: {
    main: uaColors.azurite,          // #1E5288
    dark: uaColors.midnight,         // #001C48
    light: uaColors.oasis,           // #378DBD
    contrastText: '#ffffff',
  },
  background: {
    default: uaColors.slate[50],     // #F8FAFC
    paper: uaColors.white,           // #FFFFFF
  },
  text: {
    primary: uaColors.midnight,      // #001C48
    secondary: uaColors.slate[600],  // #475569
    disabled: uaColors.slate[400],   // #94A3B8
  },
  divider: uaColors.slate[200],      // #E2E8F0
  action: {
    selected: 'rgba(30, 82, 136, 0.08)',      // Light blue (secondary.main with 8% opacity)
    hover: 'rgba(30, 82, 136, 0.04)',         // Very light blue for hover
    selectedOpacity: 0.08,
    hoverOpacity: 0.04,
  },
  error: {
    main: uaColors.arizonaRed,       // #AB0520
    dark: uaColors.chili,            // #8B0015
    light: '#D32F2F',
    contrastText: '#ffffff',
  },
  warning: {
    main: uaColors.warm,             // #F57C00
    dark: '#E65100',
    light: '#FF9800',
    contrastText: '#ffffff',
  },
  success: {
    main: uaColors.sage,             // #1B5E20
    dark: '#0D4715',
    light: '#2E7D32',
    contrastText: '#ffffff',
  },
  info: {
    main: uaColors.azurite,          // #1E5288
    dark: uaColors.arizonaBlue,      // #0C234B
    light: uaColors.oasis,           // #378DBD
    contrastText: '#ffffff',
  },
}

// Type augmentation for custom palette properties
declare module '@mui/material/styles' {
  interface Palette {
    suture: {
      good: string
      loose: string
      tight: string
    }
  }
  interface PaletteOptions {
    suture?: {
      good: string
      loose: string
      tight: string
    }
  }
}

// Extend palette with custom domain-specific colors
export const customPalette = {
  suture: uaColors.suture,
}
