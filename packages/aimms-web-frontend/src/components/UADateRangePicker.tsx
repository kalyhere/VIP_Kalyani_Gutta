import React, { useState } from "react"
import {
  Box,
  Popover,
  Button,
  alpha,
  Chip,
  Typography,
  IconButton,
  Divider,
  Stack,
  useTheme,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import ClearIcon from "@mui/icons-material/Clear"
import CheckIcon from "@mui/icons-material/Check"
import dayjs, { Dayjs } from "dayjs"

export type DateRangeMacro = "all" | "today" | "week" | "month"

export interface DateRange {
  start: string | null // ISO date string
  end: string | null // ISO date string
  macro?: DateRangeMacro
}

interface UADateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  fullWidth?: boolean
  size?: "small" | "medium"
  disabled?: boolean
  id?: string
  name?: string
}

const macroOptions = [
  { value: "all" as const, label: "All Time" },
  { value: "today" as const, label: "Today" },
  { value: "week" as const, label: "This Week" },
  { value: "month" as const, label: "This Month" },
]

const getMacroDateRange = (macro: DateRangeMacro): { start: Dayjs | null; end: Dayjs | null } => {
  const now = dayjs()

  switch (macro) {
    case "all":
      return { start: null, end: null }
    case "today":
      return {
        start: now.startOf("day"),
        end: now.endOf("day"),
      }
    case "week":
      return {
        start: now.startOf("week"),
        end: now.endOf("week"),
      }
    case "month":
      return {
        start: now.startOf("month"),
        end: now.endOf("month"),
      }
    default:
      return { start: null, end: null }
  }
}

const formatDateRangeDisplay = (range: DateRange): string => {
  if (range.macro) {
    const option = macroOptions.find((opt) => opt.value === range.macro)
    return option?.label || "Select Range"
  }

  if (!range.start && !range.end) {
    return "All Time"
  }

  if (range.start && range.end) {
    return `${dayjs(range.start).format("MMM D, YYYY")} - ${dayjs(range.end).format("MMM D, YYYY")}`
  }

  if (range.start) {
    return `From ${dayjs(range.start).format("MMM D, YYYY")}`
  }

  if (range.end) {
    return `Until ${dayjs(range.end).format("MMM D, YYYY")}`
  }

  return "Select Range"
}

