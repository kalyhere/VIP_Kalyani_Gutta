/**
 * Flex Layout Primitives
 *
 * Reusable flex container components to replace common sx patterns.
 * Usage: <Flex gap={2}>...</Flex> or <FlexBetween>...</FlexBetween>
 */

import { Box, BoxProps, styled } from '@mui/material'

// Base flex container
export const Flex = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
}))

// Flex with center alignment (both axes)
export const FlexCenter = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

/**
 * Flex with vertical center alignment
 *
 * @example
 * // Basic usage
 * <FlexCenterVertical>
 *   <Icon />
 *   <Typography>Label</Typography>
 * </FlexCenterVertical>
 *
 * @example
 * // With custom gap
 * <FlexCenterVertical gap={3}>
 *   <Avatar />
 *   <Box>...</Box>
 * </FlexCenterVertical>
 *
 * @example
 * // With custom justifyContent
 * <FlexCenterVertical justifyContent="space-between">
 *   <Button>Left</Button>
 *   <Button>Right</Button>
 * </FlexCenterVertical>
 */
export const FlexCenterVertical = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}))

// Flex with space-between justification
export const FlexBetween = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

/**
 * Flex column layout with vertical stacking
 *
 * @example
 * // Basic vertical layout
 * <FlexColumn>
 *   <Card>1</Card>
 *   <Card>2</Card>
 * </FlexColumn>
 *
 * @example
 * // With custom gap
 * <FlexColumn gap={3}>
 *   <Section />
 *   <Section />
 * </FlexColumn>
 *
 * @example
 * // With alignment
 * <FlexColumn alignItems="center" justifyContent="space-between">
 *   <Header />
 *   <Content />
 *   <Footer />
 * </FlexColumn>
 */
export const FlexColumn = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}))

// Flex with wrapping
export const FlexWrap = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
}))

// Grid layout with responsive columns
export const ResponsiveGrid = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(1.5),
  },
}))
