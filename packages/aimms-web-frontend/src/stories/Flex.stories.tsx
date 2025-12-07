/**
 * Flex Layout Components - Storybook Stories
 *
 * Demonstrates the usage of enhanced Flex layout components with gap and alignment props.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, Paper, Avatar, Button, Chip } from '@mui/material'
import {
  FlexCenterVertical,
  FlexColumn,
} from '../components/styled/Flex'
import { FlexRow } from '../components/styled/Container'
import PersonIcon from '@mui/icons-material/Person'

const meta = {
  title: 'Components/Styled/Flex',
  component: FlexCenterVertical,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FlexCenterVertical>

export default meta

type Story = StoryObj<typeof meta>

/**
 * FlexCenterVertical Stories
 */
export const CenterVerticalBasic: Story = {
  name: 'FlexCenterVertical - Basic',
  render: () => (
    <Paper sx={{ p: 2 }}>
      <FlexCenterVertical>
        <PersonIcon color="primary" />
        <Typography>User Profile</Typography>
      </FlexCenterVertical>
    </Paper>
  ),
}

export const CenterVerticalWithGap: Story = {
  name: 'FlexCenterVertical - With Gap',
  render: () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Different gap values:
      </Typography>
      <Box display="flex" flexDirection="column" gap={3}>
        <Box>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            gap=1
          </Typography>
          <FlexCenterVertical gap={1}>
            <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
            <Typography>Alice Johnson</Typography>
          </FlexCenterVertical>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            gap=2 (default)
          </Typography>
          <FlexCenterVertical gap={2}>
            <Avatar sx={{ width: 32, height: 32 }}>B</Avatar>
            <Typography>Bob Smith</Typography>
          </FlexCenterVertical>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            gap=4
          </Typography>
          <FlexCenterVertical gap={4}>
            <Avatar sx={{ width: 32, height: 32 }}>C</Avatar>
            <Typography>Carol Davis</Typography>
          </FlexCenterVertical>
        </Box>
      </Box>
    </Paper>
  ),
}

export const CenterVerticalWithJustification: Story = {
  name: 'FlexCenterVertical - With Justification',
  render: () => (
    <Paper sx={{ p: 2 }}>
      <FlexCenterVertical justifyContent="space-between" sx={{ width: '100%' }}>
        <Button variant="outlined">Left</Button>
        <Typography>Content</Typography>
        <Button variant="contained">Right</Button>
      </FlexCenterVertical>
    </Paper>
  ),
}

/**
 * FlexColumn Stories
 */
export const ColumnBasic: Story = {
  name: 'FlexColumn - Basic',
  render: () => (
    <Paper sx={{ p: 2 }}>
      <FlexColumn>
        <Paper elevation={2} sx={{ p: 2 }}>
          Card 1
        </Paper>
        <Paper elevation={2} sx={{ p: 2 }}>
          Card 2
        </Paper>
        <Paper elevation={2} sx={{ p: 2 }}>
          Card 3
        </Paper>
      </FlexColumn>
    </Paper>
  ),
}

export const ColumnWithGap: Story = {
  name: 'FlexColumn - With Gap',
  render: () => (
    <Box display="flex" gap={3}>
      <Box flex={1}>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          gap=1
        </Typography>
        <Paper sx={{ p: 2 }}>
          <FlexColumn gap={1}>
            <Chip label="Tag 1" size="small" />
            <Chip label="Tag 2" size="small" />
            <Chip label="Tag 3" size="small" />
          </FlexColumn>
        </Paper>
      </Box>
      <Box flex={1}>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          gap=3
        </Typography>
        <Paper sx={{ p: 2 }}>
          <FlexColumn gap={3}>
            <Chip label="Tag 1" size="small" />
            <Chip label="Tag 2" size="small" />
            <Chip label="Tag 3" size="small" />
          </FlexColumn>
        </Paper>
      </Box>
    </Box>
  ),
}

export const ColumnWithAlignment: Story = {
  name: 'FlexColumn - With Alignment',
  render: () => (
    <Box display="flex" gap={3}>
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          alignItems="flex-start"
        </Typography>
        <FlexColumn alignItems="flex-start" gap={2}>
          <Button variant="contained" size="small">
            Button
          </Button>
          <Button variant="contained" size="small">
            Longer Button
          </Button>
          <Button variant="contained" size="small">
            Short
          </Button>
        </FlexColumn>
      </Paper>
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          alignItems="center"
        </Typography>
        <FlexColumn alignItems="center" gap={2}>
          <Button variant="contained" size="small">
            Button
          </Button>
          <Button variant="contained" size="small">
            Longer Button
          </Button>
          <Button variant="contained" size="small">
            Short
          </Button>
        </FlexColumn>
      </Paper>
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          alignItems="flex-end"
        </Typography>
        <FlexColumn alignItems="flex-end" gap={2}>
          <Button variant="contained" size="small">
            Button
          </Button>
          <Button variant="contained" size="small">
            Longer Button
          </Button>
          <Button variant="contained" size="small">
            Short
          </Button>
        </FlexColumn>
      </Paper>
    </Box>
  ),
}

