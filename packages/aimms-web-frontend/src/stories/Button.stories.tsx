import type { Meta, StoryObj } from '@storybook/react'
import { Box, Stack } from '@mui/material'
import {
  PrimaryButton,
  SecondaryButton,
  OutlinedButton,
  TextButton,
  DangerButton,
  SuccessButton,
  IconButton as StyledIconButton,
} from '@/components/styled'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material'

const meta = {
  title: 'Design System/Buttons',
  component: PrimaryButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PrimaryButton>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Button Variants</h3>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <PrimaryButton>Primary Button</PrimaryButton>
          <SecondaryButton>Secondary Button</SecondaryButton>
          <OutlinedButton>Outlined Button</OutlinedButton>
          <TextButton>Text Button</TextButton>
          <DangerButton>Danger Button</DangerButton>
          <SuccessButton>Success Button</SuccessButton>
        </Stack>
      </Box>

      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>With Icons</h3>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <PrimaryButton startIcon={<AddIcon />}>Add Item</PrimaryButton>
          <SecondaryButton startIcon={<SaveIcon />}>Save Draft</SecondaryButton>
          <DangerButton startIcon={<DeleteIcon />}>Delete</DangerButton>
          <SuccessButton startIcon={<SaveIcon />}>Approve</SuccessButton>
        </Stack>
      </Box>

      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Icon-Only Buttons</h3>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <StyledIconButton>
            <EditIcon />
          </StyledIconButton>
          <StyledIconButton>
            <DeleteIcon />
          </StyledIconButton>
          <StyledIconButton>
            <SaveIcon />
          </StyledIconButton>
          <StyledIconButton>
            <CloseIcon />
          </StyledIconButton>
        </Stack>
      </Box>

      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Disabled States</h3>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
          <PrimaryButton disabled>Primary Disabled</PrimaryButton>
          <SecondaryButton disabled>Secondary Disabled</SecondaryButton>
          <OutlinedButton disabled>Outlined Disabled</OutlinedButton>
          <DangerButton disabled>Danger Disabled</DangerButton>
        </Stack>
      </Box>

      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Full Width</h3>
        <Stack spacing={2}>
          <PrimaryButton fullWidth>Full Width Primary</PrimaryButton>
          <SecondaryButton fullWidth>Full Width Secondary</SecondaryButton>
        </Stack>
      </Box>

      <Box>
        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Usage Examples</h3>
        <Stack spacing={3}>
          <Box>
            <p style={{ marginBottom: '12px', fontSize: '0.875rem', color: '#666' }}>
              Form Actions:
            </p>
            <Stack direction="row" spacing={2}>
              <PrimaryButton startIcon={<SaveIcon />}>Save Changes</PrimaryButton>
              <TextButton>Cancel</TextButton>
            </Stack>
          </Box>

          <Box>
            <p style={{ marginBottom: '12px', fontSize: '0.875rem', color: '#666' }}>
              Confirmation Dialog:
            </p>
            <Stack direction="row" spacing={2}>
              <DangerButton>Delete Account</DangerButton>
              <SecondaryButton>Keep Account</SecondaryButton>
            </Stack>
          </Box>

          <Box>
            <p style={{ marginBottom: '12px', fontSize: '0.875rem', color: '#666' }}>
              Create/Add Actions:
            </p>
            <Stack direction="row" spacing={2}>
              <PrimaryButton startIcon={<AddIcon />}>Create New</PrimaryButton>
              <OutlinedButton startIcon={<AddIcon />}>Add Item</OutlinedButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  ),
}

export const Primary: Story = {
  args: {
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  render: () => <SecondaryButton>Secondary Button</SecondaryButton>,
}

export const Outlined: Story = {
  render: () => <OutlinedButton>Outlined Button</OutlinedButton>,
}

export const Text: Story = {
  render: () => <TextButton>Text Button</TextButton>,
}

export const Danger: Story = {
  render: () => <DangerButton>Delete</DangerButton>,
}

export const Success: Story = {
  render: () => <SuccessButton>Approve</SuccessButton>,
}

export const WithIcons: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <PrimaryButton startIcon={<AddIcon />}>Add</PrimaryButton>
      <SecondaryButton startIcon={<SaveIcon />}>Save</SecondaryButton>
      <DangerButton startIcon={<DeleteIcon />}>Delete</DangerButton>
      <PrimaryButton endIcon={<SaveIcon />}>Save & Continue</PrimaryButton>
    </Stack>
  ),
}
