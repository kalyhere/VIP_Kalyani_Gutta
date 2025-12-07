import { Chip, styled } from "@mui/material"

/**
 * Status Chip - Semantic status indicators
 * Use for assignment statuses, task states, and workflow indicators
 */

export const NotStartedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.grey[700],
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.grey[600],
  },
}))

export const InProgressChip = styled(Chip)(({ theme }) => ({
  backgroundColor: `${theme.palette.info.main}14`, // 14 = 8% opacity
  color: theme.palette.info.dark,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.info.main,
  },
}))

export const PendingReviewChip = styled(Chip)(({ theme }) => ({
  backgroundColor: `${theme.palette.secondary.main}14`, // 14 = 8% opacity
  color: theme.palette.secondary.dark,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.secondary.main,
  },
}))

export const CompletedChip = styled(Chip)(({ theme }) => ({
  backgroundColor: `${theme.palette.success.main}14`, // 14 = 8% opacity
  color: theme.palette.success.dark,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.success.main,
  },
}))

export const OverdueChip = styled(Chip)(({ theme }) => ({
  backgroundColor: `${theme.palette.error.main}14`, // 14 = 8% opacity
  color: theme.palette.error.dark,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.error.main,
  },
}))

export const WarningChip = styled(Chip)(({ theme }) => ({
  backgroundColor: `${theme.palette.warning.main}14`, // 14 = 8% opacity
  color: theme.palette.warning.dark,
  fontWeight: 600,
  fontSize: "0.75rem",
  height: 24,
  "& .MuiChip-icon": {
    color: theme.palette.warning.main,
  },
}))
