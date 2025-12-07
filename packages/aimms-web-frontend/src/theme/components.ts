/**
 * MUI Theme Component Overrides
 *
 * Global style overrides for Material-UI components.
 * Provides consistent defaults across the application.
 */

import { Components, Theme } from '@mui/material/styles'

export const components: Components<Theme> = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,  // Flat design preference
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(0.5),  // 4px - less rounded
        textTransform: 'none',  // Sentence case, not UPPERCASE
        fontWeight: 500,
        padding: theme.spacing(1, 2),
      }),
      sizeLarge: ({ theme }) => ({
        padding: theme.spacing(1.5, 3),
        fontSize: '1rem',
      }),
      sizeSmall: ({ theme }) => ({
        padding: theme.spacing(0.5, 1.5),
        fontSize: '0.8125rem',
      }),
    },
  },

  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(0.5),  // 4px - sharper corners
        boxShadow: theme.shadows[2],
      }),
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(0.5),  // 4px - sharper corners
      }),
      elevation1: ({ theme }) => ({
        boxShadow: theme.shadows[1],
      }),
      elevation2: ({ theme }) => ({
        boxShadow: theme.shadows[2],
      }),
    },
  },

  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiInputBase-input::placeholder': {
          color: theme.palette.text.secondary,
          opacity: 0.7,
        },
      }),
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(0.5),  // 4px - sharper corners
        transition: 'all 0.25s ease-in-out',
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: 1.5,
          borderColor: `${theme.palette.secondary.main}40`, // 40 = 25% opacity
        },
        '&:hover': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: `${theme.palette.secondary.main}99`, // 99 = 60% opacity
          },
        },
        '&.Mui-focused': {
          transform: 'translateY(-1px)',
          boxShadow: `0 2px 8px ${theme.palette.secondary.main}14, 0 0 0 2px ${theme.palette.secondary.main}1F`,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.secondary.main,
            borderWidth: 2,
          },
        },
        '&.Mui-error': {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.error.main,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.error.dark,
          },
          '&.Mui-focused': {
            boxShadow: `0 2px 8px ${theme.palette.error.main}14, 0 0 0 2px ${theme.palette.error.main}1F`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.error.main,
            },
          },
        },
      }),
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 500,
        fontSize: '0.875rem',
        color: theme.palette.text.secondary,
        transition: 'all 0.25s ease-in-out',
        '&.Mui-focused': {
          color: theme.palette.secondary.main,
          fontWeight: 600,
        },
        '&.Mui-error': {
          color: theme.palette.error.main,
        },
        '&.MuiInputLabel-shrink': {
          backgroundColor: theme.palette.background.default,
          padding: '0 4px',
          borderRadius: theme.spacing(0.5),
        },
      }),
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.75rem',
        marginTop: theme.spacing(0.75),
        '&.Mui-error': {
          color: theme.palette.error.main,
        },
      }),
    },
  },

  MuiSelect: {
    styleOverrides: {
      icon: ({ theme }) => ({
        transition: 'color 0.2s ease-in-out',
        color: `${theme.palette.secondary.main}B3`, // B3 = 70% opacity
      }),
      select: ({ theme }) => ({
        '&:focus': {
          backgroundColor: 'transparent',  // Remove red background on focus
        },
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.secondary.main}14`,  // Light blue background when selected
        },
        '&.Mui-selected:hover': {
          backgroundColor: `${theme.palette.secondary.main}1F`,  // Slightly darker blue on hover
        },
      }),
    },
  },

  MuiAutocomplete: {
    styleOverrides: {
      option: ({ theme }) => ({
        transition: 'background-color 0.2s ease-in-out',
        '&.Mui-focused': {
          backgroundColor: `${theme.palette.secondary.main}14`,
        },
        '&[aria-selected="true"], &.Mui-selected': {
          backgroundColor: `${theme.palette.secondary.main}1F !important`,
          color: theme.palette.text.primary,
          '&.Mui-focused': {
            backgroundColor: `${theme.palette.secondary.main}24 !important`,
          },
        },
      }),
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.875rem',
        transition: 'background-color 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: `${theme.palette.secondary.main}14`, // 14 = 8% opacity
        },
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.secondary.main}1F !important`, // 1F = 12% opacity
          color: theme.palette.secondary.main,
          '&:hover': {
            backgroundColor: `${theme.palette.secondary.main}29 !important`, // 29 = 16% opacity
          },
        },
      }),
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.secondary.main}14`, // 14 = 8% opacity
          '&:hover': {
            backgroundColor: `${theme.palette.secondary.main}1F`, // 1F = 12% opacity
          },
        },
      }),
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.secondary.main}14 !important`, // Light blue (8% opacity) - using hex opacity
          '&:hover': {
            backgroundColor: `${theme.palette.secondary.main}1F !important`, // Medium blue (12% opacity)
          },
        },
        '&:hover': {
          backgroundColor: `${theme.palette.secondary.main}0A !important`, // Very subtle hover (4% opacity)
        },
      }),
    },
  },

  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(1),
        fontWeight: 500,
      }),
    },
  },

  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: theme.shadows[2],
      }),
    },
  },

  MuiTableCell: {
    styleOverrides: {
      head: ({ theme }) => ({
        fontWeight: 600,
        backgroundColor: theme.palette.background.default,
      }),
      root: ({ theme }) => ({
        // Prevent red selection color on table cells
        '&.Mui-selected': {
          backgroundColor: 'inherit !important',
        },
      }),
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 0,  // No rounded corners on tabs
        textTransform: 'none',
        fontWeight: 500,
      }),
    },
  },

  MuiTabs: {
    styleOverrides: {
      indicator: ({ theme }) => ({
        borderRadius: 0,  // Square indicator
      }),
    },
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.palette.grey[800],
        fontSize: '0.75rem',
        borderRadius: theme.spacing(1),
      }),
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.spacing(1),
      }),
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.spacing(1),  // 8px - less rounded
      }),
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.divider,
      }),
    },
  },

  MuiCheckbox: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.secondary.main,  // Use secondary (blue) instead of primary (red)
        '&.Mui-checked': {
          color: theme.palette.secondary.main,
        },
      }),
    },
  },

  MuiRadio: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.secondary.main,  // Use secondary (blue) instead of primary (red)
        '&.Mui-checked': {
          color: theme.palette.secondary.main,
        },
      }),
    },
  },
}
