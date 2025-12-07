import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, useTheme } from '@mui/material'
import { uaColors } from '@lib/colors'

/**
 * Design System Colors
 *
 * Visual reference for all colors in the AIMMS Web design system.
 * Colors are defined in `@lib/colors` and mapped to MUI theme palette.
 */
const ColorsDoc = () => {
  const theme = useTheme()

  const ColorSwatch = ({ color, name, value }: { color: string; name: string; value: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box
        sx={{
          width: 80,
          height: 80,
          backgroundColor: color,
          borderRadius: 2,
          boxShadow: 2,
          mr: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )

  const PaletteSection = ({ title, colors }: { title: string; colors: Array<{ name: string; color: string; value: string }> }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {title}
      </Typography>
      {colors.map((c) => (
        <ColorSwatch key={c.name} color={c.color} name={c.name} value={c.value} />
      ))}
    </Box>
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
        Color System
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        University of Arizona brand colors integrated into Material-UI theme palette.
      </Typography>

      <PaletteSection
        title="Primary Colors"
        colors={[
          { name: 'Primary (Arizona Red)', color: theme.palette.primary.main, value: uaColors.arizonaRed },
          { name: 'Primary Dark (Chili)', color: theme.palette.primary.dark, value: uaColors.chili },
          { name: 'Primary Light (Arizona Blue)', color: theme.palette.primary.light, value: uaColors.arizonaBlue },
        ]}
      />

      <PaletteSection
        title="Secondary Colors"
        colors={[
          { name: 'Secondary (Azurite)', color: theme.palette.secondary.main, value: uaColors.azurite },
          { name: 'Secondary Dark (Midnight)', color: theme.palette.secondary.dark, value: uaColors.midnight },
          { name: 'Secondary Light (Oasis)', color: theme.palette.secondary.light, value: uaColors.oasis },
        ]}
      />

      <PaletteSection
        title="Text Colors"
        colors={[
          { name: 'Text Primary (Midnight)', color: theme.palette.text.primary, value: uaColors.midnight },
          { name: 'Text Secondary (Slate 600)', color: theme.palette.text.secondary, value: uaColors.slate[600] },
          { name: 'Text Disabled (Slate 400)', color: theme.palette.text.disabled || uaColors.slate[400], value: uaColors.slate[400] },
        ]}
      />

      <PaletteSection
        title="Background Colors"
        colors={[
          { name: 'Background Default (Slate 50)', color: theme.palette.background.default, value: uaColors.slate[50] },
          { name: 'Background Paper (White)', color: theme.palette.background.paper, value: uaColors.white },
        ]}
      />

      <PaletteSection
        title="Semantic Colors"
        colors={[
          { name: 'Error (Arizona Red)', color: theme.palette.error.main, value: uaColors.arizonaRed },
          { name: 'Warning (Warm)', color: theme.palette.warning.main, value: uaColors.warm },
          { name: 'Success (Sage)', color: theme.palette.success.main, value: uaColors.sage },
          { name: 'Info (Azurite)', color: theme.palette.info.main, value: uaColors.azurite },
        ]}
      />

      <Typography variant="h5" sx={{ mb: 3, mt: 4, fontWeight: 600 }}>
        Slate Scale
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
        {Object.entries(uaColors.slate).map(([key, value]) => (
          <Box key={key}>
            <Box
              sx={{
                width: '100%',
                height: 60,
                backgroundColor: value,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 500 }}>
              Slate {key}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const meta: Meta = {
  title: 'Design Tokens/Colors',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj

export const AllColors: Story = {
  render: () => <ColorsDoc />,
}
