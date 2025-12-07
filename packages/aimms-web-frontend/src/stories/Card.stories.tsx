import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@mui/material'
import {
  StyledCard,
  ElevatedCard,
  OutlinedCard,
  FlatCard,
  ClickableCard,
} from '@/components/styled'

/**
 * Card Components
 *
 * Pre-styled card variants with consistent theming.
 * Use these instead of creating custom cards to maintain design consistency.
 */
const meta: Meta = {
  title: 'Components/Card',
  parameters: {
    layout: 'padded',
  },
}

export default meta

type Story = StoryObj

export const Default: Story = {
  render: () => (
    <StyledCard>
      <Typography variant="h5" gutterBottom>
        Default Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Standard card with medium padding, rounded corners, and subtle shadow.
        Hovers with slightly elevated shadow.
      </Typography>
    </StyledCard>
  ),
}

export const Elevated: Story = {
  render: () => (
    <ElevatedCard>
      <Typography variant="h5" gutterBottom>
        Elevated Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Card with more padding, stronger shadow, and hover lift effect.
        Use for important content or call-to-actions.
      </Typography>
    </ElevatedCard>
  ),
}

export const Outlined: Story = {
  render: () => (
    <OutlinedCard>
      <Typography variant="h5" gutterBottom>
        Outlined Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Card with border and no shadow. Hovers with primary border color.
        Use for secondary content or list items.
      </Typography>
    </OutlinedCard>
  ),
}

export const Flat: Story = {
  render: () => (
    <FlatCard>
      <Typography variant="h5" gutterBottom>
        Flat Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Minimal card with no shadow, less padding, and background color.
        Use for subtle content separation.
      </Typography>
    </FlatCard>
  ),
}

export const Clickable: Story = {
  render: () => (
    <ClickableCard onClick={() => alert('Card clicked!')}>
      <Typography variant="h5" gutterBottom>
        Clickable Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Interactive card with pointer cursor and lift effect on hover.
        Click me to see the action!
      </Typography>
    </ClickableCard>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <StyledCard>
        <Typography variant="h6" gutterBottom>
          StyledCard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Default card variant
        </Typography>
      </StyledCard>

      <ElevatedCard>
        <Typography variant="h6" gutterBottom>
          ElevatedCard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Elevated variant
        </Typography>
      </ElevatedCard>

      <OutlinedCard>
        <Typography variant="h6" gutterBottom>
          OutlinedCard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Outlined variant
        </Typography>
      </OutlinedCard>

      <FlatCard>
        <Typography variant="h6" gutterBottom>
          FlatCard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Flat variant
        </Typography>
      </FlatCard>

      <ClickableCard>
        <Typography variant="h6" gutterBottom>
          ClickableCard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Clickable variant
        </Typography>
      </ClickableCard>
    </div>
  ),
}
