import React, { forwardRef } from "react"
import {
  TextField,
  MenuItem,
  Box,
  Typography,
  alpha,
  styled,
  TextFieldProps,
  InputAdornment,
  IconButton,
} from "@mui/material"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material"

// Styled TextField Component - now using theme
export const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1),  // 8px - middle ground
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    transition: "all 0.25s ease-in-out",
    "& fieldset": {
      borderColor: alpha(theme.palette.secondary.main, 0.4),
      borderWidth: 1.5,
    },
    "&:hover": {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      "& fieldset": {
        borderColor: alpha(theme.palette.secondary.main, 0.6),
      },
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.default,
      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.08)}, 0 0 0 2px ${alpha(theme.palette.secondary.main, 0.12)}`,
      transform: "translateY(-1px)",
      "& fieldset": {
        borderColor: theme.palette.secondary.main,
        borderWidth: 2,
      },
    },
    "&.Mui-error": {
      "& fieldset": {
        borderColor: theme.palette.error.main,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.error.dark,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.error.main,
        boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.08)}, 0 0 0 2px ${alpha(theme.palette.error.main, 0.12)}`,
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    fontSize: "0.875rem",
    transition: "all 0.25s ease-in-out",
    transformOrigin: "top left",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.85)",
      backgroundColor: theme.palette.background.default,
      borderRadius: theme.spacing(0.5),
    },
    "&.Mui-focused": {
      color: theme.palette.secondary.main,
      fontWeight: 600,
      "&.MuiInputLabel-shrink": {
        transform: "translate(14px, -11px) scale(0.85)",
      },
    },
    "&.Mui-error": {
      color: theme.palette.error.main,
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "0.875rem",
    fontWeight: 400,
    color: theme.palette.text.primary,
    transition: "all 0.25s ease-in-out",
    "&::placeholder": {
      color: alpha(theme.palette.text.secondary, 0.7),
      opacity: 1,
    },
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.75rem",
    marginTop: theme.spacing(0.75),
    "&.Mui-error": {
      color: theme.palette.error.main,
    },
  },
  // Ensure consistent height
  "& .MuiInputBase-root": {
    height: "40px",
  },
}))

// Note: DateTimePicker styling is applied directly in the component via slotProps

// Note: StyledSelect and StyledFormControl removed - UASelect now uses StyledTextField with select prop

// Props interfaces
interface StyledTextFieldComponentProps extends Omit<TextFieldProps, "variant"> {
  variant?: "outlined"
}

interface StyledSelectComponentProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  fullWidth?: boolean
  size?: "small" | "medium"
  error?: boolean
  disabled?: boolean
  id?: string
  name?: string
}

interface StyledDateTimePickerProps {
  label: string
  value: any
  onChange: (date: any) => void
  fullWidth?: boolean
  size?: "small" | "medium"
  error?: boolean
  disabled?: boolean
  id?: string
  name?: string
}

// High-level component wrappers
export const UATextField: React.FC<StyledTextFieldComponentProps> = ({
  variant = "outlined",
  size = "small",
  label,
  id,
  name,
  ...props
}) => {
  // Generate a unique id if not provided and label exists
  const fieldId =
    id || (label ? `ua-textfield-${String(label).toLowerCase().replace(/\s+/g, "-")}` : undefined)
  const fieldName = name || fieldId

  return (
    <StyledTextField
      variant={variant}
      size={size}
      label={label}
      id={fieldId}
      name={fieldName}
      {...props}
    />
  )
}

export const UASelect: React.FC<StyledSelectComponentProps> = ({
  label,
  value,
  onChange,
  options,
  fullWidth = true,
  size = "small",
  error = false,
  disabled = false,
  id,
  name,
}) => {
  // Generate a unique id if not provided
  const fieldId =
    id || (label ? `ua-select-${label.toLowerCase().replace(/\s+/g, "-")}` : "ua-select")
  const fieldName = name || fieldId
  const labelId = `${fieldId}-label`

  return (
    <StyledTextField
      id={fieldId}
      name={fieldName}
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      size={size}
      error={error}
      disabled={disabled}
      variant="outlined"
      InputLabelProps={{
        id: labelId,
      }}
      SelectProps={{
        labelId,
      }}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </StyledTextField>
  )
}

// Custom TextField for DateTimePicker using StyledTextField
const UADateTimeTextField = forwardRef<HTMLDivElement, any>((props, ref) => {
  return <StyledTextField {...props} ref={ref} variant="outlined" />
})

