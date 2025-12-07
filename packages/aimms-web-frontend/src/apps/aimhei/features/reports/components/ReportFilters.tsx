/**
 * ReportFilters Component
 * Filter controls for report history
 */

import React from "react"
import { Box, TextField, MenuItem, InputAdornment, useTheme } from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import { FlexRow } from "@/components/styled"

export interface ReportFiltersData {
  searchTerm: string
  searchField: string
  modelFilter: string
  dateFilter: string
}

export interface ReportFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  searchField?: string
  onSearchFieldChange?: (value: string) => void
  modelFilter?: string
  onModelFilterChange?: (value: string) => void
  dateFilter?: string
  onDateFilterChange?: (value: string) => void
  // Alternative: pass entire filters object
  filters?: ReportFiltersData
  onFiltersChange?: (filters: Partial<ReportFiltersData>) => void
  onClearFilters?: () => void
}

/**
 * ReportFilters component
 */
export const ReportFilters: React.FC<ReportFiltersProps> = ({
  searchTerm: searchTermProp,
  onSearchChange,
  searchField: searchFieldProp,
  onSearchFieldChange,
  modelFilter: modelFilterProp,
  onModelFilterChange,
  dateFilter: dateFilterProp,
  onDateFilterChange,
  filters,
  onFiltersChange,
}) => {
  const theme = useTheme()
  // Support both prop styles
  const searchTerm = filters?.searchTerm ?? searchTermProp
  const searchField = filters?.searchField ?? searchFieldProp ?? "case_title"
  const modelFilter = filters?.modelFilter ?? modelFilterProp ?? "all"
  const dateFilter = filters?.dateFilter ?? dateFilterProp ?? "all"

  const handleSearchChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ searchTerm: value })
    } else {
      onSearchChange(value)
    }
  }

  const handleSearchFieldChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ searchField: value })
    } else if (onSearchFieldChange) {
      onSearchFieldChange(value)
    }
  }

  const handleModelFilterChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ modelFilter: value })
    } else if (onModelFilterChange) {
      onModelFilterChange(value)
    }
  }

  const handleDateFilterChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({ dateFilter: value })
    } else if (onDateFilterChange) {
      onDateFilterChange(value)
    }
  }
  return (
    <FlexRow gap={2} sx={{ mb: 3, flexWrap: "wrap" }}>
      {/* Search Field */}
      <TextField
        size="small"
        placeholder="Search reports..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.text.disabled }} />
            </InputAdornment>
          ),
        }}
        sx={{ flex: 1, minWidth: 200 }}
      />

      {/* Search By Dropdown */}
      <TextField
        select
        size="small"
        label="Search By"
        value={searchField}
        onChange={(e) => handleSearchFieldChange(e.target.value)}
        sx={{ minWidth: 150 }}>
        <MenuItem value="case_title">Title</MenuItem>
        <MenuItem value="patient_id">Patient ID</MenuItem>
        <MenuItem value="hcp_name">HCP Name</MenuItem>
      </TextField>

      {/* AI Model Filter */}
      <TextField
        select
        size="small"
        label="AI Model"
        id="report-model-filter"
        name="report-model-filter"
        value={modelFilter}
        onChange={(e) => handleModelFilterChange(e.target.value)}
        sx={{ minWidth: 150 }}>
        <MenuItem value="all">All Models</MenuItem>
        <MenuItem value="gpt-4o">GPT-4o</MenuItem>
        <MenuItem value="gpt-4o-mini">GPT-4o Mini</MenuItem>
        <MenuItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</MenuItem>
      </TextField>

      {/* Date Filter */}
      <TextField
        select
        size="small"
        label="Date Range"
        value={dateFilter}
        onChange={(e) => handleDateFilterChange(e.target.value)}
        sx={{ minWidth: 150 }}>
        <MenuItem value="all">All Time</MenuItem>
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="last_7_days">Last 7 Days</MenuItem>
        <MenuItem value="last_30_days">Last 30 Days</MenuItem>
        <MenuItem value="last_90_days">Last 90 Days</MenuItem>
      </TextField>
    </FlexRow>
  )
}
