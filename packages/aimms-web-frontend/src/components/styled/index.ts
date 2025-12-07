/**
 * Styled Primitives Library
 *
 * Centralized export for all pre-styled, theme-aware components.
 * Import from here for consistent styling across the application.
 *
 * Usage:
 * import { StyledCard, PageContainer } from '@/components/styled'
 */

// Card variants
export {
  StyledCard,
  ElevatedCard,
  OutlinedCard,
  FlatCard,
  ClickableCard,
} from './Card'

// Layout containers
export {
  PageContainer,
  SectionContainer,
  ContentContainer,
  FlexContainer,
  FlexRow,
  GridContainer,
} from './Container'

// Button variants
export {
  PrimaryButton,
  SecondaryButton,
  OutlinedButton,
  TextButton,
  DangerButton,
  SuccessButton,
  IconButton,
} from './Button'

// Typography components
export {
  PageTitle,
  SectionTitle,
  SubsectionTitle,
  CardTitle,
  BodyText,
  SmallText,
  Caption,
  Overline,
  ErrorText,
  SuccessText,
  LinkText,
  MutedText,
} from './Typography'

// Status chips
export {
  NotStartedChip,
  InProgressChip,
  PendingReviewChip,
  CompletedChip,
  OverdueChip,
  WarningChip,
} from './StatusChip'

// Stat cards
export {
  StatCard,
  StatCardContainer,
  StatIconWrapper,
  StatValue,
  StatLabel,
  StatTrend,
} from './StatCard'

// Flex layouts
export {
  Flex,
  FlexCenter,
  FlexCenterVertical,
  FlexBetween,
  FlexColumn,
  FlexWrap,
  ResponsiveGrid,
} from './Flex'

// Interactive cards
export {
  HoverCard,
  ScaleCard,
  GlowCard,
} from './HoverCard'

// Gradient components
export {
  GradientBox,
  GradientText,
  ShimmerBox,
} from './GradientBox'
