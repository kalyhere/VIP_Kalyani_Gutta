import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, useTheme } from '@mui/material'

/**
 * Typography System
 *
 * Visual reference for all typography variants in the design system.
 * Demonstrates heading levels, body text, captions, and other text styles.
 */
const TypographyDoc = () => {
  const theme = useTheme()

  const TypographyExample = ({
    variant,
    label,
    description,
  }: {
    variant: any
    label: string
    description: string
  }) => (
    <Box sx={{ mb: 4, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            minWidth: 80,
            textAlign: 'center',
          }}
        >
          {variant}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Typography variant={variant}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {theme.typography[variant]?.fontSize}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Weight: {theme.typography[variant]?.fontWeight}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Line height: {theme.typography[variant]?.lineHeight}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
        Typography System
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        Semantic typography scale with consistent sizing, weights, and line heights.
      </Typography>

      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Display Headings
      </Typography>

      <TypographyExample variant="h1" label="Page Title (H1)" description="40px • 600 weight • Page titles" />

      <TypographyExample variant="h2" label="Section Header (H2)" description="32px • 600 weight • Section headers" />

      <TypographyExample variant="h3" label="Subsection Header (H3)" description="24px • 500 weight • Subsection headers" />

      <TypographyExample variant="h4" label="Card Title (H4)" description="20px • 500 weight • Card titles" />

      <TypographyExample variant="h5" label="List Header (H5)" description="16px • 500 weight • List headers" />

      <TypographyExample variant="h6" label="Small Header (H6)" description="14px • 500 weight • Small headers" />

      <Typography variant="h4" sx={{ mb: 3, mt: 5, fontWeight: 600 }}>
        Body Text
      </Typography>

      <TypographyExample
        variant="body1"
        label="This is primary body text used for most content. It's 16px with a comfortable line height of 1.6 for readability."
        description="16px • 400 weight • Primary body text"
      />

      <TypographyExample
        variant="body2"
        label="This is secondary body text for supplementary content. Slightly smaller at 14px but maintains readability."
        description="14px • 400 weight • Secondary body text"
      />

      <Typography variant="h4" sx={{ mb: 3, mt: 5, fontWeight: 600 }}>
        Specialized Text
      </Typography>

      <TypographyExample
        variant="subtitle1"
        label="Subtitle 1 - Medium emphasis text"
        description="16px • 500 weight • Subtitles"
      />

      <TypographyExample
        variant="subtitle2"
        label="Subtitle 2 - Smaller subtitles"
        description="14px • 500 weight • Smaller subtitles"
      />

      <TypographyExample variant="caption" label="Caption text for labels and metadata" description="12px • 400 weight • Captions, labels" />

      <TypographyExample variant="overline" label="OVERLINE TEXT" description="12px • 500 weight • Uppercase overlines" />

      <TypographyExample variant="button" label="Button Text" description="14px • 500 weight • Button labels" />

      <Box sx={{ mt: 5, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Usage Example
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2 }}>
          {'<Typography variant="h3">Section Header</Typography>'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {'<Typography variant="body1">Primary text content</Typography>'}
        </Typography>
      </Box>
    </Box>
  )
}

const meta: Meta = {
  title: 'Design Tokens/Typography',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj

export const AllVariants: Story = {
  render: () => <TypographyDoc />,
}

export const Headings: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Heading 1
      </Typography>
      <Typography variant="h2" gutterBottom>
        Heading 2
      </Typography>
      <Typography variant="h3" gutterBottom>
        Heading 3
      </Typography>
      <Typography variant="h4" gutterBottom>
        Heading 4
      </Typography>
      <Typography variant="h5" gutterBottom>
        Heading 5
      </Typography>
      <Typography variant="h6" gutterBottom>
        Heading 6
      </Typography>
    </Box>
  ),
}

export const BodyText: Story = {
  render: () => (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="body1" paragraph>
        This is body1 text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. It's the primary body text variant
        with 16px font size and comfortable line height for extended reading.
      </Typography>
      <Typography variant="body2" paragraph>
        This is body2 text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. It's slightly smaller at 14px,
        useful for secondary content and supplementary information.
      </Typography>
      <Typography variant="caption" display="block">
        This is caption text - perfect for metadata, timestamps, and small labels.
      </Typography>
    </Box>
  ),
}

export const ColorCombinations: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Text Colors
      </Typography>
      <Typography variant="body1" color="text.primary" gutterBottom>
        Primary text color (default)
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Secondary text color
      </Typography>
      <Typography variant="body1" color="primary" gutterBottom>
        Primary color (Arizona Red)
      </Typography>
      <Typography variant="body1" color="secondary" gutterBottom>
        Secondary color (Azurite)
      </Typography>
      <Typography variant="body1" color="error" gutterBottom>
        Error color
      </Typography>
      <Typography variant="body1" color="success" gutterBottom>
        Success color
      </Typography>
    </Box>
  ),
}
