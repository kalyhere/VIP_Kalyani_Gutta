import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, Paper, useTheme } from '@mui/material'

/**
 * Spacing System
 *
 * Visual reference for the 8px-based spacing scale.
 * Use theme.spacing() for consistent layout and margins.
 */
const SpacingDoc = () => {
  const theme = useTheme()

  const SpacingExample = ({ units, label }: { units: number; label: string }) => {
    const pixels = units * 8
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              minWidth: 100,
              textAlign: 'center',
            }}
          >
            spacing({units})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pixels}px • {label}
          </Typography>
        </Box>
        <Box
          sx={{
            width: pixels,
            height: 40,
            bgcolor: 'primary.main',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
            {pixels}px
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
        Spacing System
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        8px base unit system for consistent spacing. Use <code>theme.spacing(n)</code> where n * 8px.
      </Typography>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Spacing Scale
      </Typography>

      <SpacingExample units={0.5} label="Extra small gap" />
      <SpacingExample units={1} label="Small gap, tight spacing" />
      <SpacingExample units={2} label="Default gap between items" />
      <SpacingExample units={3} label="Medium spacing, section padding" />
      <SpacingExample units={4} label="Large spacing between sections" />
      <SpacingExample units={5} label="Extra large spacing" />
      <SpacingExample units={6} label="Extra extra large spacing" />
      <SpacingExample units={8} label="Major section separation" />

      <Box sx={{ mt: 5, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Usage Examples
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Padding:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {'<Box sx={{ p: 2 }}>  // padding: 16px'}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Margin:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {'<Box sx={{ mt: 3, mb: 2 }}>  // marginTop: 24px, marginBottom: 16px'}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Gap:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {'<Box sx={{ display: "flex", gap: 2 }}>  // gap: 16px'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            In styled components:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {'const Card = styled(Box)(({ theme }) => ({'}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', ml: 2 }}>
            {'  padding: theme.spacing(3),  // 24px'}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {'}))'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          💡 Best Practices
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Use spacing units (1, 2, 3) instead of pixel values</li>
            <li>Common values: 1 (8px), 2 (16px), 3 (24px), 4 (32px)</li>
            <li>Prefer <code>gap</code> over margins for flex/grid layouts</li>
            <li>Use consistent spacing for visual hierarchy</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  )
}

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj

export const SpacingScale: Story = {
  render: () => <SpacingDoc />,
}

export const PaddingExamples: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Padding Examples
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 1, bgcolor: 'primary.light' }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            p: 1 (8px)
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            p: 2 (16px)
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: 'primary.light' }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            p: 3 (24px)
          </Typography>
        </Paper>

        <Paper sx={{ p: 4, bgcolor: 'primary.light' }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            p: 4 (32px)
          </Typography>
        </Paper>
      </Box>
    </Box>
  ),
}

export const MarginExamples: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Margin Examples
      </Typography>

      <Paper sx={{ p: 2, mb: 1, bgcolor: 'secondary.light' }}>
        <Typography variant="caption" sx={{ color: 'white' }}>
          mb: 1 (8px bottom margin)
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, bgcolor: 'secondary.light' }}>
        <Typography variant="caption" sx={{ color: 'white' }}>
          mb: 2 (16px bottom margin)
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, bgcolor: 'secondary.light' }}>
        <Typography variant="caption" sx={{ color: 'white' }}>
          mb: 3 (24px bottom margin)
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, bgcolor: 'secondary.light' }}>
        <Typography variant="caption" sx={{ color: 'white' }}>
          No margin
        </Typography>
      </Paper>
    </Box>
  ),
}

export const GapExamples: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gap Examples (Flexbox)
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        gap: 1 (8px)
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Paper sx={{ p: 2, bgcolor: 'success.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 1
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'success.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 2
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'success.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 3
          </Typography>
        </Paper>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        gap: 3 (24px)
      </Typography>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Paper sx={{ p: 2, bgcolor: 'warning.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 1
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'warning.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 2
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'warning.light', flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'white' }}>
            Item 3
          </Typography>
        </Paper>
      </Box>
    </Box>
  ),
}

export const ResponsiveSpacing: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Responsive Spacing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Spacing adapts to screen size: padding changes from 1 (mobile) to 3 (desktop)
      </Typography>

      <Paper
        sx={{
          p: { xs: 1, sm: 2, md: 3 },
          bgcolor: 'error.light',
        }}
      >
        <Typography variant="body2" sx={{ color: 'white' }}>
          Resize window to see padding change
        </Typography>
        <Typography variant="caption" sx={{ color: 'white', fontFamily: 'monospace' }}>
          {'p: { xs: 1, sm: 2, md: 3 }'}
        </Typography>
      </Paper>
    </Box>
  ),
}
