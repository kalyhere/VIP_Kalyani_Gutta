import { Box, Paper, styled, alpha } from "@mui/material"
import React from "react"

/**
 * Stat Card - Dashboard statistics display
 * Use for displaying key metrics, counts, and KPIs
 */

export const StatCardContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1.5),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    opacity: 0,
    transition: "opacity 0.3s ease-in-out",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
    "&::before": {
      opacity: 1,
    },
  },
}))

export const StatIconWrapper = styled(Box)<{ color?: string }>(({ theme, color }) => ({
  width: 36,
  height: 36,
  borderRadius: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.1)} 0%, ${alpha(color || theme.palette.primary.main, 0.2)} 100%)`,
  color: color || theme.palette.primary.main,
  marginBottom: theme.spacing(1),
  transition: "all 0.3s ease-in-out",
  "& svg": {
    fontSize: "1.25rem",
  },
  [`${StatCardContainer}:hover &`]: {
    transform: "scale(1.1)",
  },
}))

export const StatValue = styled(Box)(({ theme }) => ({
  fontSize: "1.75rem",
  fontWeight: 700,
  lineHeight: 1,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
  fontVariantNumeric: "tabular-nums",
}))

export const StatLabel = styled(Box)(({ theme }) => ({
  fontSize: "0.75rem",
  fontWeight: 500,
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
}))

export const StatTrend = styled(Box)<{ positive?: boolean }>(({ theme, positive }) => ({
  fontSize: "0.75rem",
  fontWeight: 600,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.25),
  marginTop: theme.spacing(0.5),
}))

// Composite component for easy usage
interface StatCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
  color?: string
  trend?: {
    value: string
    positive: boolean
  }
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color,
  trend,
  onClick,
}) => {
  return (
    <StatCardContainer onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
      <StatIconWrapper color={color}>{icon}</StatIconWrapper>
      <StatValue>{value}</StatValue>
      <StatLabel>{label}</StatLabel>
      {trend && <StatTrend positive={trend.positive}>{trend.value}</StatTrend>}
    </StatCardContainer>
  )
}