export const UADateRangePicker: React.FC<UADateRangePickerProps> = ({
  value,
  onChange,
  fullWidth = false,
  size = "small",
  disabled = false,
  id,
  name,
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [tempStart, setTempStart] = useState<Dayjs | null>(value?.start ? dayjs(value.start) : null)
  const [tempEnd, setTempEnd] = useState<Dayjs | null>(value?.end ? dayjs(value.end) : null)
  const [selectedMacro, setSelectedMacro] = useState<DateRangeMacro | undefined>(value?.macro)

  const fieldId = id || "ua-date-range-picker"
  const fieldName = name || fieldId

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setTempStart(value?.start ? dayjs(value.start) : null)
    setTempEnd(value?.end ? dayjs(value.end) : null)
    setSelectedMacro(value?.macro)
  }

  const handleClose = () => {
    setAnchorEl(null)
    // Reset temp values on close
    setTempStart(value?.start ? dayjs(value.start) : null)
    setTempEnd(value?.end ? dayjs(value.end) : null)
    setSelectedMacro(value?.macro)
  }

  const handleMacroClick = (macro: DateRangeMacro) => {
    const range = getMacroDateRange(macro)
    setTempStart(range.start)
    setTempEnd(range.end)
    setSelectedMacro(macro)
  }

  const handleCustomDateChange = () => {
    // When user manually sets dates, clear the macro
    setSelectedMacro(undefined)
  }

  const handleApply = () => {
    onChange({
      start: tempStart ? tempStart.toISOString() : null,
      end: tempEnd ? tempEnd.toISOString() : null,
      macro: selectedMacro,
    })
    handleClose()
  }

  const handleClear = () => {
    onChange({
      start: null,
      end: null,
      macro: "all",
    })
    handleClose()
  }

  const open = Boolean(anchorEl)
  const hasValue = value?.start || value?.end || (value?.macro && value.macro !== "all")

  return (
    <>
      <Box
        sx={{
          display: "inline-flex",
          ...(fullWidth && { width: "100%" }),
        }}>
        <Button
          id={fieldId}
          name={fieldName}
          onClick={handleOpen}
          disabled={disabled}
          variant="outlined"
          startIcon={<CalendarTodayIcon sx={{ fontSize: size === "small" ? 16 : 20 }} />}
          sx={{
            height: size === "small" ? "40px" : "56px",
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.default, 0.6),
            borderColor: alpha(theme.palette.secondary.main, 0.4),
            borderWidth: 1.5,
            color: theme.palette.secondary.main,
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            px: 2,
            transition: "all 0.25s ease-in-out",
            justifyContent: "space-between",
            ...(fullWidth && { width: "100%" }),
            "&:hover": {
              backgroundColor: alpha(theme.palette.background.default, 0.9),
              borderColor: alpha(theme.palette.secondary.main, 0.6),
              borderWidth: 1.5,
              color: theme.palette.secondary.main,
            },
            "&:focus": {
              backgroundColor: theme.palette.background.paper,
              boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.08)}, 0 0 0 2px ${alpha(theme.palette.secondary.main, 0.12)}`,
              borderColor: theme.palette.secondary.main,
              borderWidth: 2,
            },
            "& .MuiButton-startIcon": {
              color: alpha(theme.palette.secondary.main, 0.6),
            },
          }}>
          {formatDateRangeDisplay(value)}
          {hasValue && (
            <Box
              component="span"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                ml: 1,
                p: 0.5,
                borderRadius: 1,
                cursor: "pointer",
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.divider, 0.5),
                },
              }}>
              <ClearIcon sx={{ fontSize: size === "small" ? 14 : 16 }} />
            </Box>
          )}
        </Button>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.text.primary, 0.12)}`,
              minWidth: 320,
              maxWidth: 480,
            },
          },
        }}>
        <Box sx={{ p: 2 }}>
          {/* Macro Buttons */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                mb: 1,
                display: "block",
              }}>
              Quick Select
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {macroOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => handleMacroClick(option.value)}
                  icon={
                    selectedMacro === option.value ? (
                      <CheckIcon sx={{ fontSize: "0.875rem !important" }} />
                    ) : undefined
                  }
                  sx={{
                    bgcolor:
                      selectedMacro === option.value
                        ? theme.palette.secondary.main
                        : alpha(theme.palette.secondary.main, 0.08),
                    color: selectedMacro === option.value ? theme.palette.background.paper : theme.palette.secondary.main,
                    fontWeight: 500,
                    fontSize: "0.8125rem",
                    height: 32,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor:
                        selectedMacro === option.value
                          ? theme.palette.secondary.dark
                          : alpha(theme.palette.secondary.main, 0.15),
                    },
                    "& .MuiChip-icon": {
                      color: theme.palette.background.paper,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Custom Date Range */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                mb: 1,
                display: "block",
              }}>
              Custom Range
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2}>
                <DatePicker
                  label="Start Date"
                  value={tempStart}
                  onChange={(newValue) => {
                    setTempStart(newValue)
                    handleCustomDateChange()
                  }}
                  maxDate={tempEnd || undefined}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.6),
                          "& fieldset": {
                            borderColor: alpha(theme.palette.secondary.main, 0.4),
                          },
                          "&:hover fieldset": {
                            borderColor: alpha(theme.palette.secondary.main, 0.6),
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme.palette.secondary.main,
                          },
                        },
                      },
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={tempEnd}
                  onChange={(newValue) => {
                    setTempEnd(newValue)
                    handleCustomDateChange()
                  }}
                  minDate={tempStart || undefined}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.background.default, 0.6),
                          "& fieldset": {
                            borderColor: alpha(theme.palette.secondary.main, 0.4),
                          },
                          "&:hover fieldset": {
                            borderColor: alpha(theme.palette.secondary.main, 0.6),
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: theme.palette.secondary.main,
                          },
                        },
                      },
                    },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClose}
              sx={{
                color: theme.palette.text.secondary,
                borderColor: alpha(theme.palette.divider, 0.5),
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  borderColor: theme.palette.divider,
                  backgroundColor: alpha(theme.palette.background.default, 0.3),
                },
              }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApply}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                color: theme.palette.background.paper,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.light, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.light, 0.4)}`,
                },
              }}>
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}
