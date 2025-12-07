/**
 * Themed Card Primitives
 *
 * Pre-styled Card components with consistent theming.
 * Usage: <StyledCard variant="elevated">...</StyledCard>
 */

import { Card, CardProps, styled } from '@mui/material'

// Base styled card with theme integration
export const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),  // 8px - less rounded
  boxShadow: theme.shadows[2],
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}))

// Elevated card variant (more shadow, more padding)
export const ElevatedCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(1),  // 8px - less rounded
  boxShadow: theme.shadows[4],
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}))

// Outlined card variant (border, no shadow)
export const OutlinedCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),  // 8px - less rounded
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[1],
  },
}))

// Flat card variant (no shadow, minimal styling)
export const FlatCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: 'none',
  backgroundColor: theme.palette.background.default,
}))

// Clickable card (cursor pointer, interactive hover)
export const ClickableCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),  // 8px - less rounded
  boxShadow: theme.shadows[2],
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: 'translateY(-4px)',
    borderColor: theme.palette.primary.main,
  },
  '&:active': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}))
