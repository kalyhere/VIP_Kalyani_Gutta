import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, Paper } from '@mui/material'
import {
  PageContainer,
  SectionContainer,
  ContentContainer,
  FlexContainer,
  FlexRow,
  FlexColumn,
  GridContainer,
} from '@/components/styled'

/**
 * Container Components
 *
 * Pre-styled layout containers with consistent theming and spacing.
 * Use these instead of creating custom layout containers.
 */
const meta: Meta = {
  title: 'Components/Container',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj

const ExampleContent = ({ label }: { label: string }) => (
  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', textAlign: 'center' }}>
    <Typography variant="body2">{label}</Typography>
  </Paper>
)

export const PageContainerExample: Story = {
  render: () => (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        PageContainer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Max-width container (1280px), centered, with responsive padding. Use for page-level layouts.
      </Typography>
      <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="body2">Content inside PageContainer</Typography>
      </Paper>
    </PageContainer>
  ),
}

export const SectionContainerExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SectionContainer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Adds vertical spacing between sections (margin-bottom).
      </Typography>

      <SectionContainer>
        <ExampleContent label="Section 1" />
      </SectionContainer>

      <SectionContainer>
        <ExampleContent label="Section 2" />
      </SectionContainer>

      <SectionContainer>
        <ExampleContent label="Section 3" />
      </SectionContainer>
    </Box>
  ),
}

export const ContentContainerExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ContentContainer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Padded box with background, border radius, and subtle shadow. Use for content cards.
      </Typography>

      <ContentContainer>
        <Typography variant="h6" gutterBottom>
          Content Title
        </Typography>
        <Typography variant="body2">This content is inside a ContentContainer with consistent padding and styling.</Typography>
      </ContentContainer>
    </Box>
  ),
}

export const FlexContainerExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FlexContainer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Centered flexbox container. Use for centering content.
      </Typography>

      <FlexContainer sx={{ height: 200, bgcolor: 'background.default', borderRadius: 2 }}>
        <ExampleContent label="Centered Content" />
      </FlexContainer>
    </Box>
  ),
}

export const FlexRowExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FlexRow
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Horizontal flexbox with gap and wrap. Use for horizontal layouts.
      </Typography>

      <FlexRow>
        <ExampleContent label="Item 1" />
        <ExampleContent label="Item 2" />
        <ExampleContent label="Item 3" />
        <ExampleContent label="Item 4" />
        <ExampleContent label="Item 5" />
      </FlexRow>
    </Box>
  ),
}

export const FlexColumnExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FlexColumn
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Vertical flexbox with gap. Use for vertical layouts.
      </Typography>

      <FlexColumn sx={{ maxWidth: 400 }}>
        <ExampleContent label="Item 1" />
        <ExampleContent label="Item 2" />
        <ExampleContent label="Item 3" />
      </FlexColumn>
    </Box>
  ),
}

export const GridContainerExample: Story = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        GridContainer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Responsive grid layout with auto-fill columns (min 300px). Use for card grids.
      </Typography>

      <GridContainer>
        <ExampleContent label="Grid Item 1" />
        <ExampleContent label="Grid Item 2" />
        <ExampleContent label="Grid Item 3" />
        <ExampleContent label="Grid Item 4" />
        <ExampleContent label="Grid Item 5" />
        <ExampleContent label="Grid Item 6" />
      </GridContainer>
    </Box>
  ),
}

export const AllContainers: Story = {
  render: () => (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <PageContainer>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Container Components
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Pre-styled layout containers for consistent spacing and structure.
        </Typography>

        <SectionContainer>
          <Typography variant="h5" gutterBottom>
            FlexRow - Horizontal Layout
          </Typography>
          <FlexRow>
            <ExampleContent label="Item 1" />
            <ExampleContent label="Item 2" />
            <ExampleContent label="Item 3" />
          </FlexRow>
        </SectionContainer>

        <SectionContainer>
          <Typography variant="h5" gutterBottom>
            FlexColumn - Vertical Layout
          </Typography>
          <FlexColumn sx={{ maxWidth: 400 }}>
            <ExampleContent label="Item 1" />
            <ExampleContent label="Item 2" />
            <ExampleContent label="Item 3" />
          </FlexColumn>
        </SectionContainer>

        <SectionContainer>
          <Typography variant="h5" gutterBottom>
            GridContainer - Responsive Grid
          </Typography>
          <GridContainer>
            <ExampleContent label="Grid 1" />
            <ExampleContent label="Grid 2" />
            <ExampleContent label="Grid 3" />
            <ExampleContent label="Grid 4" />
          </GridContainer>
        </SectionContainer>

        <SectionContainer>
          <Typography variant="h5" gutterBottom>
            ContentContainer - Content Cards
          </Typography>
          <ContentContainer>
            <Typography variant="h6" gutterBottom>
              Section Title
            </Typography>
            <Typography variant="body2">
              Content inside a styled container with padding, background, and shadow.
            </Typography>
          </ContentContainer>
        </SectionContainer>
      </PageContainer>
    </Box>
  ),
}

export const RealWorldExample: Story = {
  render: () => (
    <PageContainer>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
        Dashboard Example
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Real-world usage of container components.
      </Typography>

      <SectionContainer>
        <FlexRow>
          <ContentContainer sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              1,234
            </Typography>
          </ContentContainer>

          <ContentContainer sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Active Sessions
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              456
            </Typography>
          </ContentContainer>

          <ContentContainer sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Reports Generated
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              789
            </Typography>
          </ContentContainer>
        </FlexRow>
      </SectionContainer>

      <SectionContainer>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <FlexColumn>
          <ContentContainer>
            <Typography variant="body1">Student completed case assignment</Typography>
            <Typography variant="caption" color="text.secondary">
              2 hours ago
            </Typography>
          </ContentContainer>

          <ContentContainer>
            <Typography variant="body1">Faculty created new class</Typography>
            <Typography variant="caption" color="text.secondary">
              5 hours ago
            </Typography>
          </ContentContainer>

          <ContentContainer>
            <Typography variant="body1">Report generated for assignment</Typography>
            <Typography variant="caption" color="text.secondary">
              Yesterday
            </Typography>
          </ContentContainer>
        </FlexColumn>
      </SectionContainer>
    </PageContainer>
  ),
}
