/**
 * MUI Theme Typography Configuration
 *
 * Defines semantic typography scale for consistent text styling.
 * Aligned with medical education context and MUI defaults.
 */

import { TypographyOptions } from '@mui/material/styles/createTypography'

export const typography: TypographyOptions = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

  // Display headings
  h1: {
    fontSize: '2.5rem',    // 40px - Page titles
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',      // 32px - Section headers
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.5rem',    // 24px - Subsection headers
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.25rem',   // 20px - Card titles
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1rem',      // 16px - List headers
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '0.875rem',  // 14px - Small headers
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.0075em',
  },

  // Body text
  body1: {
    fontSize: '1rem',      // 16px - Primary body text
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',  // 14px - Secondary body text
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.01071em',
  },

  // Specialized text
  subtitle1: {
    fontSize: '1rem',      // 16px - Subtitles
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',  // 14px - Smaller subtitles
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  caption: {
    fontSize: '0.75rem',   // 12px - Captions, labels
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',   // 12px - Overline text
    fontWeight: 500,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },

  // Button text
  button: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none',  // Sentence case, not UPPERCASE
  },
}