export const UADateTimePicker: React.FC<StyledDateTimePickerProps> = ({
  label,
  value,
  onChange,
  fullWidth = true,
  size = "small",
  error = false,
  disabled = false,
  id,
  name,
}) => {
  // Generate a unique id if not provided
  const fieldId = id || `ua-datetimepicker-${label.toLowerCase().replace(/\s+/g, "-")}`
  const fieldName = name || fieldId

  return (
    <DateTimePicker
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      enableAccessibleFieldDOMStructure={false}
      sx={{ width: fullWidth ? "100%" : "auto" }}
      slots={{
        textField: UADateTimeTextField,
      }}
      slotProps={{
        textField: {
          size,
          fullWidth,
          error,
          disabled,
          id: fieldId,
          name: fieldName,
        } as any,
        openPickerIcon: {
          sx: (theme) => ({
            color: alpha(theme.palette.secondary.main, 0.6),
            fontSize: size === "small" ? "1.25rem" : "1.5rem",
            transition: "color 0.2s ease-in-out",
            "&:hover": {
              color: theme.palette.secondary.main,
            },
          }),
        },
        popper: {
          sx: (theme) => ({
            "& .MuiPaper-root": {
              borderRadius: theme.spacing(1),  // 8px - less rounded
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.text.primary, 0.12)}`,
            },
            "& .MuiDateCalendar-root": {
              "& .MuiPickersDay-root": {
                fontSize: "0.875rem",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                },
                "&.Mui-selected": {
                  backgroundColor: theme.palette.secondary.main,
                  "&:hover": {
                    backgroundColor: theme.palette.secondary.dark,
                  },
                },
              },
            },
            "& .MuiTimeClock-root": {
              "& .MuiClockPointer-root": {
                backgroundColor: theme.palette.secondary.main,
              },
              "& .MuiClockPointer-thumb": {
                backgroundColor: theme.palette.secondary.main,
                borderColor: theme.palette.secondary.main,
              },
            },
          }),
        },
      }}
    />
  )
}

// Form Section Header Component
interface FormSectionHeaderProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
}

export const FormSectionHeader: React.FC<FormSectionHeaderProps> = ({ icon, title, subtitle }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="h6"
      sx={(theme) => ({
        fontSize: "1rem",
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: theme.palette.text.primary,
        fontWeight: 600,
        mb: subtitle ? 0.5 : 0,
      })}>
      {icon}
      {title}
    </Typography>
    {subtitle && (
      <Typography
        variant="body2"
        sx={(theme) => ({
          color: theme.palette.text.secondary,
          fontSize: "0.8rem",
          ml: 3.5,
        })}>
        {subtitle}
      </Typography>
    )}
  </Box>
)

// Field Group Component for organizing related fields
interface FieldGroupProps {
  children: React.ReactNode
  spacing?: number
  direction?: "row" | "column"
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  children,
  spacing = 2,
  direction = "column",
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: direction,
      gap: spacing,
      ...(direction === "row" && {
        flexWrap: "wrap",
        "& > *": { flex: 1, minWidth: 200 },
      }),
    }}>
    {children}
  </Box>
)

// Search Field Component with styled design and built-in search/clear functionality
interface StyledSearchFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
  size?: "small" | "medium"
  disabled?: boolean
  id?: string
  name?: string
}

export const UASearchField: React.FC<StyledSearchFieldProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  fullWidth = true,
  size = "small",
  disabled = false,
  id,
  name,
}) => {
  const handleClear = () => {
    onChange("")
  }

  const fieldId = id || "ua-search-field"
  const fieldName = name || fieldId

  return (
    <StyledTextField
      fullWidth={fullWidth}
      size={size}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      id={fieldId}
      name={fieldName}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              sx={(theme) => ({
                color: alpha(theme.palette.secondary.main, 0.6),
                fontSize: size === "small" ? 20 : 24,
              })}
            />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton
              size={size}
              onClick={handleClear}
              disabled={disabled}
              sx={(theme) => ({
                color: alpha(theme.palette.text.secondary, 0.7),
                "&:hover": {
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.action.hover, 0.3),
                },
              })}>
              <ClearIcon sx={{ fontSize: size === "small" ? 16 : 20 }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          paddingLeft: 0.5, // Adjust padding for search icon
          "& .MuiInputBase-input": {
            paddingLeft: 1, // Space between search icon and text
          },
        },
      }}
    />
  )
}

// Advanced Search Field Component with integrated field selector
interface StyledAdvancedSearchFieldProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  searchField: string
  onSearchFieldChange: (field: string) => void
  searchOptions: Array<{ value: string; label: string }>
  fullWidth?: boolean
  size?: "small" | "medium"
  disabled?: boolean
  id?: string
  name?: string
}

export const UAAdvancedSearchField: React.FC<StyledAdvancedSearchFieldProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  searchField,
  onSearchFieldChange,
  searchOptions,
  fullWidth = true,
  size = "small",
  disabled = false,
  id,
  name,
}) => {
  // Generate unique IDs for the search input and field selector
  const searchInputId = id || "ua-advanced-search-input"
  const searchInputName = name || searchInputId
  const fieldSelectorId = `${searchInputId}-field-selector`
  const fieldSelectorLabelId = `${fieldSelectorId}-label`
  const handleClear = () => {
    onChange("")
    onSearchFieldChange("all")
  }

  const currentOption = searchOptions.find((opt) => opt.value === searchField)
  const dynamicPlaceholder =    searchField === "all"
      ? "Search all fields..."
      : `Search by ${currentOption?.label.toLowerCase() || "field"}...`

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "stretch",
        border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
        borderRadius: theme.spacing(1),  // 8px - middle ground
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        transition: "all 0.25s ease-in-out",
        height: size === "small" ? "40px" : "56px",
        overflow: "hidden",
        mt: theme.spacing(0.25),
        "&:hover": {
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          borderColor: alpha(theme.palette.secondary.main, 0.6),
        },
        ...(fullWidth && { width: "100%" }),
      })}>
      {/* Field Selector Dropdown */}
      <Box
        sx={(theme) => ({
          position: "relative",
          borderRight: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          display: "flex",
          alignItems: "center",
        })}>
        <StyledTextField
          select
          value={searchField}
          onChange={(e) => onSearchFieldChange(e.target.value)}
          size={size}
          disabled={disabled}
          variant="outlined"
          id={fieldSelectorId}
          name={fieldSelectorId}
          InputLabelProps={{
            id: fieldSelectorLabelId,
          }}
          SelectProps={{
            labelId: fieldSelectorLabelId,
          }}
          sx={(theme) => ({
            minWidth: "140px",
            "& .MuiOutlinedInput-root": {
              border: "none",
              borderRadius: 0,
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "transparent",
                "& fieldset": { border: "none" },
              },
              "&.Mui-focused": {
                backgroundColor: "transparent",
                boxShadow: "none",
                transform: "none",
                "& fieldset": { border: "none" },
              },
              "& fieldset": { border: "none" },
            },
            "& .MuiInputLabel-root": {
              display: "none",
            },
            "& .MuiSelect-select": {
              fontSize: "0.8rem",
              fontWeight: 500,
              color: theme.palette.secondary.main,
              paddingRight: "24px !important",
            },
            "& .MuiSelect-icon": {
              color: alpha(theme.palette.secondary.main, 0.7),
              right: "4px",
            },
          })}>
          {searchOptions.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: "0.8rem" }}>
              {option.label}
            </MenuItem>
          ))}
        </StyledTextField>
      </Box>

      {/* Search Input */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          px: 1,
        }}>
        <SearchIcon
          sx={(theme) => ({
            color: alpha(theme.palette.secondary.main, 0.6),
            fontSize: size === "small" ? 20 : 24,
            mr: 1,
          })}
        />
        <Box
          component="input"
          id={searchInputId}
          name={searchInputName}
          placeholder={placeholder || dynamicPlaceholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          disabled={disabled}
          sx={(theme) => ({
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            flex: 1,
            fontSize: "0.875rem",
            fontWeight: 400,
            color: theme.palette.text.primary,
            fontFamily: "inherit",
            height: size === "small" ? "40px" : "56px",
            "&::placeholder": {
              color: alpha(theme.palette.text.secondary, 0.7),
              opacity: 1,
            },
            "&:disabled": {
              color: alpha(theme.palette.text.secondary, 0.6),
            },
          })}
        />

        {/* Clear Button */}
        {(value || searchField !== "all") && (
          <IconButton
            size={size}
            onClick={handleClear}
            disabled={disabled}
            sx={(theme) => ({
              color: alpha(theme.palette.text.secondary, 0.7),
              p: 0.5,
              ml: 0.5,
              "&:hover": {
                color: theme.palette.text.primary,
                backgroundColor: alpha(theme.palette.action.hover, 0.3),
              },
            })}>
            <ClearIcon sx={{ fontSize: size === "small" ? 16 : 20 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  )
}
