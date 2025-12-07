/**
 * Interactive Card with Hover Effects
 *
 * Card component with built-in hover transitions and elevation changes.
 * Replaces common pattern of cards with transform and shadow on hover.
 */

import { Card, CardProps, styled, alpha } from '@mui/material'

interface HoverCardProps extends CardProps {
  hoverEffect?: 'lift' | 'border' | 'shadow' | 'none'
}

export const HoverCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'hoverEffect',
})<HoverCardProps>(({ theme, hoverEffect = 'lift' }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  border: `1px solid ${theme.palette.divider}`,

  ...(hoverEffect === 'lift' && {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
  }),

  ...(hoverEffect === 'border' && {
    '&:hover': {
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[2],
    },
  }),

  ...(hoverEffect === 'shadow' && {
    '&:hover': {
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  }),
}))

// Interactive card that grows slightly on hover
export const ScaleCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  transition: 'all 0.25s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[6],
  },
}))

// Card with glow effect on hover
export const GlowCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  '&:hover': {
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
    borderColor: theme.palette.primary.main,
  },
}))
