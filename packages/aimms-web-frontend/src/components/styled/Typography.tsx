import { Typography, styled } from "@mui/material"

/**
 * Page title - largest heading
 * Use for main page titles and hero sections
 */
export const PageTitle = styled(Typography)(({ theme }) => ({
  variant: "h1",
  fontSize: theme.typography.h1.fontSize,
  fontWeight: theme.typography.h1.fontWeight,
  lineHeight: theme.typography.h1.lineHeight,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
}))

/**
 * Section title - major sections within a page
 * Use for major sections and content areas
 */
export const SectionTitle = styled(Typography)(({ theme }) => ({
  variant: "h2",
  fontSize: theme.typography.h2.fontSize,
  fontWeight: theme.typography.h2.fontWeight,
  lineHeight: theme.typography.h2.lineHeight,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1.5),
}))

/**
 * Subsection title - nested sections
 * Use for subsections and card headers
 */
export const SubsectionTitle = styled(Typography)(({ theme }) => ({
  variant: "h3",
  fontSize: theme.typography.h3.fontSize,
  fontWeight: theme.typography.h3.fontWeight,
  lineHeight: theme.typography.h3.lineHeight,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}))

/**
 * Card title - titles within cards and panels
 * Use for card headers and small section titles
 */
export const CardTitle = styled(Typography)(({ theme }) => ({
  variant: "h4",
  fontSize: theme.typography.h4.fontSize,
  fontWeight: theme.typography.h4.fontWeight,
  lineHeight: theme.typography.h4.lineHeight,
  color: theme.palette.text.primary,
}))

/**
 * Body text - standard paragraph text
 * Use for main content, descriptions, and paragraphs
 */
export const BodyText = styled(Typography)(({ theme }) => ({
  variant: "body1",
  fontSize: theme.typography.body1.fontSize,
  fontWeight: theme.typography.body1.fontWeight,
  lineHeight: theme.typography.body1.lineHeight,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}))

/**
 * Small text - smaller body text
 * Use for secondary information and helper text
 */
export const SmallText = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.body2.fontWeight,
  lineHeight: theme.typography.body2.lineHeight,
  color: theme.palette.text.secondary,
}))

/**
 * Caption text - very small supplementary text
 * Use for captions, labels, and metadata
 */
export const Caption = styled(Typography)(({ theme }) => ({
  variant: "caption",
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.caption.fontWeight,
  lineHeight: theme.typography.caption.lineHeight,
  color: theme.palette.text.secondary,
}))

/**
 * Overline text - uppercase small text
 * Use for eyebrows, categories, and labels
 */
export const Overline = styled(Typography)(({ theme }) => ({
  variant: "overline",
  fontSize: theme.typography.overline.fontSize,
  fontWeight: theme.typography.overline.fontWeight,
  lineHeight: theme.typography.overline.lineHeight,
  letterSpacing: theme.typography.overline.letterSpacing,
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
}))

/**
 * Error text - for error messages
 * Use for form validation errors and error states
 */
export const ErrorText = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 500,
  color: theme.palette.error.main,
}))

/**
 * Success text - for success messages
 * Use for confirmation messages and success states
 */
export const SuccessText = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.body2.fontSize,
  fontWeight: 500,
  color: theme.palette.success.main,
}))

/**
 * Link text - styled links
 * Use for clickable text links
 */
export const LinkText = styled(Typography)(({ theme }) => ({
  variant: "body1",
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 500,
  color: theme.palette.primary.main,
  cursor: "pointer",
  textDecoration: "underline",
  transition: "color 0.2s ease-in-out",
  "&:hover": {
    color: theme.palette.primary.dark,
  },
}))

/**
 * Muted text - de-emphasized text
 * Use for placeholders and less important information
 */
export const MutedText = styled(Typography)(({ theme }) => ({
  variant: "body2",
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.disabled,
}))
