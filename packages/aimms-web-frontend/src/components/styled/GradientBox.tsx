/**
 * Gradient Background Components
 *
 * Components with UA brand color gradients.
 * Replaces common pattern of linear-gradient backgrounds.
 */

import { Box, BoxProps, styled, alpha } from '@mui/material'

interface GradientBoxProps extends BoxProps {
  variant?: 'primary' | 'secondary' | 'subtle' | 'vibrant'
}

export const GradientBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'variant',
})<GradientBoxProps>(({ theme, variant = 'primary' }) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    },
    secondary: {
      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    },
    subtle: {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
    },
    vibrant: {
      background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.primary.main} 100%)`,
    },
  }

  return {
    ...variants[variant],
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
  }
})

// Text gradient effect
export const GradientText = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontWeight: 700,
}))

// Shimmer loading animation
export const ShimmerBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 25%, ${alpha(theme.palette.primary.main, 0.15)} 50%, ${alpha(theme.palette.primary.main, 0.1)} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: theme.spacing(1),
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
}))