/**
 * FlexRow Stories
 */
export const RowBasic: Story = {
  name: 'FlexRow - Basic',
  render: () => (
    <Paper sx={{ p: 2 }}>
      <FlexRow>
        <Button variant="contained">Action 1</Button>
        <Button variant="contained">Action 2</Button>
        <Button variant="outlined">Cancel</Button>
      </FlexRow>
    </Paper>
  ),
}

export const RowWithGap: Story = {
  name: 'FlexRow - With Gap',
  render: () => (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          gap=0.5
        </Typography>
        <Paper sx={{ p: 2 }}>
          <FlexRow gap={0.5}>
            <Chip label="React" size="small" />
            <Chip label="TypeScript" size="small" />
            <Chip label="MUI" size="small" />
            <Chip label="Vite" size="small" />
          </FlexRow>
        </Paper>
      </Box>
      <Box>
        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
          gap=2
        </Typography>
        <Paper sx={{ p: 2 }}>
          <FlexRow gap={2}>
            <Chip label="React" size="small" />
            <Chip label="TypeScript" size="small" />
            <Chip label="MUI" size="small" />
            <Chip label="Vite" size="small" />
          </FlexRow>
        </Paper>
      </Box>
    </Box>
  ),
}

export const RowWithJustification: Story = {
  name: 'FlexRow - With Justification',
  render: () => (
    <Box display="flex" flexDirection="column" gap={3}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          justifyContent="flex-start" (default)
        </Typography>
        <FlexRow justifyContent="flex-start">
          <Button variant="contained" size="small">
            Start
          </Button>
          <Button variant="outlined" size="small">
            Button
          </Button>
        </FlexRow>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          justifyContent="center"
        </Typography>
        <FlexRow justifyContent="center">
          <Button variant="contained" size="small">
            Center
          </Button>
          <Button variant="outlined" size="small">
            Button
          </Button>
        </FlexRow>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
          justifyContent="flex-end"
        </Typography>
        <FlexRow justifyContent="flex-end">
          <Button variant="outlined" size="small">
            Cancel
          </Button>
          <Button variant="contained" size="small">
            End
          </Button>
        </FlexRow>
      </Paper>
    </Box>
  ),
}

export const RowNoWrap: Story = {
  name: 'FlexRow - No Wrap',
  render: () => (
    <Paper sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
        flexWrap="nowrap" - items will overflow instead of wrapping
      </Typography>
      <FlexRow flexWrap="nowrap" gap={1}>
        <Button variant="contained" size="small">
          Button 1
        </Button>
        <Button variant="contained" size="small">
          Button 2
        </Button>
        <Button variant="contained" size="small">
          Button 3
        </Button>
        <Button variant="contained" size="small">
          Button 4
        </Button>
      </FlexRow>
    </Paper>
  ),
}

/**
 * Real-world Examples
 */
export const RealWorldUserCard: Story = {
  name: 'Real-world - User Card',
  render: () => (
    <Paper sx={{ p: 2, maxWidth: 400 }}>
      <FlexColumn gap={2}>
        <FlexCenterVertical gap={2}>
          <Avatar sx={{ width: 48, height: 48 }}>JD</Avatar>
          <FlexColumn gap={0.5}>
            <Typography variant="h6">John Doe</Typography>
            <Typography variant="body2" color="text.secondary">
              Software Engineer
            </Typography>
          </FlexColumn>
        </FlexCenterVertical>
        <FlexRow gap={1}>
          <Chip label="React" size="small" color="primary" />
          <Chip label="TypeScript" size="small" color="primary" />
          <Chip label="Node.js" size="small" color="primary" />
        </FlexRow>
        <FlexRow justifyContent="flex-end" gap={1}>
          <Button variant="outlined" size="small">
            View Profile
          </Button>
          <Button variant="contained" size="small">
            Connect
          </Button>
        </FlexRow>
      </FlexColumn>
    </Paper>
  ),
}

export const RealWorldFormActions: Story = {
  name: 'Real-world - Form Actions',
  render: () => (
    <Paper sx={{ p: 3 }}>
      <FlexColumn gap={3}>
        <Typography variant="h6">Form Title</Typography>
        <Typography variant="body2" color="text.secondary">
          Form fields would go here...
        </Typography>
        <FlexCenterVertical justifyContent="space-between">
          <Button variant="text">Reset</Button>
          <FlexRow gap={1}>
            <Button variant="outlined">Cancel</Button>
            <Button variant="contained">Save</Button>
          </FlexRow>
        </FlexCenterVertical>
      </FlexColumn>
    </Paper>
  ),
}
