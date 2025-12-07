import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Box, Stack } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import {
  UATextField,
  UASelect,
  UADateTimePicker,
  UASearchField,
  UAAdvancedSearchField,
  FormSectionHeader,
  FieldGroup,
} from '@/components/StyledFormComponents'
import { MedicalServices as MedicalIcon } from '@mui/icons-material'
import { PrimaryButton, SecondaryButton } from '@/components/styled'

const meta = {
  title: 'Design System/Form Components',
  component: UATextField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Story />
      </LocalizationProvider>
    ),
  ],
} satisfies Meta<typeof UATextField>

export default meta
type Story = StoryObj<typeof meta>

export const AllFormComponents: Story = {
  render: () => {
    const [textValue, setTextValue] = useState('')
    const [selectValue, setSelectValue] = useState('')
    const [dateValue, setDateValue] = useState<any>(dayjs())
    const [searchValue, setSearchValue] = useState('')
    const [advSearchValue, setAdvSearchValue] = useState('')
    const [advSearchField, setAdvSearchField] = useState('all')

    return (
      <Stack spacing={4} maxWidth={600}>
        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Text Fields</h3>
          <Stack spacing={2}>
            <UATextField
              label="Standard Text Field"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter text here..."
            />
            <UATextField
              label="Multiline Text Field"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              multiline
              rows={4}
              placeholder="Enter multiple lines..."
            />
            <UATextField
              label="Required Field"
              required
              placeholder="This field is required"
            />
            <UATextField
              label="Disabled Field"
              disabled
              value="Cannot edit this"
            />
            <UATextField
              label="Error State"
              error
              helperText="This field has an error"
              value="Invalid value"
            />
          </Stack>
        </Box>

        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Select Fields</h3>
          <Stack spacing={2}>
            <UASelect
              label="Select an Option"
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { value: '', label: 'None' },
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
              ]}
            />
            <UASelect
              label="Role Selection"
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'faculty', label: 'Faculty' },
                { value: 'admin', label: 'Administrator' },
              ]}
            />
            <UASelect
              label="Disabled Select"
              value="option1"
              onChange={() => {}}
              disabled
              options={[
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ]}
            />
          </Stack>
        </Box>

        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Date & Time Pickers</h3>
          <Stack spacing={2}>
            <UADateTimePicker
              label="Appointment Date & Time"
              value={dateValue}
              onChange={setDateValue}
            />
            <UADateTimePicker
              label="Disabled Date Picker"
              value={dateValue}
              onChange={setDateValue}
              disabled
            />
          </Stack>
        </Box>

        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Search Fields</h3>
          <Stack spacing={2}>
            <UASearchField
              placeholder="Search..."
              value={searchValue}
              onChange={setSearchValue}
            />
            <UAAdvancedSearchField
              value={advSearchValue}
              onChange={setAdvSearchValue}
              searchField={advSearchField}
              onSearchFieldChange={setAdvSearchField}
              searchOptions={[
                { value: 'all', label: 'All Fields' },
                { value: 'name', label: 'Name' },
                { value: 'email', label: 'Email' },
                { value: 'id', label: 'Student ID' },
              ]}
            />
          </Stack>
        </Box>

        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Form Sections</h3>
          <FormSectionHeader
            icon={<MedicalIcon />}
            title="Patient Information"
            subtitle="Enter the patient's personal details"
          />
          <FieldGroup spacing={2}>
            <UATextField label="First Name" placeholder="John" />
            <UATextField label="Last Name" placeholder="Doe" />
          </FieldGroup>
          <FieldGroup spacing={2} direction="row">
            <UATextField label="Email" placeholder="john.doe@example.com" />
            <UATextField label="Phone" placeholder="(555) 123-4567" />
          </FieldGroup>
        </Box>

        <Box>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Complete Form Example</h3>
          <Stack spacing={3}>
            <FormSectionHeader
              icon={<MedicalIcon />}
              title="Create New Assignment"
              subtitle="Fill out the form below to create a new assignment"
            />

            <FieldGroup spacing={2}>
              <UATextField
                label="Assignment Title"
                required
                placeholder="e.g., Suturing Basics"
              />
              <UASelect
                label="Assignment Type"
                value={selectValue}
                onChange={setSelectValue}
                options={[
                  { value: 'practice', label: 'Practice Session' },
                  { value: 'assessment', label: 'Assessment' },
                  { value: 'tutorial', label: 'Tutorial' },
                ]}
              />
            </FieldGroup>

            <FieldGroup spacing={2} direction="row">
              <UADateTimePicker
                label="Start Date"
                value={dateValue}
                onChange={setDateValue}
              />
              <UADateTimePicker
                label="End Date"
                value={dateValue}
                onChange={setDateValue}
              />
            </FieldGroup>

            <UATextField
              label="Description"
              multiline
              rows={4}
              placeholder="Describe the assignment objectives..."
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <SecondaryButton>Cancel</SecondaryButton>
              <PrimaryButton>Create Assignment</PrimaryButton>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    )
  },
}

export const TextFields: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack spacing={2} maxWidth={400}>
        <UATextField
          label="Basic Text Field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text..."
        />
        <UATextField
          label="With Helper Text"
          helperText="This is some helpful text"
          placeholder="Type something..."
        />
        <UATextField
          label="Required Field"
          required
          placeholder="This field is required"
        />
        <UATextField
          label="Error State"
          error
          helperText="This field has an error"
        />
      </Stack>
    )
  },
}

export const SelectFields: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack spacing={2} maxWidth={400}>
        <UASelect
          label="Select an Option"
          value={value}
          onChange={setValue}
          options={[
            { value: '', label: 'None' },
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ]}
        />
      </Stack>
    )
  },
}

export const DateTimePickers: Story = {
  render: () => {
    const [value, setValue] = useState<any>(dayjs())
    return (
      <Stack spacing={2} maxWidth={400}>
        <UADateTimePicker
          label="Select Date & Time"
          value={value}
          onChange={setValue}
        />
      </Stack>
    )
  },
}

export const SearchFields: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('')
    const [advSearchValue, setAdvSearchValue] = useState('')
    const [searchField, setSearchField] = useState('all')

    return (
      <Stack spacing={3} maxWidth={600}>
        <Box>
          <h4 style={{ marginBottom: '12px' }}>Basic Search</h4>
          <UASearchField
            placeholder="Search..."
            value={searchValue}
            onChange={setSearchValue}
          />
        </Box>

        <Box>
          <h4 style={{ marginBottom: '12px' }}>Advanced Search</h4>
          <UAAdvancedSearchField
            value={advSearchValue}
            onChange={setAdvSearchValue}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            searchOptions={[
              { value: 'all', label: 'All Fields' },
              { value: 'name', label: 'Name' },
              { value: 'email', label: 'Email' },
              { value: 'id', label: 'Student ID' },
            ]}
          />
        </Box>
      </Stack>
    )
  },
}
