/**
 * Themed Container Primitives
 *
 * Layout containers with consistent theming and spacing.
 * Usage: <PageContainer>...</PageContainer>
 */

import { Box, styled } from '@mui/material'

// Page container (max-width, centered, responsive padding)
export const PageContainer = styled(Box)(({ theme }) => ({
  maxWidth: theme.breakpoints.values.lg,
  margin: '0 auto',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}))

// Section container (vertical spacing between sections)
export const SectionContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(3),
  },
}))

// Content container (padded box for content)
export const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
}))

// Flex container (centered flexbox)
export const FlexContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

/**
 * Flex row layout with horizontal arrangement
 *
 * @example
 * // Basic horizontal layout (default gap: 2)
 * <FlexRow>
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </FlexRow>
 *
 * @example
 * // With custom gap
 * <FlexRow gap={1}>
 *   <Chip label="Tag 1" />
 *   <Chip label="Tag 2" />
 * </FlexRow>
 *
 * @example
 * // With custom alignment and no wrap
 * <FlexRow justifyContent="flex-end" flexWrap="nowrap">
 *   <IconButton />
 *   <IconButton />
 * </FlexRow>
 */
export const FlexRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
}))

// Flex column (vertical flex with gap) - Note: Prefer using FlexColumn from Flex.tsx
export const FlexColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}))

// Grid container (responsive grid layout)
export const GridContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
}))
