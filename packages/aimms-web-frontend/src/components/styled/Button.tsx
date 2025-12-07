import { Button, styled } from "@mui/material"

/**
 * Primary action button - uses primary color (Arizona Red)
 * Use for main CTAs like "Submit", "Save", "Create"
 */
export const PrimaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  boxShadow: theme.shadows[2],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: theme.shadows[4],
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: theme.shadows[2],
  },
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}))

/**
 * Secondary action button - uses secondary color (Azurite)
 * Use for secondary actions like "Cancel", "Back", "Skip"
 */
export const SecondaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  boxShadow: theme.shadows[2],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.secondary.dark,
    boxShadow: theme.shadows[4],
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: theme.shadows[2],
  },
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}))

/**
 * Outlined button - uses border instead of fill
 * Use for tertiary actions or when you need less visual weight
 */
export const OutlinedButton = styled(Button)(({ theme }) => ({
  backgroundColor: "transparent",
  color: theme.palette.primary.main,
  fontWeight: 500,
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  border: `2px solid ${theme.palette.primary.main}`,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderColor: theme.palette.primary.main,
  },
  "&:disabled": {
    borderColor: theme.palette.action.disabled,
    color: theme.palette.action.disabled,
  },
}))

/**
 * Text button - minimal styling, no background or border
 * Use for low-priority actions like "Learn more", "View details"
 */
export const TextButton = styled(Button)(({ theme }) => ({
  backgroundColor: "transparent",
  color: theme.palette.primary.main,
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:disabled": {
    color: theme.palette.action.disabled,
  },
}))

/**
 * Danger button - for destructive actions
 * Use for actions like "Delete", "Remove", "Cancel subscription"
 */
export const DangerButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  boxShadow: theme.shadows[2],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.error.dark,
    boxShadow: theme.shadows[4],
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: theme.shadows[2],
  },
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}))

/**
 * Success button - for positive confirmations
 * Use for actions like "Approve", "Confirm", "Accept"
 */
export const SuccessButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  textTransform: "none",
  boxShadow: theme.shadows[2],
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.success.dark,
    boxShadow: theme.shadows[4],
    transform: "translateY(-1px)",
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: theme.shadows[2],
  },
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}))

/**
 * Icon button with styled background
 * Use for icon-only actions like "Edit", "Delete", "More options"
 */
export const IconButton = styled(Button)(({ theme }) => ({
  minWidth: 0,
  padding: theme.spacing(1),
  borderRadius: theme.spacing(0.5),  // 4px - less rounded
  color: theme.palette.text.secondary,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
  "&:disabled": {
    color: theme.palette.action.disabled,
  },
}))
